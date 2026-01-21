import React from 'react';
import { useFormData } from '../context/FormDataContext';
import { anyToJson } from '@teselagen/bio-parsers';
import { partsToEdgesGraph } from '@opencloning/ui/components/assembler';
import { assignSequenceToSyntaxPart } from '../../../../packages/ui/src/components/assembler/assembler_utils';
import { aliasedEnzymesByName } from '@teselagen/sequence-utils';
import defaultPlasmids from './linkedPlasmids.json'

export function useLinkedPlasmids() {
  const { parts, enzyme } = useFormData();

  const graph = React.useMemo(() => partsToEdgesGraph(parts), [parts]);
  const partDictionary = React.useMemo(() => parts.reduce((acc, part) => {
    acc[`${part.left_overhang}-${part.right_overhang}`] = part;
    return acc;
  }, {}), [parts]);

  const [linkedPlasmids, setLinkedPlasmids] = React.useState(defaultPlasmids);


  const assignPlasmids = React.useCallback( (plasmids) => plasmids.map(plasmid => {
    const enzymes = [aliasedEnzymesByName[enzyme.toLowerCase()]];
    const correspondingParts = assignSequenceToSyntaxPart(plasmid, enzymes, graph);
    const correspondingPartsStr = correspondingParts.map(part => `${part.left_overhang}-${part.right_overhang}`);
    return {
      ...plasmid,
      appData: {
        ...plasmid.appData,
        correspondingParts: correspondingPartsStr,
        partInfo: correspondingPartsStr.map(partStr => partDictionary[partStr]),
        longestFeature: correspondingParts.map(part => part.longestFeature)
      } };
  }), [graph, partDictionary, enzyme]);

  React.useEffect(() => {
    enzyme && setLinkedPlasmids((prevLinkedPlasmids) => assignPlasmids(prevLinkedPlasmids));
  }, [assignPlasmids, enzyme]);

  const uploadPlasmids = React.useCallback(async (files) => {
    const plasmids = await Promise.all(files.map(async (file) => {
      const data = await anyToJson(file);
      const sequenceData = data[0].parsedSequence;
      // Force circular
      sequenceData.circular = true;
      return {...sequenceData, appData: { fileName: file.name, correspondingParts: [], partInfo: [] } };
    }));
    if (enzyme) {
      setLinkedPlasmids(assignPlasmids(plasmids));
    } else {
      setLinkedPlasmids(plasmids);
    }
  }, [assignPlasmids, enzyme]);

  return { linkedPlasmids, uploadPlasmids };
}
