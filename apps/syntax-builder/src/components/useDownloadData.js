import React, { useCallback } from 'react';
import { useFormData } from '../context/FormDataContext';
import { downloadTextFile } from '@opencloning/utils/readNwrite';

export function useDownloadData() {
  const { parts} = useFormData();

  const downloadData = useCallback(() => {
    downloadTextFile(JSON.stringify(parts), 'syntax.json');
  }, [parts]);

  return downloadData ;
}
