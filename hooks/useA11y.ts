import { useCallback, useEffect, useState } from 'react';

export function useA11y() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    
    setReducedMotion(motionQuery.matches);
    setHighContrast(contrastQuery.matches);
    
    const motionHandler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    const contrastHandler = (e: MediaQueryListEvent) => setHighContrast(e.matches);
    
    motionQuery.addEventListener('change', motionHandler);
    contrastQuery.addEventListener('change', contrastHandler);
    
    return () => {
      motionQuery.removeEventListener('change', motionHandler);
      contrastQuery.removeEventListener('change', contrastHandler);
    };
  }, []);

  const trapFocus = useCallback((element: HTMLElement | null) => {
    if (!element) return;
    
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };
    
    element.addEventListener('keydown', handleTabKey);
    firstElement?.focus();
    
    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;
    document.body.appendChild(announcer);
    setTimeout(() => document.body.removeChild(announcer), 1000);
  }, []);

  return {
    reducedMotion,
    highContrast,
    trapFocus,
    announce
  };
}

export default useA11y;
