import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { batch, useDispatch, useSelector, useStore } from 'react-redux';
import { updateEditor } from '@teselagen/ove';
import { isEqual } from 'lodash-es';
import useBackendRoute from '../../../../hooks/useBackendRoute';
import { selectedRegion2SequenceLocation } from '../../../../utils/selectedRegionUtils';
import error2String from '../../../../utils/error2String';
import useStoreEditor from '../../../../hooks/useStoreEditor';
import { cloningActions } from '../../../../store/cloning';
import usePrimerDesignSettings from './usePrimerDesignSettings';
import { stringIsNotDNA } from '../../../../store/cloning_utils';
import { joinEntitiesIntoSingleSequence, simulateHomologousRecombination } from '../../../../utils/sequenceManipulation';
import useEnzymePrimerDesignSettings from './useEnzymePrimerDesignSettings';

function changeValueAtIndex(current, index, newValue) {
  return current.map((_, i) => (i === index ? newValue : current[i]));
}

const PrimerDesignContext = React.createContext();

export function PrimerDesignProvider({ children, designType, sequenceIds, initialPrimerDesignSettings, steps }) {
  let templateSequenceIds = sequenceIds;
  if (designType === 'homologous_recombination' || designType === 'gateway_bp') {
    templateSequenceIds = sequenceIds.slice(0, 1);
  }

  const [primers, setPrimers] = useState([]);
  const [rois, setRois] = useState(Array(sequenceIds.length).fill(null));
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [sequenceProduct, setSequenceProduct] = useState(null);
  const [fragmentOrientations, setFragmentOrientations] = useState(Array(templateSequenceIds.length).fill('forward'));
  const [circularAssembly, setCircularAssembly] = useState(false);
  const [spacers, setSpacers] = useState(Array(templateSequenceIds.length + 1).fill(''));

  // Restriction ligation
  const { enzymePrimerDesignSettings, enzymePrimerDesignHandlingFunctions } = useEnzymePrimerDesignSettings();

  // Gateway BP
  const [knownCombination, setKnownCombination] = useState(null);

  const handleKnownCombinationChange = (newKnownCombination, selection) => {
    if (newKnownCombination) {
      setKnownCombination({ ...newKnownCombination, selection });
      setSpacers(newKnownCombination.spacers);
    } else {
      setSpacers(['', '']);
      setKnownCombination(null);
      setRois((c) => changeValueAtIndex(c, 1, null));
    }
  };

  const primerDesignSettings = usePrimerDesignSettings(initialPrimerDesignSettings);

  const spacersAreValid = React.useMemo(() => spacers.every((spacer) => !stringIsNotDNA(spacer)), [spacers]);
  const sequenceNames = useSelector((state) => sequenceIds.map((id) => state.cloning.teselaJsonCache[id].name), isEqual);
  const templateSequenceNames = useSelector((state) => templateSequenceIds.map((id) => state.cloning.teselaJsonCache[id].name), isEqual);
  const mainSequenceId = useSelector((state) => state.cloning.mainSequenceId);

  const store = useStore();
  const backendRoute = useBackendRoute();
  const dispatch = useDispatch();
  const { updateStoreEditor } = useStoreEditor();
  const { setMainSequenceId, addPrimersToPCRSource, setCurrentTab } = cloningActions;

  const getSubmissionPreventedMessage = () => {
    if (rois.some((region) => region === null)) {
      return 'Not all regions have been selected';
    } if (!primerDesignSettings.valid) {
      return 'Primer design settings not valid';
    } if (spacers.some((spacer) => stringIsNotDNA(spacer))) {
      return 'Spacer sequences not valid';
    } if (designType === 'gateway_bp' && !knownCombination) {
      return 'No valid combination of attP sites selected';
    } if (designType === 'restriction_ligation') {
      const { left_enzyme: leftEnzyme, right_enzyme: rightEnzyme, filler_bases: fillerBases } = enzymePrimerDesignSettings;
      if (!leftEnzyme && !rightEnzyme) {
        return 'You must select and enzyme';
      }
      if (stringIsNotDNA(fillerBases)) {
        return 'Filler bases not valid';
      }
    }
    return '';
  };

  const submissionPreventedMessage = getSubmissionPreventedMessage();

  React.useEffect(() => {
    let newSequenceProduct = null;
    if (submissionPreventedMessage === '') {
      const { teselaJsonCache } = store.getState().cloning;
      const sequences = sequenceIds.map((id) => teselaJsonCache[id]);
      if (designType === 'simple_pair' || designType === 'restriction_ligation') {
        const { enzymeSpacers } = enzymePrimerDesignSettings;
        const extendedSpacers = [enzymeSpacers[0] + spacers[0], spacers[1] + enzymeSpacers[1]];
        newSequenceProduct = joinEntitiesIntoSingleSequence(sequences, rois.map((s) => s.selectionLayer), fragmentOrientations, extendedSpacers, circularAssembly, 'primer tail');
        newSequenceProduct.name = 'PCR product';
      } else if (designType === 'gibson_assembly') {
        newSequenceProduct = joinEntitiesIntoSingleSequence(sequences, rois.map((s) => s.selectionLayer), fragmentOrientations, spacers, circularAssembly);
        newSequenceProduct.name = 'Gibson Assembly product';
      } else if (designType === 'homologous_recombination') {
        newSequenceProduct = simulateHomologousRecombination(sequences[0], sequences[1], rois.map((s) => s.selectionLayer), fragmentOrientations[0] === 'reverse', spacers);
        newSequenceProduct.name = 'Homologous recombination product';
      } else if (designType === 'gateway_bp') {
        newSequenceProduct = joinEntitiesIntoSingleSequence([sequences[0]], [rois[0].selectionLayer], fragmentOrientations, spacers, false, 'primer tail');
        newSequenceProduct.name = 'PCR product';
        const leftFeature = {
          start: knownCombination.translationFrame[0],
          end: spacers[0].length - 1,
          type: 'CDS',
          name: 'translation frame',
          strand: 1,
          forward: true,
        };
        const nbAas = Math.floor((spacers[1].length - knownCombination.translationFrame[1]) / 3);
        const rightStart = newSequenceProduct.sequence.length - knownCombination.translationFrame[1] - nbAas * 3;
        const rightFeature = {
          start: rightStart,
          end: newSequenceProduct.sequence.length - knownCombination.translationFrame[1] - 1,
          type: 'CDS',
          name: 'translation frame',
          strand: 1,
          forward: true,
        };
        newSequenceProduct.features.push(leftFeature);
        newSequenceProduct.features.push(rightFeature);
        setSequenceProduct(newSequenceProduct);
      }
    }
    setSequenceProduct(newSequenceProduct);
  }, [rois, spacersAreValid, fragmentOrientations, circularAssembly, designType, spacers, ...enzymePrimerDesignSettings.enzymeSpacers]);

  const onCircularAssemblyChange = (event) => {
    setCircularAssembly(event.target.checked);
    if (event.target.checked) {
      // Remove the first spacer
      setSpacers((current) => current.slice(1));
    } else {
      // Add it again
      setSpacers((current) => ['', ...current]);
    }
  };

  const onSelectRegion = (index, allowSinglePosition = false) => {
    let selectedRegion;
    if (designType === 'gateway_bp' && index === 1) {
      selectedRegion = knownCombination.selection;
    } else {
      selectedRegion = store.getState().cloning.mainSequenceSelection;
    }
    const { caretPosition } = selectedRegion;
    if (caretPosition === undefined) {
      setRois((c) => changeValueAtIndex(c, index, null));
      return 'You have to select a region in the sequence editor!';
    }
    if (caretPosition === -1) {
      setRois((c) => changeValueAtIndex(c, index, selectedRegion));
      return '';
    }
    if (allowSinglePosition) {
      setRois((c) => changeValueAtIndex(c, index, selectedRegion));
      return '';
    }
    setRois((c) => changeValueAtIndex(c, index, null));
    return 'Select a region (not a single position) to amplify';
  };

  const onTabChange = (event, newValue) => {
    setSelectedTab(newValue);
    if (newValue < sequenceIds.length) {
      updateStoreEditor('mainEditor', sequenceIds[newValue]);
      dispatch(setMainSequenceId(sequenceIds[newValue]));
    } else if (newValue === sequenceIds.length) {
      updateEditor(store, 'mainEditor', { sequenceData: sequenceProduct || '', selectionLayer: {} });
    } else {
      updateStoreEditor('mainEditor', null);
    }
  };

  const handleNext = () => {
    onTabChange(null, selectedTab + 1);
  };

  const handleBack = () => {
    onTabChange(null, selectedTab - 1);
  };

  const handleSelectRegion = (index, allowSinglePosition = false) => {
    const regionError = onSelectRegion(index, allowSinglePosition);
    if (!regionError) {
      handleNext();
    }
    return regionError;
  };

  const handleFragmentOrientationChange = (index, orientation) => {
    setFragmentOrientations((current) => changeValueAtIndex(current, index, orientation));
  };

  // Focus on the right sequence when changing tabs
  useEffect(() => {
    // Focus on the correct sequence
    const mainSequenceIndex = sequenceIds.indexOf(mainSequenceId);
    if (mainSequenceIndex !== -1) {
      setSelectedTab(mainSequenceIndex);
    }
  }, [sequenceIds, mainSequenceId]);

  // Update the sequence product in the editor if in the last tab
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (selectedTab === sequenceIds.length) {
        updateEditor(store, 'mainEditor', { sequenceData: sequenceProduct || {} });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [sequenceProduct, store]);

  const designPrimers = async () => {
    // Validate fragmentOrientations
    fragmentOrientations.forEach((orientation) => {
      if (orientation !== 'forward' && orientation !== 'reverse') {
        throw new Error('Invalid fragment orientation');
      }
    });
    const { cloning: { entities } } = store.getState();
    let requestData;
    let params;
    let endpoint;
    if (designType === 'gibson_assembly') {
      params = {
        homology_length: primerDesignSettings.homologyLength,
        minimal_hybridization_length: primerDesignSettings.hybridizationLength,
        target_tm: primerDesignSettings.targetTm,
        circular: circularAssembly,
      };
      requestData = {
        pcr_templates: sequenceIds.map((id, index) => ({
          sequence: entities.find((e) => e.id === id),
          location: selectedRegion2SequenceLocation(rois[index]),
          forward_orientation: fragmentOrientations[index] === 'forward',
        })),
        spacers,
      };
      endpoint = 'gibson_assembly';
    } else if (designType === 'homologous_recombination') {
      const [pcrTemplateId, homologousRecombinationTargetId] = sequenceIds;
      params = {
        homology_length: primerDesignSettings.homologyLength,
        minimal_hybridization_length: primerDesignSettings.hybridizationLength,
        target_tm: primerDesignSettings.targetTm,
      };
      requestData = {
        pcr_template: {
          sequence: entities.find((e) => e.id === pcrTemplateId),
          location: selectedRegion2SequenceLocation(rois[0]),
          forward_orientation: fragmentOrientations[0] === 'forward',
        },
        homologous_recombination_target: {
          sequence: entities.find((e) => e.id === homologousRecombinationTargetId),
          location: selectedRegion2SequenceLocation(rois[1]),
        },
        spacers,
      };
      endpoint = 'homologous_recombination';
    } else if (designType === 'simple_pair' || designType === 'gateway_bp' || designType === 'restriction_ligation') {
      const pcrTemplateId = sequenceIds[0];
      const { enzymeSpacers, ...enzymeParams } = enzymePrimerDesignSettings;
      params = {
        minimal_hybridization_length: primerDesignSettings.hybridizationLength,
        target_tm: primerDesignSettings.targetTm,
        ...enzymeParams,
      };

      requestData = {
        pcr_template: {
          sequence: entities.find((e) => e.id === pcrTemplateId),
          location: selectedRegion2SequenceLocation(rois[0]),
          forward_orientation: fragmentOrientations[0] === 'forward',
        },
        spacers,
      };
      endpoint = 'simple_pair';
    }

    const url = backendRoute(`/primer_design/${endpoint}`);

    try {
      const resp = await axios.post(url, requestData, { params });
      setError('');
      const newPrimers = resp.data.primers;
      setPrimers(newPrimers);
      handleNext();
      return false;
    } catch (thrownError) {
      const errorMessage = error2String(thrownError);
      setError(errorMessage);
      return true;
    }
  };

  const addPrimers = () => {
    const pcrSources = store.getState().cloning.sources.filter((source) => source.type === 'PCRSource');
    const usedPCRSources = templateSequenceIds.map((id) => pcrSources.find((source) => source.input.includes(id)));
    batch(() => {
      usedPCRSources.forEach((pcrSource, index) => {
        dispatch(addPrimersToPCRSource({
          fwdPrimer: primers[index * 2],
          revPrimer: primers[index * 2 + 1],
          sourceId: pcrSource.id,
        }));
      });
      dispatch(setMainSequenceId(null));
      dispatch(setCurrentTab(0));
    });
    setPrimers([]);
    onTabChange(null, 0);
    document.getElementById(`source-${usedPCRSources[0].id}`)?.scrollIntoView();
    updateStoreEditor('mainEditor', null);
  };

  const value = React.useMemo(() => ({
    primers,
    error,
    rois,
    designPrimers,
    setPrimers,
    selectedTab,
    onTabChange,
    handleNext,
    handleBack,
    handleSelectRegion,
    sequenceIds,
    fragmentOrientations,
    circularAssembly,
    spacers,
    setFragmentOrientations,
    setSpacers,
    handleFragmentOrientationChange,
    sequenceNames,
    primerDesignSettings,
    submissionPreventedMessage,
    addPrimers,
    onCircularAssemblyChange,
    templateSequenceIds,
    templateSequenceNames,
    designType,
    knownCombination,
    handleKnownCombinationChange,
    enzymePrimerDesignSettings,
    enzymePrimerDesignHandlingFunctions,
    steps,
  }), [
    primers,
    error,
    rois,
    designPrimers,
    setPrimers,
    selectedTab,
    onTabChange,
    handleNext,
    handleBack,
    handleSelectRegion,
    sequenceIds,
    fragmentOrientations,
    circularAssembly,
    spacers,
    setFragmentOrientations,
    setSpacers,
    handleFragmentOrientationChange,
    sequenceNames,
    primerDesignSettings,
    submissionPreventedMessage,
    addPrimers,
    templateSequenceIds,
    designType,
    knownCombination,
    handleKnownCombinationChange,
    enzymePrimerDesignSettings,
    enzymePrimerDesignHandlingFunctions,
    steps,
  ]);

  return (
    <PrimerDesignContext.Provider value={value}>
      {children}
    </PrimerDesignContext.Provider>
  );
}

export const usePrimerDesign = () => React.useContext(PrimerDesignContext);
