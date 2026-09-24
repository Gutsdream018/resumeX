import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface CardRevealProps {
  children: React.ReactNode;
  index?: number;
  className?: string;
  style?: React.CSSProperties;
  enableHoverLift?: boolean;
  borderRadius?: string | number;
}

export const CardReveal: React.FC<CardRevealProps> = ({
  children,
  index = 0,
  className = '',
  style = {},
  enableHoverLift = true,
  borderRadius,
}) => {
  const prefersReduced = useReducedMotion();

  // Stagger sibling cards by 70ms, max 600ms total
  const delay = Math.min(index * 0.07, 0.6);
  const radius = borderRadius || style?.borderRadius || '14px';

  if (prefersReduced) {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.15, margin: '-80px' }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{
          position: 'relative',
          borderRadius: radius,
          ...style,
        }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{
        opacity: 0,
        y: 24,
        scale: 0.97,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      viewport={{ once: true, amount: 0.15, margin: '-80px' }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={
        enableHoverLift
          ? {
              y: -4,
              transition: { duration: 0.2, ease: 'easeOut' },
            }
          : undefined
      }
      style={{
        position: 'relative',
        borderRadius: radius,
        willChange: 'transform, opacity',
        ...style,
      }}
    >
      {/* One-time soft red border glow as card lands (animates ONLY opacity) */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        whileInView={{
          opacity: [0, 1, 0],
        }}
        viewport={{ once: true, amount: 0.15, margin: '-80px' }}
        transition={{
          duration: 0.85,
          delay: delay + 0.42,
          ease: 'easeInOut',
          times: [0, 0.45, 1],
        }}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          border: '1px solid rgba(227, 27, 43, 0.6)',
          boxShadow: '0 0 25px rgba(227, 27, 43, 0.25)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
      {children}
    </motion.div>
  );
};
