import React from 'react'
import { useFormData } from '../context/FormDataContext';
import { readSubmittedTextFile } from '@opencloning/utils/readNwrite';

function useUploadData() {
  const {setParts, setOverhangNames, setRelatedDois, setSubmitters, setAssemblyEnzyme, setDomesticationEnzyme, setSyntaxName} = useFormData();

  const uploadData = React.useCallback(async (files) => {
    const file = files[0];
    const data = JSON.parse(await readSubmittedTextFile(file));
    setSyntaxName(data.syntaxName || '');
    setParts(data.parts || []);
    setOverhangNames(data.overhangNames || {});
    setRelatedDois(data.relatedDois ? [...data.relatedDois, ''] : ['']);
    setSubmitters(data.submitters ? [...data.submitters, ''] : ['']);
    setAssemblyEnzyme(data.assemblyEnzyme || '');
    setDomesticationEnzyme(data.domesticationEnzyme || '');
  }, [setParts, setOverhangNames, setRelatedDois, setSubmitters, setAssemblyEnzyme, setDomesticationEnzyme, setSyntaxName]);

  return { uploadData };
}

export default useUploadData
