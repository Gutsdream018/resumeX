import React, { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Color, Triangle } from 'ogl';
import './Aurora.css';

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;
uniform float uLightMode;
uniform vec2 uMouse;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v){
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
      0.5 - vec3(
          dot(x0, x0),
          dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)
      ), 
      0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) {              \
  int index = 0;                                            \
  for (int i = 0; i < 2; i++) {                               \
     ColorStop currentColor = colors[i];                    \
     bool isInBetween = currentColor.position <= factor;    \
     index = int(mix(float(index), float(i), float(isInBetween))); \
  }                                                         \
  ColorStop currentColor = colors[index];                   \
  ColorStop nextColor = colors[index + 1];                  \
  float range = nextColor.position - currentColor.position; \
  float lerpFactor = (factor - currentColor.position) / range; \
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  
  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);
  
  // Smooth, subtle cursor movement response
  vec2 toMouse = uv - uMouse;
  float mouseDist = length(toMouse);
  float influence = smoothstep(0.45, 0.0, mouseDist);
  vec2 smoothCursorShift = toMouse * influence * 0.06;
  float gentleRipple = sin(mouseDist * 9.5 - uTime * 1.6) * influence * 0.032;
  
  // Multi-harmonic visual depth across end-to-end screen
  vec2 waveInput1 = vec2((uv.x + smoothCursorShift.x) * 2.2 + uTime * 0.10 + gentleRipple, uTime * 0.22);
  float n1 = snoise(waveInput1);
  
  vec2 waveInput2 = vec2((uv.x + smoothCursorShift.x * 0.6) * 4.4 - uTime * 0.14, uTime * 0.32);
  float n2 = snoise(waveInput2) * 0.36;
  
  // Subtle vertical aurora ray streaks
  float rays = snoise(vec2(uv.x * 14.0 + uTime * 0.06, uv.y * 1.8)) * 0.10;
  
  // Sample color ramp with gentle dynamic wave undulation
  float rampX = clamp(uv.x + n2 * 0.12 + gentleRipple * 0.35, 0.0, 1.0);
  vec3 rampColor;
  COLOR_RAMP(colors, rampX, rampColor);
  
  float height = (n1 + n2 + rays) * 0.52 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.22 - gentleRipple * 0.12);
  float intensity = 0.65 * height;
  
  // Glowing celestial crest along the undulating wave ridge
  float crest = pow(clamp(intensity * 0.82, 0.0, 1.0), 3.2) * 0.28;
  
  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);
  
  vec3 auroraColor = (intensity * rampColor) + (crest * vec3(0.72, 1.0, 0.88));
  
  if (uLightMode > 0.5) {
    float energy = clamp(max(intensity, 0.0), 0.0, 1.0);
    float coverage = clamp(auroraAlpha * (0.55 + 0.45 * energy), 0.0, 0.86);
    vec3 chroma = pow(clamp(rampColor, 0.0, 1.0), vec3(1.2));
    float chromaPeak = max(chroma.r, max(chroma.g, chroma.b));
    chroma /= max(chromaPeak, 0.0001);
    fragColor = vec4(mix(vec3(1.0), chroma, min(coverage * 1.08, 0.94)), 1.0);
  } else {
    fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
  }
}
`;

export interface AuroraProps {
  colorStops?: string[];
  amplitude?: number;
  blend?: number;
  lightMode?: boolean;
  time?: number;
  speed?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const Aurora: React.FC<AuroraProps> = (props) => {
  const {
    colorStops = ['#5227FF', '#7cff67', '#5227FF'],
    amplitude = 1.0,
    blend = 0.5,
    lightMode = false,
    speed = 1.0,
    className,
    style,
  } = props;

  const propsRef = useRef(props);
  propsRef.current = props;

  const ctnDom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctn = ctnDom.current;
    if (!ctn) return;

    let renderer: Renderer | null = null;
    let gl: any = null;

    try {
      renderer = new Renderer({
        alpha: true,
        premultipliedAlpha: true,
        antialias: true,
      });
      gl = renderer.gl;
      gl.clearColor(0, 0, 0, 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.canvas.style.backgroundColor = 'transparent';
    } catch (e) {
      console.warn('Aurora WebGL initialization failed, fallback active', e);
      return;
    }

    let program: Program;

    function resize() {
      if (!ctn || !renderer) return;
      const width = ctn.offsetWidth || window.innerWidth || 300;
      const height = ctn.offsetHeight || 500;
      renderer.setSize(width, height);
      if (program) {
        program.uniforms.uResolution.value = [width, height];
      }
    }

    window.addEventListener('resize', resize);
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        resize();
      });
      resizeObserver.observe(ctn);
    }

    const geometry = new Triangle(gl);
    if ((geometry.attributes as any).uv) {
      delete (geometry.attributes as any).uv;
    }

    const stopsArray = (colorStops && colorStops.length >= 3
      ? colorStops.slice(0, 3)
      : ['#5227FF', '#7cff67', '#5227FF']
    ).map((hex) => {
      const c = new Color(hex);
      return [c.r, c.g, c.b];
    });

    const initialWidth = ctn.offsetWidth || window.innerWidth || 300;
    const initialHeight = ctn.offsetHeight || 500;

    program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: amplitude },
        uColorStops: { value: stopsArray },
        uResolution: { value: [initialWidth, initialHeight] },
        uBlend: { value: blend },
        uLightMode: { value: lightMode ? 1 : 0 },
        uMouse: { value: [0.5, 0.5] },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    ctn.appendChild(gl.canvas);

    // Initial resize to capture true dimensions
    resize();

    // Smooth cursor movement tracking
    const mouseState = {
      x: 0.5,
      y: 0.5,
      targetX: 0.5,
      targetY: 0.5,
    };

    const updateMouseCoords = (e: MouseEvent | PointerEvent) => {
      if (!ctn) return;
      const rect = ctn.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / (rect.width || 1);
      const ny = 1.0 - (e.clientY - rect.top) / (rect.height || 1);
      mouseState.targetX = Math.max(0.0, Math.min(1.0, nx));
      mouseState.targetY = Math.max(0.0, Math.min(1.0, ny));
    };

    const handlePointerMove = (e: PointerEvent) => {
      updateMouseCoords(e);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    // Check for prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animateId = 0;
    const update = (t: number) => {
      if (!renderer || !program) return;
      if (!prefersReducedMotion) {
        animateId = requestAnimationFrame(update);
      }
      const { time = t * 0.01, speed: currentSpeed = speed } = propsRef.current;
      program.uniforms.uTime.value = time * (prefersReducedMotion ? 0.05 : currentSpeed) * 0.1;
      program.uniforms.uAmplitude.value = propsRef.current.amplitude ?? amplitude;
      program.uniforms.uBlend.value = propsRef.current.blend ?? blend;
      program.uniforms.uLightMode.value = (propsRef.current.lightMode ?? lightMode) ? 1 : 0;

      // Smooth silky dampening for subtle cursor reaction
      mouseState.x += (mouseState.targetX - mouseState.x) * 0.05;
      mouseState.y += (mouseState.targetY - mouseState.y) * 0.05;
      program.uniforms.uMouse.value = [mouseState.x, mouseState.y];

      const stops = propsRef.current.colorStops ?? colorStops;
      program.uniforms.uColorStops.value = (stops.length >= 3 ? stops.slice(0, 3) : ['#5227FF', '#7cff67', '#5227FF']).map((hex) => {
        const c = new Color(hex);
        return [c.r, c.g, c.b];
      });

      renderer.render({ scene: mesh });
    };

    if (prefersReducedMotion) {
      update(0);
    } else {
      animateId = requestAnimationFrame(update);
    }

    return () => {
      if (animateId) cancelAnimationFrame(animateId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      if (resizeObserver) resizeObserver.disconnect();
      if (ctn && gl?.canvas?.parentNode === ctn) {
        ctn.removeChild(gl.canvas);
      }
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [amplitude, blend, lightMode, speed]);

  return <div ref={ctnDom} className={`aurora-container ${className || ''}`} style={style} />;
};

export default Aurora;
