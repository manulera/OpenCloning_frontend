import React, { useCallback } from 'react';
import { useFormData } from '../context/FormDataContext';
import { downloadTextFile, jsonToDelimitedFile } from '@opencloning/utils/readNwrite';

export function useDownloadData() {
  const { parts} = useFormData();

  const downloadData = useCallback(() => {
    // Download as tsv file
    const tsv = jsonToDelimitedFile(parts, '\t');
    downloadTextFile(tsv, 'syntax.tsv');
  }, [parts]);

  return downloadData ;
}
