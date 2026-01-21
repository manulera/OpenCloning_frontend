import React from 'react';
import { useFormData } from '../context/FormDataContext';
import { anyToJson } from '@teselagen/bio-parsers';
import { partsToEdgesGraph } from '@opencloning/ui/components/assembler';
import { assignSequenceToSyntaxPart } from '../../../../packages/ui/src/components/assembler/assembler_utils';
import { aliasedEnzymesByName } from '@teselagen/sequence-utils';
import defaultPlasmids from './linkedPlasmids.json'

const enzymes = [aliasedEnzymesByName["bsai"]];

export function useLinkedPlasmids() {
  const { parts } = useFormData();
  const graph = React.useMemo(() => partsToEdgesGraph(parts), [parts]);
  const partDictionary = React.useMemo(() => parts.reduce((acc, part) => {
    acc[`${part.left_overhang}-${part.right_overhang}`] = part;
    return acc;
  }, {}), [parts]);

  const [linkedPlasmids, setLinkedPlasmids] = React.useState(defaultPlasmids);


  const assignPlasmids = React.useCallback( (plasmids) => plasmids.map(plasmid => {
    const correspondingParts = assignSequenceToSyntaxPart(plasmid.sequence, true, enzymes, graph);
    const correspondingPartsStr = correspondingParts.map(part => `${part.left_overhang}-${part.right_overhang}`);
    return {...plasmid, appData: { ...plasmid.appData, correspondingParts: correspondingPartsStr, partInfo: correspondingPartsStr.map(partStr => partDictionary[partStr]) } };
  }), [graph, partDictionary]);

  React.useEffect(() => {
    setLinkedPlasmids((prevLinkedPlasmids) => assignPlasmids(prevLinkedPlasmids));
  }, [assignPlasmids]);

  const uploadPlasmids = React.useCallback(async (files) => {
    const plasmids = await Promise.all(files.map(async (file) => {
      const data = await anyToJson(file);
      const sequenceData = data[0].parsedSequence;
      return {...sequenceData, appData: { fileName: file.name, correspondingParts: [], partInfo: [] } };
    }));
    setLinkedPlasmids(assignPlasmids(plasmids));
  }, [assignPlasmids]);

  return { linkedPlasmids, uploadPlasmids };
}
