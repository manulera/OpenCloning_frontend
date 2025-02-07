import axios from 'axios';
import { cloneDeep } from 'lodash-es';
import { base64ToBlob, downloadStateAsJson, loadFilesToSessionStorage } from './readNwrite';
import { cloningActions } from '../store/cloning';
import { getUsedPrimerIds, shiftStateIds } from '../store/cloning_utils';

const { setState: setCloningState } = cloningActions;

const collectParentEntitiesAndSources = (source, sources, entities, entitiesToExport, sourcesToExport) => {
  source.input.forEach((entityId) => {
    entitiesToExport.push(entities.find((e) => e.id === entityId));
    const parentSource = sources.find((s) => s.output === entityId);
    sourcesToExport.push(parentSource);
    collectParentEntitiesAndSources(parentSource, sources, entities, entitiesToExport, sourcesToExport);
  });
};

export const getSubState = (state, id) => {
  const { entities, sources, primers } = state.cloning;
  const entitiesToExport = entities.filter((e) => e.id === id);
  const sourcesToExport = sources.filter((s) => s.output === id);
  collectParentEntitiesAndSources(sourcesToExport[0], sources, entities, entitiesToExport, sourcesToExport);
  return { entities: entitiesToExport, sources: sourcesToExport, primers };
};

export const exportSubStateThunk = (fileName, entityId) => async (dispatch, getState) => {
  // Download the subHistory for a given entity
  const state = getState();
  const substate = getSubState(state, entityId);
  downloadStateAsJson({ ...substate, description: '' }, fileName);
};

export const mergeStateThunk = (newState, skipPrimers = false, files = []) => (dispatch, getState) => {
  const { cloning: oldState } = getState();
  const existingPrimerNames = oldState.primers.map((p) => p.name);

  if (newState.primers === undefined || newState.entities === undefined || newState.sources === undefined) {
    throw new Error('JSON file should contain at least keys: primers, sequences and sources');
  }
  if (newState.primers.length > 0 && skipPrimers) {
    throw new Error('Primers cannot be loaded when skipping primers');
  }
  if (newState.primers.some((p) => existingPrimerNames.includes(p.name))) {
    throw new Error('Primer name from loaded file exists in current session');
  }

  const { newState2, networkShift } = shiftStateIds(newState, oldState, skipPrimers);
  try {
    dispatch(setCloningState({
      sources: [...oldState.sources, ...newState2.sources],
      entities: [...oldState.entities, ...newState2.entities],
      primers: [...oldState.primers, ...newState2.primers],
      files: [...oldState.files, ...newState2.files],
    }));
  } catch (e) {
    throw new Error('Failed to merge state');
  }

  loadFilesToSessionStorage(files, networkShift);
};

export const copyEntityThunk = (entityId) => async (dispatch, getState) => {
  const state = getState();
  const { entities, sources } = state.cloning;
  const entitiesToCopy = entities.filter((e) => e.id === entityId);
  const sourcesToCopy = sources.filter((s) => s.output === entityId);
  collectParentEntitiesAndSources(sourcesToCopy[0], sources, entities, entitiesToCopy, sourcesToCopy);
  const entityIds = entitiesToCopy.map((e) => e.id);
  const filesToCopy = state.cloning.files.filter((f) => entityIds.includes(f.sequence_id));
  const newState = cloneDeep({
    entities: entitiesToCopy,
    sources: sourcesToCopy,
    primers: [],
    files: filesToCopy,
  });
  const files = filesToCopy.map((f) => new File(
    [base64ToBlob(sessionStorage.getItem(`verification-${f.sequence_id}-${f.file_name}`))],
    `verification-${f.sequence_id}-${f.file_name}`,
    { type: 'application/octet-stream' },
  ));
  dispatch(mergeStateThunk(newState, true, files));
};

const linkToParent = async (childId, parentId, apiKey) => {
  await axios.post(
    `https://localhost:443/api/v2/items/${childId}/items_links/${parentId}`,
    { parent_id: parentId },
    { headers: { Authorization: apiKey } },
  );
};

export const uploadPrimerToELabFTWThunk = (id, title, categoryId, apiKey, linkedSequenceId = null) => async (dispatch, getState) => {
  const state = getState();
  const primer = state.cloning.primers.find((p) => p.id === id);

  // Create item
  const createdItemResponse = await axios.post(
    'https://localhost:443/api/v2/items',
    {
      category_id: categoryId,
      tags: [],
    },
    { headers: { Authorization: apiKey } },
  );
  const itemId = createdItemResponse.headers.location.split('/').pop();

  // Set the title
  await axios.patch(
    `https://localhost:443/api/v2/items/${itemId}`,
    { title, metadata: JSON.stringify({ extra_fields: { sequence: { type: 'text', value: primer.sequence, group_id: null } } }) },
    { headers: { Authorization: apiKey } },
  );

  // If the primer is linked to a sequence, link the primer to the sequence
  if (linkedSequenceId) {
    await linkToParent(linkedSequenceId, itemId, apiKey);
  }

  dispatch(cloningActions.editPrimer({ id, sequence: primer.sequence, database_id: itemId }));
  dispatch(cloningActions.addAlert({
    message: 'Primer created successfully',
    severity: 'success',
  }));
};

export const uploadSequenceToELabFTWThunk = (id, title, categoryId, apiKey, primerCategoryId) => async (dispatch, getState) => {
  const state = getState();
  const { sources, primers, entities } = getSubState(state, id);

  const eLabFTWSources = sources.filter((source) => source.type === 'ELabFTWFileSource');
  const links2add = eLabFTWSources.map((source) => source.database_id.item_id);

  const entity2export = entities.find((e) => e.id === id);

  const primersToSave = [];
  const primersInUse = getUsedPrimerIds(sources);
  const existingPrimersToLink = primers.filter((p) => primersInUse.includes(p.id) && p.database_id).map((p) => p.database_id);
  if (primerCategoryId) {
    primersToSave.push(...primers.filter((p) => primersInUse.includes(p.id) && !p.database_id));
  }

  // Create item
  const createdItemResponse = await axios.post(
    'https://localhost:443/api/v2/items',
    {
      category_id: categoryId,
      tags: [],
    },
    { headers: { Authorization: apiKey } },
  );
  const itemId = createdItemResponse.headers.location.split('/').pop();

  // Set the title
  await axios.patch(
    `https://localhost:443/api/v2/items/${itemId}`,
    { title },
    { headers: { Authorization: apiKey } },
  );

  // Link to the parents
  await Promise.all(links2add.map((link) => linkToParent(itemId, link, apiKey)));

  // Upload the new primers and link the primers to the sequence
  primersToSave.forEach((primer) => {
    dispatch(uploadPrimerToELabFTWThunk(primer.id, primer.name, primerCategoryId, apiKey, itemId));
  });

  // TODO: error handling here
  // Link existing primers to the sequence
  await Promise.all(existingPrimersToLink.map((pid) => linkToParent(itemId, pid, apiKey)));

  // Upload the sequence file
  const formData = new FormData();
  const blob = new Blob([entity2export.file_content]);
  formData.append('file', blob, `${title}.gb`);
  formData.append('comment', 'resource sequence - generated by OpenCloning');
  const sequenceUploadResponse = await axios.post(
    `https://localhost:443/api/v2/items/${itemId}/uploads`,
    formData,
    { headers: { Authorization: apiKey, 'content-type': 'multipart/form-data' } },
  );
  const sequenceFileId = sequenceUploadResponse.headers.location.split('/').pop();

  // Upload the history
  const historyBlob = new Blob([JSON.stringify({ sources, sequences: entities, primers })], { type: 'application/json' });
  const historyFormData = new FormData();
  historyFormData.append('file', historyBlob, `${title}_history.json`);
  historyFormData.append('comment', 'history file - generated by OpenCloning');
  const historyUploadResponse = await axios.post(
    `https://localhost:443/api/v2/items/${itemId}/uploads`,
    historyFormData,
    { headers: { Authorization: apiKey, 'content-type': 'multipart/form-data' } },
  );
  const historyFileId = historyUploadResponse.headers.location.split('/').pop();

  dispatch(cloningActions.addDatabaseId({ databaseId: { item_id: itemId, sequence_id: sequenceFileId, history_id: historyFileId }, id }));
  dispatch(cloningActions.addAlert({
    message: 'Item created successfully',
    severity: 'success',
  }));
};
