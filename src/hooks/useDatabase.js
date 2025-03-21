import React from 'react';
import { useSelector } from 'react-redux';
import eLabFTWInterface from '../components/eLabFTW/eLabFTWInterface';
import dummyInterface from '../components/dummy/DummyInterface';

export default function useDatabase() {
  const databaseName = useSelector((state) => state.cloning.config.database);

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
