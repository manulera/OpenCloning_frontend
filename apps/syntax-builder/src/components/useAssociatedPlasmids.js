import React from 'react';
import { useFormData } from '../context/FormDataContext';
import { anyToJson } from '@teselagen/bio-parsers';
import { partsToEdgesGraph } from '@opencloning/ui/components/assembler';
import { assignSequenceToSyntaxPart } from '../../../../packages/ui/src/components/assembler/assembler_utils';
import { aliasedEnzymesByName } from '@teselagen/sequence-utils';

export function useLinkedPlasmids() {
  const { parts, enzyme, overhangNames } = useFormData();

  const graph = React.useMemo(() => partsToEdgesGraph(parts), [parts]);
  const partDictionary = React.useMemo(() => parts.reduce((acc, part) => {
    acc[`${part.left_overhang}-${part.right_overhang}`] = part;
    return acc;
  }, {}), [parts]);

  const [linkedPlasmids, setLinkedPlasmids] = React.useState([]);


  const assignPlasmids = React.useCallback( (plasmids) => plasmids.map(plasmid => {
    const enzymes = [aliasedEnzymesByName[enzyme.toLowerCase()]];
    const correspondingParts = assignSequenceToSyntaxPart(plasmid, enzymes, graph);
    const correspondingPartsStr = correspondingParts.map(part => `${part.left_overhang}-${part.right_overhang}`);
    const correspondingPartsNames = correspondingParts.map(part => {
      let namePart = '';
      const leftName = overhangNames[part.left_overhang];
      const rightName = overhangNames[part.right_overhang];
      if (leftName || rightName) {
        namePart = `${leftName || part.left_overhang}-${rightName || part.right_overhang}`;
      }
      return namePart;
    });
    return {
      ...plasmid,
      appData: {
        ...plasmid.appData,
        correspondingParts: correspondingPartsStr,
        partInfo: correspondingPartsStr.map(partStr => partDictionary[partStr]),
        correspondingPartsNames: correspondingPartsNames,
        longestFeature: correspondingParts.map(part => part.longestFeature)
      } };
  }), [graph, partDictionary, enzyme, overhangNames]);

  React.useEffect(() => {
    enzyme && setLinkedPlasmids((prevLinkedPlasmids) => assignPlasmids(prevLinkedPlasmids));
  }, [assignPlasmids, enzyme]);

  const uploadPlasmids = React.useCallback(async (files) => {
    const plasmids = await Promise.all(files.map(async (file) => {
      const data = await anyToJson(file);
      const sequenceData = data[0].parsedSequence;
      // Force circular
      sequenceData.circular = true;
      return {...sequenceData, appData: { fileName: file.name, correspondingParts: [], partInfo: [], correspondingPartsNames: [] } };
    }));
    if (enzyme) {
      setLinkedPlasmids(assignPlasmids(plasmids));
    } else {
      setLinkedPlasmids(plasmids);
    }
  }, [assignPlasmids, enzyme]);

  return { linkedPlasmids, uploadPlasmids };
}
