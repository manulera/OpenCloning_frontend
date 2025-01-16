import axios from 'axios';
import { batch } from 'react-redux';
import { cloneDeep } from 'lodash-es';
import { downloadStateAsJson } from './readNwrite';
import { cloningActions } from '../store/cloning';
import { shiftStateIds } from '../store/cloning_utils';

const { setState: setCloningState, setMainSequenceId, setDescription, revertToInitialState, setPrimers } = cloningActions;

const collectParentEntitiesAndSources = (source, sources, entities, entitiesToExport, sourcesToExport) => {
  source.input.forEach((entityId) => {
    entitiesToExport.push(entities.find((e) => e.id === entityId));
    const parentSource = sources.find((s) => s.output === entityId);
    sourcesToExport.push(parentSource);
    collectParentEntitiesAndSources(parentSource, sources, entities, entitiesToExport, sourcesToExport);
  });
};

export const exportSubStateThunk = (fileName, entityId) => async (dispatch, getState) => {
  // Download the subHistory for a given entity
  const state = getState();
  const { entities, sources, primers } = state.cloning;
  const entitiesToExport = entities.filter((e) => e.id === entityId);
  const sourcesToExport = sources.filter((s) => s.output === entityId);
  collectParentEntitiesAndSources(sourcesToExport[0], sources, entities, entitiesToExport, sourcesToExport);
  downloadStateAsJson({ entities: entitiesToExport, sources: sourcesToExport, description: '', primers }, fileName);
};

const loadStateThunk = (newState) => async (dispatch, getState) => {
  dispatch(setCloningState({ sources: newState.sources, entities: newState.sequences }));
  if (newState.primers) {
    dispatch(setPrimers(newState.primers));
  } else {
    dispatch(setPrimers([]));
  }
  dispatch(setMainSequenceId(null));
  if (newState.description) {
    dispatch(setDescription(newState.description));
  } else {
    dispatch(setDescription(''));
  }
};

const mergeStateThunk = (newState, removeSourceId = null, skipPrimers = false) => async (dispatch, getState) => {
  const { cloning: oldState } = getState();
  const existingPrimerNames = oldState.primers.map((p) => p.name);

  if (newState.primers === undefined || newState.sequences === undefined || newState.sources === undefined) {
    throw new Error('JSON file should contain at least keys: primers, sequences and sources');
  }
  if (newState.primers.length > 0 && skipPrimers) {
    throw new Error('Primers cannot be loaded when skipping primers');
  }
  if (newState.primers.some((p) => existingPrimerNames.includes(p.name))) {
    throw new Error('Primer name from loaded file exists in current session');
  }

  const stateForShifting = !removeSourceId ? oldState : { ...oldState, sources: oldState.sources.filter((s) => s.id !== removeSourceId) };
  const newState2 = shiftStateIds(newState, stateForShifting, skipPrimers);
  batch(() => {
    dispatch(setPrimers([...oldState.primers, ...newState2.primers]));
    dispatch(setCloningState({
      sources: [...stateForShifting.sources, ...newState2.sources],
      entities: [...oldState.entities, ...newState2.entities],
    }));
  });
};

export const copyEntityThunk = (entityId, copySourceId) => async (dispatch, getState) => {
  const state = getState();
  const { entities, sources } = state.cloning;
  const entitiesToCopy = entities.filter((e) => e.id === entityId);
  const sourcesToCopy = sources.filter((s) => s.output === entityId);
  collectParentEntitiesAndSources(sourcesToCopy[0], sources, entities, entitiesToCopy, sourcesToCopy);
  const newState = cloneDeep({
    sequences: entitiesToCopy,
    sources: sourcesToCopy,
    description: '',
    primers: [],
  });
  dispatch(mergeStateThunk(newState, copySourceId, true));
};

const resetStateThunk = () => async (dispatch) => {
  dispatch(revertToInitialState());
};

export const uploadToELabFTWThunk = (title, categoryId, apiKey) => async (dispatch, getState) => {
  const state = getState();
  const { primers } = state.primers;
  const { description, network, sources, entities } = state.cloning;
  // TODO: This probably needs updating
  const usedPrimersIds = sources.filter((s) => s.type === 'PCRSource' && s.assembly.length > 0).map((s) => [s.assembly[0].sequence, s.assembly[2].sequence]).flat();
  const primersToUpload = primers.filter((p) => usedPrimersIds.includes(p.id));

  const eLabFTWSources = sources.filter((source) => source.type === 'ELabFTWFileSource');
  const links2add = eLabFTWSources.map((source) => source.item_id);

  const history = {
    sources,
  };
  if (primersToUpload.length > 0) {
    history.primers = primersToUpload;
  }
  if (network.length !== 1 || network[0].entity === null) {
    throw new Error('Only one final product should be present');
  }
  const entity2export = entities.find((e) => e.id === network[0].entity.id);

  // Create item
  const createdItemResponse = await axios.post(
    'https://elab.local:3148/api/v2/items',
    {
      category_id: categoryId,
      tags: [],
    },
    { headers: { Authorization: apiKey } },
  );

  // Normally we would expect to get the item id from the response,
  // but in this case the header is not returned because of CORS,
  // we just use the highest id
  const resp = await axios.get(
    'https://elab.local:3148/api/v2/items',
    { headers: { Authorization: apiKey }, params: { cat: categoryId } },
  );
  const itemId = Math.max(...resp.data.map((item) => item.id));

  // Set the title
  await axios.patch(
    `https://elab.local:3148/api/v2/items/${itemId}`,
    { title },
    { headers: { Authorization: apiKey } },
  );

  const linkToParent = async (childId, parentId) => {
    await axios.post(
      `https://elab.local:3148/api/v2/items/${childId}/items_links/${parentId}`,
      { parent_id: parentId },
      { headers: { Authorization: apiKey } },
    );
  };

  // Link to the parents
  await Promise.all(links2add.map((link) => linkToParent(itemId, link)));

  // Upload the sequence file
  const formData = new FormData();
  const blob = new Blob([entity2export.file_content], { type: 'application/json' });
  formData.append('file', blob, `${title}.gb`);
  formData.append('comment', 'resource sequence - generated by ShareYourCloning');
  const uploadResponse = await axios.post(
    `https://elab.local:3148/api/v2/items/${itemId}/uploads`,
    formData,
    { headers: { Authorization: apiKey, 'content-type': 'multipart/form-data' } },
  );
  console.log(uploadResponse);

  // Upload the history
  const historyBlob = new Blob([JSON.stringify(history)], { type: 'application/json' });
  const historyFormData = new FormData();
  historyFormData.append('file', historyBlob, `${title}_history.json`);
  historyFormData.append('comment', 'history file - generated by ShareYourCloning');
  const historyUploadResponse = await axios.post(
    `https://elab.local:3148/api/v2/items/${itemId}/uploads`,
    historyFormData,
    { headers: { Authorization: apiKey, 'content-type': 'multipart/form-data' } },
  );
};

export const addHistory = async (newState, dispatch, addAlert, url, removeSourceId = null) => {
  try {
    await axios.post(url, newState);
  } catch (e) {
    if (e.code === 'ERR_NETWORK') {
      addAlert({
        message: 'Cannot connect to backend server to validate the JSON file',
        severity: 'error',
      });
    } else {
      addAlert({
        message: 'JSON file in wrong format',
        severity: 'error',
      });
    }
    console.error(e);
  }
  try {
    await dispatch(mergeStateThunk(newState, removeSourceId));
  } catch (e) {
    console.error(e);
    addAlert({
      message: e.message,
      severity: 'error',
    });
  }
};

export const loadData = async (newState, isTemplate, dispatch, addAlert, url) => {
  if (isTemplate !== true) {
    // Validate using the API
    // TODO: for validation, the sequences could be sent empty to reduce size
    try {
      await axios.post(url, newState);
    } catch (e) {
      console.error(e);
      if (e.code === 'ERR_NETWORK') {
        addAlert({
          message: 'Cannot connect to backend server to validate the JSON file',
          severity: 'error',
        });
      } else {
        addAlert({
          message: 'JSON file in wrong format',
          severity: 'error',
        });
      }
    }
  }

  dispatch(loadStateThunk(newState)).catch((e) => {
    // TODO: I don't think this is needed anymore
    dispatch(resetStateThunk());
    addAlert({
      message: 'JSON file in wrong format',
      severity: 'error',
    });
  });
};
