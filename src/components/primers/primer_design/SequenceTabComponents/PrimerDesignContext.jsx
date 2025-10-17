import React, { useState, useEffect } from 'react';
import { batch, useDispatch, useSelector, useStore } from 'react-redux';
import { updateEditor } from '@teselagen/ove';
import { isEqual } from 'lodash-es';
import useBackendRoute from '../../../../hooks/useBackendRoute';
import error2String from '../../../../utils/error2String';
import useStoreEditor from '../../../../hooks/useStoreEditor';
import { cloningActions } from '../../../../store/cloning';
import { stringIsNotDNA } from '../../../../store/cloning_utils';
import { computeSequenceProduct, buildDesignPrimerRequest } from './primerDesignLogic';
import useHttpClient from '../../../../hooks/useHttpClient';

function changeValueAtIndex(current, index, newValue) {
  return current.map((_, i) => (i === index ? newValue : current[i]));
}

const PrimerDesignContext = React.createContext();

export function PrimerDesignProvider({ children, designType, sequenceIds, primerDesignSettings, steps }) {
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

  const getSubmissionPreventedMessage = () => {
    if (rois.some((region) => region === null)) {
      return 'Not all regions have been selected';
    } if (primerDesignSettings.error) {
      return primerDesignSettings.error;
    } if (spacers.some((spacer) => stringIsNotDNA(spacer))) {
      return 'Spacer sequences not valid';
    }
    return '';
  };

  const submissionPreventedMessage = getSubmissionPreventedMessage();

  React.useEffect(() => {
    const { teselaJsonCache, sequences } = store.getState().cloning;
    const newSequenceProduct = submissionPreventedMessage === ''
      ? computeSequenceProduct({
        designType,
        rois,
        spacers,
        primerDesignSettings,
        fragmentOrientations,
        circularAssembly,
        sequenceIds,
        teselaJsonCache,
        sequences,
      })
      : null;
    setSequenceProduct(newSequenceProduct);
  }, [rois, spacersAreValid, fragmentOrientations, circularAssembly, designType, spacers, primerDesignSettings]);

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

  const onSelectRegion = (index, selectedRegion, allowSinglePosition = false) => {
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

  const handleSelectRegion = (index, selectedRegion, allowSinglePosition = false) => {
    const regionError = onSelectRegion(index, selectedRegion, allowSinglePosition);
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
    const { cloning: { sequences, teselaJsonCache, globalPrimerSettings } } = store.getState();

    const { endpoint, requestData, params } = buildDesignPrimerRequest({
      designType,
      sequenceIds,
      rois,
      fragmentOrientations,
      spacers,
      circularAssembly,
      primerDesignSettings,
      teselaJsonCache,
      sequences,
      globalPrimerSettings,
    });

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
  };

  const addPrimers = () => {
    const pcrSources = store.getState().cloning.sources.filter((source) => source.type === 'PCRSource');
    let usedPCRSources;
    if (designType === 'ebic') {
      usedPCRSources = pcrSources.filter((source) => source.input.some((i) => i.sequence === templateSequenceIds[0]));
    } else {
      usedPCRSources = templateSequenceIds.map((id) => pcrSources.find((source) => source.input.some((i) => i.sequence === id)));
    }

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
    steps,
  ]);

  return (
    <PrimerDesignContext.Provider value={value}>
      {children}
    </PrimerDesignContext.Provider>
  );
}

export const usePrimerDesign = () => React.useContext(PrimerDesignContext);
