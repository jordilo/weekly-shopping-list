"use client";

import { useEffect } from 'react';

export function SWRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    } else if ('serviceWorker' in navigator && process.env.NODE_ENV === 'development') {
        // In development, also register to test offline flow
        navigator.serviceWorker
            .register('/sw.js')
            .then((registration) => {
            console.log('Dev SW registered: ', registration);
            })
            .catch((registrationError) => {
            console.log('Dev SW registration failed: ', registrationError);
            });
    }
  }, []);

  return null;
}
