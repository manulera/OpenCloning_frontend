import { useConfig } from './useConfig';

export default function useBackendRoute() {
  const { backendUrl: configBackendUrl } = useConfig();
  
  if (!configBackendUrl) {
    return () => {};
  }
  const backendUrl = configBackendUrl.endsWith('/') ? configBackendUrl : `${configBackendUrl}/`;

  return function backendRoute(path) {
    if (!backendUrl) {
      throw new Error('Backend URL not set');
    }
    //   console.log(new URL('/api', window.location.origin).href);
    //   console.log(new URL(import.meta.env.VITE_REACT_APP_BACKEND_URL, window.location.origin).href);
    // This handles both the case where the backend url is absolute and the case where it is relative
    const backendRoot = new URL(backendUrl, window.location.origin).href;
    // Remove trailing slash from path
    const sanitizedPath = path.endsWith('/') ? path.slice(0, -1) : path;
    return new URL(sanitizedPath, backendRoot).href;
  };
}
