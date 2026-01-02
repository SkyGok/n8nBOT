/**
 * Page Transition component
 * Provides smooth fade/slide transitions between route changes
 */

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<'entering' | 'entered'>('entered');

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('entering');
      // Use requestAnimationFrame for smoother transitions
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setDisplayLocation(location);
          setTransitionStage('entered');
        });
      });
    }
  }, [location, displayLocation]);

  return (
    <div
      className={`page-transition ${
        transitionStage === 'entering' ? 'page-transition-entering' : 'page-transition-entered'
      }`}
      key={displayLocation.pathname}
    >
      {children}
    </div>
  );
};

