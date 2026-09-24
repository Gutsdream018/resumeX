import React from 'react';
import { Aurora } from './Aurora';

/**
 * CosmicAuroraSpace
 * Spans end-to-end across the entire top of the screen, crowning the cosmic space
 * environment with luminous multi-harmonic aurora curtains while blending downward into stars.
 */
export const CosmicAuroraSpace: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="cosmic-aurora-viewport"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100vw',
        height: 'min(760px, 80vh)',
        pointerEvents: 'none',
        zIndex: 0,
        mixBlendMode: 'screen',
        maskImage: 'linear-gradient(to bottom, black 25%, rgba(0, 0, 0, 0.85) 60%, transparent 98%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 25%, rgba(0, 0, 0, 0.85) 60%, transparent 98%)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <Aurora
          colorStops={["#5227FF", "#7cff67", "#5227FF"]}
          amplitude={1.15}
          blend={0.5}
        />
      </div>
    </div>
  );
};

export default CosmicAuroraSpace;
