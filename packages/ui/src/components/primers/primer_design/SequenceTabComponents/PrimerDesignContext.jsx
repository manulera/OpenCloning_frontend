import React, { useState, useEffect, useCallback } from 'react';
import { batch, useDispatch, useSelector, useStore } from 'react-redux';
import { updateEditor } from '@teselagen/ove';
import { isEqual } from 'lodash-es';
import useBackendRoute from '../../../../hooks/useBackendRoute';
import { selectedRegion2SequenceLocation } from '@opencloning/utils/selectedRegionUtils';
import error2String from '@opencloning/utils/error2String';
import useStoreEditor from '../../../../hooks/useStoreEditor';
import { cloningActions } from '@opencloning/store/cloning';
import { stringIsNotDNA } from '@opencloning/store/cloning_utils';
import { ebicTemplateAnnotation, joinSequencesIntoSingleSequence, simulateHomologousRecombination } from '@opencloning/utils/sequenceManipulation';
import useHttpClient from '../../../../hooks/useHttpClient';

function changeValueAtIndex(current, index, newValue) {
  return current.map((_, i) => (i === index ? newValue : current[i]));
}

const PrimerDesignContext = React.createContext();

export function PrimerDesignProvider({ children, designType, sequenceIds, primerDesignSettings, steps, isAmplified: isAmplifiedProp }) {

  const isAmplified = React.useMemo(
    () => isAmplifiedProp || sequenceIds.map(() => true),
    [isAmplifiedProp, sequenceIds],
  );

  const templateSequenceIds = React.useMemo(() => {
    if (designType === 'homologous_recombination' || designType === 'gateway_bp') {
      return sequenceIds.slice(0, 1);
    }
    return sequenceIds;
  }, [sequenceIds, designType]);

  // Compute initial values based on design type (props don't change, so compute once)
  const initialFragmentOrientationsLength = templateSequenceIds.length;
  const initialCircularAssembly = designType === 'gibson_assembly';
  const initialSpacersLength = initialCircularAssembly ? initialFragmentOrientationsLength : initialFragmentOrientationsLength + 1;

  const [primers, setPrimers] = useState([]);
  const [rois, setRois] = useState(Array(sequenceIds.length).fill(null));
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [sequenceProduct, setSequenceProduct] = useState(null);
  const [fragmentOrientations, setFragmentOrientations] = useState(Array(initialFragmentOrientationsLength).fill('forward'));
  const [circularAssembly, setCircularAssembly] = useState(initialCircularAssembly);
  const [spacers, setSpacers] = useState(Array(initialSpacersLength).fill(''));
  const sequenceProductTimeoutRef = React.useRef();

  const spacersAreValid = React.useMemo(() => spacers.every((spacer) => !stringIsNotDNA(spacer)), [spacers]);
  const sequenceNames = useSelector((state) => sequenceIds.map((id) => state.cloning.teselaJsonCache[id].name), isEqual);
  const templateSequenceNames = useSelector((state) => templateSequenceIds.map((id) => state.cloning.teselaJsonCache[id].name), isEqual);
  const mainSequenceId = useSelector((state) => state.cloning.mainSequenceId);

  const store = useStore();
  const backendRoute = useBackendRoute();
  const dispatch = useDispatch();
  const { updateStoreEditor } = useStoreEditor();
  const { setMainSequenceId, addPrimersToPCRSource, setCurrentTab } = cloningActions;
  const httpClient = useHttpClient();

  const submissionPreventedMessage = React.useMemo(() => {
    if (rois.some((region, i) => region === null && isAmplified[i])) {
      return 'Not all regions have been selected';
    } if (primerDesignSettings.error) {
      return primerDesignSettings.error;
    } if (spacers.some((spacer) => stringIsNotDNA(spacer))) {
      return 'Spacer sequences not valid';
    }
    return '';
  }, [rois, isAmplified, primerDesignSettings.error, spacers]);

  React.useEffect(() => {
    // Clear any existing timeout
    clearTimeout(sequenceProductTimeoutRef.current);

    // Debounce the heavy calculation
    sequenceProductTimeoutRef.current = setTimeout(() => {
      let newSequenceProduct = null;
      if (submissionPreventedMessage === '') {
        const { teselaJsonCache } = store.getState().cloning;
        const sequences = sequenceIds.map((id) => teselaJsonCache[id]);
        if (designType === 'simple_pair' || designType === 'restriction_ligation') {
          const enzymeSpacers = designType === 'restriction_ligation' ? primerDesignSettings.enzymeSpacers : ['', ''];
          const extendedSpacers = [enzymeSpacers[0] + spacers[0], spacers[1] + enzymeSpacers[1]];
          newSequenceProduct = joinSequencesIntoSingleSequence(sequences, rois.map((s) => s.selectionLayer), fragmentOrientations, extendedSpacers, circularAssembly, 'primer tail');
          newSequenceProduct.name = 'PCR product';
        } else if (designType === 'gibson_assembly') {
          const locations = rois.map((roi, i) => {
            if (roi) return roi.selectionLayer;
            return { start: 0, end: sequences[i].size - 1 };
          });
          newSequenceProduct = joinSequencesIntoSingleSequence(sequences, locations, fragmentOrientations, spacers, circularAssembly);
          newSequenceProduct.name = 'Gibson Assembly product';
        } else if (designType === 'homologous_recombination') {
          newSequenceProduct = simulateHomologousRecombination(sequences[0], sequences[1], rois, fragmentOrientations[0] === 'reverse', spacers);
          newSequenceProduct.name = 'Homologous recombination product';
        } else if (designType === 'gateway_bp') {
          newSequenceProduct = joinSequencesIntoSingleSequence([sequences[0]], [rois[0].selectionLayer], fragmentOrientations, spacers, false, 'primer tail');
          newSequenceProduct.name = 'PCR product';
          const { knownCombination } = primerDesignSettings;
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
        } else if (designType === 'ebic') {
          newSequenceProduct = ebicTemplateAnnotation(sequences[0], rois[0].selectionLayer, primerDesignSettings);
        }
      }
      setSequenceProduct({...newSequenceProduct, id: 'opencloning_primer_design_product'});
    }, 300);

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      clearTimeout(sequenceProductTimeoutRef.current);
    };
  }, [rois, spacersAreValid, fragmentOrientations, circularAssembly, designType, spacers, primerDesignSettings, sequenceIds, templateSequenceIds, store, submissionPreventedMessage]);


  React.useEffect(() => {
    if (circularAssembly && spacers.length !== templateSequenceIds.length) {
      setSpacers((current) => current.slice(1));
    }
    if (!circularAssembly && spacers.length !== templateSequenceIds.length + 1) {
      setSpacers((current) => ['', ...current]);
    }
  }, [circularAssembly, spacers, templateSequenceIds.length]);


  const onSelectRegion = useCallback((index, selectedRegion, allowSinglePosition = false) => {
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
  }, [setRois]);

  const onTabChange = useCallback((event, newValue) => {
    setSelectedTab(newValue);
    if (newValue < sequenceIds.length) {
      updateStoreEditor('mainEditor', sequenceIds[newValue]);
      dispatch(setMainSequenceId(sequenceIds[newValue]));
    } else if (newValue === sequenceIds.length) {
      // Don't update editor here - let the useEffect handle it when sequenceProduct is ready
      // This avoids using stale data since sequenceProduct is debounced
    } else {
      updateStoreEditor('mainEditor', null);
    }
  }, [sequenceIds, updateStoreEditor, dispatch, setMainSequenceId, setSelectedTab]);

  const handleNext = useCallback(() => {
    onTabChange(null, selectedTab + 1);
  }, [onTabChange, selectedTab]);

  const handleBack = useCallback(() => {
    onTabChange(null, selectedTab - 1);
  }, [onTabChange, selectedTab]);

  const handleSelectRegion = useCallback((index, selectedRegion, allowSinglePosition = false) => {
    const regionError = onSelectRegion(index, selectedRegion, allowSinglePosition);
    if (!regionError) {
      handleNext();
    }
    return regionError;
  }, [onSelectRegion, handleNext]);

  const handleFragmentOrientationChange = useCallback((index, orientation) => {
    setFragmentOrientations((current) => changeValueAtIndex(current, index, orientation));
  }, [setFragmentOrientations]);

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
    if (selectedTab === sequenceIds.length) {
      const timeoutId = setTimeout(() => {
        updateEditor(store, 'mainEditor', { sequenceData: sequenceProduct || {}, selectionLayer: {} });
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [sequenceProduct, selectedTab, sequenceIds.length, store]);

  const designPrimers = useCallback(async () => {
    // Validate fragmentOrientations
    fragmentOrientations.forEach((orientation) => {
      if (orientation !== 'forward' && orientation !== 'reverse') {
        throw new Error('Invalid fragment orientation');
      }
    });
    const { cloning: { sequences, teselaJsonCache, globalPrimerSettings } } = store.getState();
    let requestData;
    let params;
    let endpoint;
    const paramsForRequest = Object.fromEntries(
      Object.entries(primerDesignSettings)
        .filter(([_, value]) => typeof value !== 'function'),
    );
    if (designType === 'gibson_assembly') {
      params = {
        ...paramsForRequest,
        circular: circularAssembly,
      };
      requestData = {
        pcr_templates: sequenceIds.map((id, index) => ({
          sequence: sequences.find((e) => e.id === id),
          location: isAmplified[index]
            ? selectedRegion2SequenceLocation(rois[index], teselaJsonCache[id].size)
            : null,
          forward_orientation: fragmentOrientations[index] === 'forward',
        })),
        spacers,
      };
      endpoint = 'gibson_assembly';
    } else if (designType === 'homologous_recombination') {
      const [pcrTemplateId, homologousRecombinationTargetId] = sequenceIds;
      params = {
        ...paramsForRequest,
      };
      requestData = {
        pcr_template: {
          sequence: sequences.find((e) => e.id === pcrTemplateId),
          location: selectedRegion2SequenceLocation(rois[0], teselaJsonCache[pcrTemplateId].size),
          forward_orientation: fragmentOrientations[0] === 'forward',
        },
        homologous_recombination_target: {
          sequence: sequences.find((e) => e.id === homologousRecombinationTargetId),
          location: selectedRegion2SequenceLocation(rois[1], teselaJsonCache[homologousRecombinationTargetId].size),
        },
        spacers,
      };
      endpoint = 'homologous_recombination';
    } else if (designType === 'simple_pair' || designType === 'gateway_bp' || designType === 'restriction_ligation') {
      const pcrTemplateId = sequenceIds[0];
      params = {
        ...paramsForRequest,
      };

      requestData = {
        pcr_template: {
          sequence: sequences.find((e) => e.id === pcrTemplateId),
          location: selectedRegion2SequenceLocation(rois[0], teselaJsonCache[pcrTemplateId].size),
          forward_orientation: fragmentOrientations[0] === 'forward',
        },
        spacers,
      };
      endpoint = 'simple_pair';
    } else if (designType === 'ebic') {
      endpoint = 'ebic';
      requestData = {
        template: {
          sequence: sequences.find((e) => e.id === templateSequenceIds[0]),
          location: selectedRegion2SequenceLocation(rois[0], teselaJsonCache[templateSequenceIds[0]].size),
          // forward_orientation: fragmentOrientations[0] === 'forward',
        },
      };
      params = {
        ...paramsForRequest,
      };
    }
    requestData.settings = globalPrimerSettings;
    const url = backendRoute(`primer_design/${endpoint}`);

    try {
      const resp = await httpClient.post(url, requestData, { params });
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
  }, [fragmentOrientations, rois, sequenceIds, templateSequenceIds, designType, circularAssembly, primerDesignSettings, spacers, store, httpClient, backendRoute, handleNext, isAmplified]);

  const addPrimers = useCallback(() => {
    const pcrSources = store.getState().cloning.sources.filter((source) => source.type === 'PCRSource');
    let usedPCRSources;
    if (designType === 'ebic') {
      usedPCRSources = pcrSources.filter((source) => source.input.some((i) => i.sequence === templateSequenceIds[0]));
    } else {
      const amplifiedTemplateIds = templateSequenceIds.filter((_, i) => isAmplified[i]);
      usedPCRSources = amplifiedTemplateIds.map((id) => pcrSources.find((source) => source.input.some((i) => i.sequence === id)));
    }

    const validPrimers = primers.filter((p) => p !== null);
    batch(() => {
      usedPCRSources.forEach((pcrSource, index) => {
        dispatch(addPrimersToPCRSource({
          fwdPrimer: validPrimers[index * 2],
          revPrimer: validPrimers[index * 2 + 1],
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
  }, [primers, dispatch, setMainSequenceId, setCurrentTab, onTabChange, updateStoreEditor, designType, templateSequenceIds, isAmplified, addPrimersToPCRSource, store]);

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
    spacers,
    setFragmentOrientations,
    setSpacers,
    handleFragmentOrientationChange,
    sequenceNames,
    primerDesignSettings,
    submissionPreventedMessage,
    addPrimers,
    circularAssembly,
    setCircularAssembly,
    templateSequenceIds,
    templateSequenceNames,
    designType,
    steps,
    isAmplified,
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
    setCircularAssembly,
    templateSequenceIds,
    templateSequenceNames,
    designType,
    steps,
    isAmplified,
  ]);

  return (
    <PrimerDesignContext.Provider value={value}>
      {children}
    </PrimerDesignContext.Provider>
  );
}

export const usePrimerDesign = () => React.useContext(PrimerDesignContext);
