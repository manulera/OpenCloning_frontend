import React, { useEffect, useState } from 'react';
import { getReverseComplementSequenceString as reverseComplement } from '@teselagen/sequence-utils';
import { getEnzymeRecognitionSequence } from '../../../../utils/enzyme_utils';
import { stringIsNotDNA } from '../../../../store/cloning_utils';

export default function useEnzymePrimerDesignSettings() {
  const [enzymePrimerDesignSettings, setEnzymePrimerDesignSettings] = useState({
    left_enzyme: null,
    right_enzyme: null,
    left_enzyme_inverted: false,
    right_enzyme_inverted: false,
    filler_bases: 'TTT',
    enzymeSpacers: ['', ''],
  });

  const handleLeftEnzymeChange = (enzyme) => {
    setEnzymePrimerDesignSettings((prev) => ({ ...prev, left_enzyme: enzyme, left_enzyme_inverted: false }));
  };

  const handleRightEnzymeChange = (enzyme) => {
    setEnzymePrimerDesignSettings((prev) => ({ ...prev, right_enzyme: enzyme, right_enzyme_inverted: false }));
  };

  const handleLeftEnzymeInversionChange = (inverted) => {
    setEnzymePrimerDesignSettings((prev) => ({ ...prev, left_enzyme_inverted: inverted }));
  };

  const handleRightEnzymeInversionChange = (inverted) => {
    setEnzymePrimerDesignSettings((prev) => ({ ...prev, right_enzyme_inverted: inverted }));
  };

  const handleFillerBasesChange = (e) => {
    setEnzymePrimerDesignSettings((prev) => ({ ...prev, filler_bases: e.target.value }));
  };

  useEffect(() => {
    const { left_enzyme: leftEnzyme, right_enzyme: rightEnzyme, filler_bases: fillerBases, left_enzyme_inverted: leftEnzymeInverted, right_enzyme_inverted: rightEnzymeInverted } = enzymePrimerDesignSettings;
    if ((leftEnzyme || rightEnzyme) && !stringIsNotDNA(fillerBases)) {
      const leftEnzymeSeq = leftEnzymeInverted ? reverseComplement(getEnzymeRecognitionSequence(leftEnzyme)) : getEnzymeRecognitionSequence(leftEnzyme);
      const rightEnzymeSeq = rightEnzymeInverted ? getEnzymeRecognitionSequence(rightEnzyme) : reverseComplement(getEnzymeRecognitionSequence(rightEnzyme));
      const leftSpacerStartingSeq = (leftEnzyme ? fillerBases : '') + leftEnzymeSeq;
      const rightSpacerEndingSeq = rightEnzymeSeq + reverseComplement((rightEnzyme ? fillerBases : ''));
      setEnzymePrimerDesignSettings((prev) => ({ ...prev, enzymeSpacers: [leftSpacerStartingSeq, rightSpacerEndingSeq] }));
    } else {
      setEnzymePrimerDesignSettings((prev) => ({ ...prev, enzymeSpacers: ['', ''] }));
    }
  }, [
    enzymePrimerDesignSettings.left_enzyme,
    enzymePrimerDesignSettings.right_enzyme,
    enzymePrimerDesignSettings.filler_bases,
    enzymePrimerDesignSettings.left_enzyme_inverted,
    enzymePrimerDesignSettings.right_enzyme_inverted,
  ]);

  const enzymePrimerDesignHandlingFunctions = React.useMemo(() => ({
    handleLeftEnzymeChange, handleRightEnzymeChange, handleLeftEnzymeInversionChange, handleRightEnzymeInversionChange, handleFillerBasesChange,
  }), []);

  return { enzymePrimerDesignSettings, enzymePrimerDesignHandlingFunctions };
}
