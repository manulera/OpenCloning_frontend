import React from 'react';
import { useSelector } from 'react-redux';
import eLabFTWInterface from '../components/eLabFTW/eLabFTWInterface';

export default function useDatabase() {
  const databaseName = useSelector((state) => state.cloning.config.database);

  return React.useMemo(() => {
    if (databaseName === 'elabftw') {
      return eLabFTWInterface();
    }
    return null;
  }, [databaseName]);
}
