import React from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { pageTransition } from '../../hooks/useAnimation';

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
      animate: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
      exit: { opacity: 0, x: -20, transition: { duration: 0.3 } }
    },
    scale: {
      initial: { opacity: 0, scale: 0.98 },
      animate: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] } },
      exit: { opacity: 0, scale: 0.98, transition: { duration: 0.3 } }
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
