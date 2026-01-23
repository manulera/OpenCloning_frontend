import React from 'react'
import { useFormData } from '../context/FormDataContext';
import { readSubmittedTextFile } from '@opencloning/utils/readNwrite';

function useUploadData() {
  const {setParts, setOverhangNames, setRelatedDois, setSubmitters, setAssemblyEnzyme, setDomesticationEnzyme} = useFormData();
  
  const uploadData = React.useCallback(async (files) => {
    const file = files[0];
    const data = JSON.parse(await readSubmittedTextFile(file));
    setParts(data.parts || []);
    setOverhangNames(data.overhangNames || {});
    setRelatedDois(data.relatedDois || []);
    setSubmitters(data.submitters || []);
    setAssemblyEnzyme(data.assemblyEnzyme || '');
    setDomesticationEnzyme(data.domesticationEnzyme || '');
  }, [setParts, setOverhangNames, setRelatedDois, setSubmitters, setAssemblyEnzyme, setDomesticationEnzyme]);

  return { uploadData };
}

export default useUploadData
