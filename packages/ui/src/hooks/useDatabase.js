import React from 'react';
import { useConfig } from './useConfig';
import eLabFTWInterface from '../components/eLabFTW/eLabFTWInterface';
import dummyInterface from '../components/dummy/DummyInterface';

export default function useDatabase() {
  const { database: databaseName } = useConfig();

  return React.useMemo(() => {
    if (databaseName === 'elabftw') {
      return eLabFTWInterface;
    }
    if (databaseName === 'dummy') {
      return dummyInterface;
    }
    return null;
  }, [databaseName]);
}
