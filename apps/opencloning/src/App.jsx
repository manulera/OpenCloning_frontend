import React, { useState, useEffect } from 'react';
import { ConfigProvider } from '@opencloning/ui/providers/ConfigProvider';
import getHttpClient from '@opencloning/utils/getHttpClient';
import MainAppBar from '@opencloning/ui/components/navigation/MainAppBar';
import OpenCloning from '@opencloning/ui/components/OpenCloning';
import useUrlParamsLoader from '@opencloning/ui/hooks/useUrlParamsLoader';
import useInitializeApp from '@opencloning/ui/hooks/useInitializeApp';
import { useConfig } from '@opencloning/ui/hooks/useConfig';

// Create a basic HTTP client for loading config (doesn't require backendUrl)
const configHttpClient = getHttpClient([]);

function AppContent() {
  const { showAppBar } = useConfig();

  // Initialize app-level concerns (known errors, session storage)
  useInitializeApp();

  // Load sequences from URL parameters if present
  useUrlParamsLoader();

  return (
    <div className="App">
      {showAppBar && (
        <header className="App-header">
          <div className="app-title">
            <MainAppBar />
          </div>
        </header>
      )}
      <OpenCloning />
    </div>
  );
}

function App() {
  const [config, setConfig] = useState(null);
  const [message, setMessage] = useState('Loading config...');

  useEffect(() => {
    async function loadConfig() {
      setMessage('Loading config...');
      try {
        const { data } = await configHttpClient.get(`${import.meta.env.BASE_URL}config.json`);
        // Validate that data is an object, not HTML
        if (typeof data === 'object' && data !== null && !Object.prototype.hasOwnProperty.call(data, 'length')) {
          setConfig(data);
        } else {
          console.error('Invalid config data received:', data);
          setMessage('Invalid config data received');
        }
      } catch (error) {
        console.error('Failed to load config:', error);
        setMessage('Failed to load config');
      }
    }

    loadConfig();
  }, []);

  if (config === null) {
    return <div className="loading-state-message">{message}</div>;
  }

  return (
    <ConfigProvider config={config}>
      <AppContent />
    </ConfigProvider>
  );
}

export default App;
