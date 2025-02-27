import React from 'react';

const getError = (s) => {
  if (s.max_inside < 0) {
    return 'Max inside must be greater than 0';
  }
  if (s.max_outside < 0) {
    return 'Max outside must be greater than 0';
  }
  return '';
};

export default function useEBICPrimerDesignSettings() {
  const [settings, setSettings] = React.useState({
    max_inside: 50,
    max_outside: 20,
  });
  const [error, setError] = React.useState(getError(settings));
  const updateSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };
  React.useEffect(() => {
    setError(getError(settings));
  }, [settings]);
  return { ...settings, error, updateSettings };
}
