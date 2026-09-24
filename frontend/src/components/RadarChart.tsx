import React from 'react';

interface RadarChartProps {
  data: {
    label: string;
    value: number; // 0 to 100
  }[];
  size?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({ data, size = 240 }) => {
  const width = size + 40;
  const height = size + 20;
  const center = { x: width / 2, y: height / 2 };
  const radius = size * 0.31;
  const angleStep = (Math.PI * 2) / data.length;

  // Generate polygon points for value
  const points = data
    .map((item, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = (Math.max(10, Math.min(100, item.value)) / 100) * radius;
      const x = center.x + r * Math.cos(angle);
      const y = center.y + r * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  // Generate web rings
  const rings = [0.25, 0.5, 0.75, 1.0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ overflow: 'visible', maxWidth: `${width}px` }}
      >
        {/* Background Rings */}
        {rings.map((ringFactor) => {
          const ringPoints = data
            .map((_, i) => {
              const angle = i * angleStep - Math.PI / 2;
              const r = radius * ringFactor;
              const x = center.x + r * Math.cos(angle);
              const y = center.y + r * Math.sin(angle);
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(' ');
          return (
            <polygon
              key={ringFactor}
              points={ringPoints}
              fill="none"
              stroke="#242424"
              strokeWidth="1"
              strokeDasharray={ringFactor === 1 ? 'none' : '2,2'}
            />
          );
        })}

        {/* Spoke lines */}
        {data.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x = center.x + radius * Math.cos(angle);
          const y = center.y + radius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={center.x}
              y1={center.y}
              x2={x}
              y2={y}
              stroke="#242424"
              strokeWidth="1"
            />
          );
        })}

        {/* Data polygon filled with red glow */}
        <polygon
          points={points}
          fill="rgba(227, 27, 43, 0.25)"
          stroke="#E31B2B"
          strokeWidth="2"
        />

        {/* Vertex points */}
        {data.map((item, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const r = (Math.max(10, Math.min(100, item.value)) / 100) * radius;
          const x = center.x + r * Math.cos(angle);
          const y = center.y + r * Math.sin(angle);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3.5"
              fill="#FFFFFF"
              stroke="#E31B2B"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Labels with smart text-anchoring */}
        {data.map((item, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const labelRadius = radius + 18;
          const x = center.x + labelRadius * Math.cos(angle);
          const y = center.y + labelRadius * Math.sin(angle);

          // Smart text anchor based on angle
          let textAnchor: 'start' | 'middle' | 'end' = 'middle';
          const cos = Math.cos(angle);
          if (cos > 0.3) textAnchor = 'start';
          else if (cos < -0.3) textAnchor = 'end';

          return (
            <text
              key={i}
              x={x}
              y={y + 3}
              textAnchor={textAnchor}
              fontSize="10"
              fontWeight="700"
              fill="#D4D4D4"
              fontFamily="Inter, sans-serif"
            >
              {item.label} ({item.value}%)
            </text>
          );
        })}
      </svg>
    </div>
  );
};
