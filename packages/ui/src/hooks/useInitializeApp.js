import { useEffect } from 'react';

/**
 * Hook to initialize application-level concerns
 * - Clears session storage
 */
export default function useInitializeApp() {

  useEffect(() => {
    // Clear session storage
    // eslint-disable-next-line no-undef
    sessionStorage.clear();
  }, []);
}

