import React from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { pageTransition } from '../../hooks/useAnimation';
import { motionDuration, motionEase } from './motionTokens';

interface AnimatedPageProps {
  children: React.ReactNode;
  className?: string;
  mode?: 'fade' | 'slide' | 'scale';
}

export const AnimatedPage: React.FC<AnimatedPageProps> = ({ 
  children, 
  className = '',
  mode = 'fade'
}) => {
  const variants: Record<NonNullable<AnimatedPageProps['mode']>, Variants> = {
    fade: pageTransition as Variants,
    slide: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0, transition: { duration: motionDuration.slow, ease: motionEase.standard } },
      exit: { opacity: 0, x: -20, transition: { duration: motionDuration.slow } }
    },
    scale: {
      initial: { opacity: 0, scale: 0.98 },
      animate: { opacity: 1, scale: 1, transition: { duration: motionDuration.slow, ease: motionEase.emphasized } },
      exit: { opacity: 0, scale: 0.98, transition: { duration: motionDuration.slow } }
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants[mode]}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface AnimatedPresenceProps {
  children: React.ReactNode;
  mode?: 'wait' | 'sync' | 'popLayout';
}

export const AnimatedPresence: React.FC<AnimatedPresenceProps> = ({ 
  children,
  mode = 'wait'
}) => {
  return (
    <AnimatePresence mode={mode}>
      {children}
    </AnimatePresence>
  );
};

export default AnimatedPage;
