import React from 'react';
import { anyToJson } from '@teselagen/bio-parsers';
import { partsToEdgesGraph } from '@opencloning/ui/components/assembler';
import { assignSequenceToSyntaxPart } from './assembler_utils';
import { aliasedEnzymesByName } from '@teselagen/sequence-utils';

/**
 * Custom hook that manages plasmids state and logic
 * @param {Object} params - Dependencies from FormDataContext
 * @param {Array} params.parts - Array of parts
 * @param {string} params.assemblyEnzyme - Assembly enzyme name
 * @param {Object} params.overhangNames - Mapping of overhangs to names
 * @returns {Object} - { linkedPlasmids, setLinkedPlasmids, uploadPlasmids }
 */
export function usePlasmidsLogic({ parts, assemblyEnzyme, overhangNames }) {
  const [linkedPlasmids, setLinkedPlasmidsState] = React.useState([]);

  const graphForPlasmids = React.useMemo(() => partsToEdgesGraph(parts), [parts]);
  const partDictionary = React.useMemo(() => parts.reduce((acc, part) => {
    acc[`${part.left_overhang}-${part.right_overhang}`] = part;
    return acc;
  }, {}), [parts]);

  const assignPlasmids = React.useCallback((plasmids) => plasmids.map(plasmid => {
    const enzymes = [aliasedEnzymesByName[assemblyEnzyme.toLowerCase()]];
    const correspondingParts = assignSequenceToSyntaxPart(plasmid, enzymes, graphForPlasmids);
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
      }
    };
  }), [graphForPlasmids, partDictionary, assemblyEnzyme, overhangNames]);

  // Wrapper for setLinkedPlasmids that automatically assigns plasmids if enzyme is available
  const setLinkedPlasmids = React.useCallback((plasmids) => {
    if (assemblyEnzyme && Array.isArray(plasmids) && plasmids.length > 0) {
      setLinkedPlasmidsState(assignPlasmids(plasmids));
    } else {
      setLinkedPlasmidsState(plasmids);
    }
  }, [assemblyEnzyme, assignPlasmids]);

  // Update existing plasmids when enzyme or assignment logic changes
  React.useEffect(() => {
    if (assemblyEnzyme) {
      setLinkedPlasmidsState((prevLinkedPlasmids) => {
        if (prevLinkedPlasmids.length > 0) {
          return assignPlasmids(prevLinkedPlasmids);
        }
        return prevLinkedPlasmids;
      });
    }
  }, [assignPlasmids, assemblyEnzyme]); // Note: intentionally not including linkedPlasmids to avoid infinite loop

  const uploadPlasmids = React.useCallback(async (files) => {
    const plasmids = await Promise.all(files.map(async (file) => {
      const data = await anyToJson(file);
      const sequenceData = data[0].parsedSequence;
      // Force circular
      sequenceData.circular = true;
      return {...sequenceData, appData: { fileName: file.name, correspondingParts: [], partInfo: [], correspondingPartsNames: [] } };
    }));
    setLinkedPlasmids(plasmids);
  }, [setLinkedPlasmids]);

  return { linkedPlasmids, setLinkedPlasmids, uploadPlasmids };
}
