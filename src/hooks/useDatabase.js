import React from 'react';
import { useSelector } from 'react-redux';
import eLabFTWInterface from '../components/eLabFTW/eLabFTWInterface';
import dummyInterface from '../components/dummy/DummyInterface';
import OpenCloningDBInterface from '../components/OpenCloningDB/OpenCloningDBInterface';

export default function useDatabase() {
  const databaseName = useSelector((state) => state.cloning.config.database);

  return React.useMemo(() => {
    if (databaseName === 'elabftw') {
      return eLabFTWInterface;
    }
    if (databaseName === 'dummy') {
      return dummyInterface;
    }
    if (databaseName === 'opencloningdb') {
      return OpenCloningDBInterface;
    }
    return null;
  }, [databaseName]);
}
