import { createSlice } from '@reduxjs/toolkit';
import { getNextPrimerId, getNextUniqueId } from './cloning_utils';
import { convertToTeselaJson } from '../utils/readNwrite';

function deleteFilesFromSessionStorage(sequenceId, fileName = null) {
  Object.keys(sessionStorage)
    .filter((key) => {
      let query = `verification-${sequenceId}-`;
      if (fileName) {
        query += fileName;
      }
      return key.startsWith(query);
    }).forEach((key) => sessionStorage.removeItem(key));
}

const initialState = {
  mainSequenceId: null,
  mainSequenceSelection: {},
  sources: [
    {
      id: 1,
      input: [],
      output: null,
      type: null,
    },
  ],
  entities: [],
  network: null,
  currentTab: 0,
  description: '',
  selectedRegions: [],
  knownErrors: {},
  primers: [],
  primer2entityLinks: [],
  config: {
    loaded: false,
    backendUrl: null,
  },
  sourcesWithHiddenAncestors: [],
  teselaJsonCache: {},
  alerts: [],
  files: [],
};

/* eslint-disable no-param-reassign */
const reducer = {

  setCurrentTab(state, action) {
    state.currentTab = action.payload;
  },

  setMainSequenceId(state, action) {
    state.mainSequenceId = action.payload;
    state.mainSequenceSelection = {};
  },

  setMainSequenceSelection(state, action) {
    state.mainSequenceSelection = action.payload;
  },

  addEmptySource(state, action) {
    const inputEntitiesIds = action.payload;
    const { sources } = state;
    const nextUniqueId = getNextUniqueId(state);
    sources.push({
      id: nextUniqueId,
      input: inputEntitiesIds,
      output: null,
      type: null,
    });
  },

  restoreSource(state, action) {
    // This is used to roll back a source that was deleted
    const source = action.payload;
    const { sources } = state;
    sources.push(source);
  },

  addTemplateChildAndSubsequentSource(state, action) {
    // This is used by the Hom. Rec. primer design. You pass a
    // sourceId for which you want to add a template sequence as
    // an output, and then a source that will take that template
    // sequence as input. The source can also have existing sequences
    // as input.
    const { sourceId, newEntity, newSource } = action.payload;
    const { sources, entities } = state;
    const source2update = sources.find((s) => s.id === sourceId);
    if (source2update === undefined) {
      throw new Error('Source not found');
    }
    const newEntityId = getNextUniqueId(state);

    // Update the source that will output the template sequence
    source2update.output = newEntityId;

    // Add the template sequence
    entities.push({
      id: newEntityId,
      ...newEntity,
    });

    // Add the source that will take the template sequence as input
    sources.push({
      id: newEntityId + 1,
      ...newSource,
      input: [...newSource.input || [], newEntityId],
    });
  },

  addPCRsAndSubsequentSourcesForAssembly(state, action) {
    // This is used by the PCR primer design for Gibson Assemblies. You pass a
    // sourceId (PCR from which the primer design was started),
    // and a list of templateIds to be amplified by PCR. Their outputs
    // will be used as input for a subsequent assembly reaction.
    const { sourceId, templateIds, sourceType, newEntity } = action.payload;
    const { sources, entities } = state;

    if (sources.find((s) => s.id === sourceId) === undefined) {
      throw new Error('Source not found');
    }
    const sources2update = [sourceId];
    // Add the PCR sources
    templateIds.forEach((templateId) => {
      const nextId = getNextUniqueId(state);
      const newSource = {
        id: nextId,
        input: [templateId],
        output: null,
        type: 'PCRSource',
      };
      sources.push(newSource);
      sources2update.push(newSource.id);
    });

    // Add the output entities
    const newEntityIds = [];
    sources2update.forEach((id) => {
      const newEntityId = getNextUniqueId(state);
      entities.push({
        ...newEntity,
        id: newEntityId,
      });
      newEntityIds.push(newEntityId);
      const newSource = sources.find((s) => s.id === id);
      newSource.output = newEntityId;
    });

    if (sourceType !== null) {
      // Add the Assembly that takes the PCR outputs as input
      sources.push({
        id: getNextUniqueId(state),
        input: newEntityIds,
        output: null,
        type: sourceType,
      });
    }
  },

  addSourceAndItsOutputEntity(state, action) {
    const { source, entity } = action.payload;
    const { sources, entities } = state;

    const sourceId = getNextUniqueId(state);
    const entityId = sourceId + 1;
    const newEntity = {
      ...entity,
      id: entityId,
    };
    const newSource = {
      ...source,
      id: sourceId,
      output: entityId,
    };
    entities.push(newEntity);
    sources.push(newSource);
    state.teselaJsonCache[entityId] = convertToTeselaJson(newEntity);
  },

  addSequenceInBetween(state, action) {
    const existingSourceId = action.payload;
    const existingSource = state.sources.find((s) => s.id === existingSourceId);
    const newSourceId = getNextUniqueId(state);
    const newEntity = {
      id: newSourceId + 1,
      type: 'TemplateSequence',
    };
    const newSource = {
      id: newSourceId,
      input: existingSource.input,
      output: newEntity.id,
      type: null,
    };
    existingSource.input = [newEntity.id];
    state.sources.push(newSource);
    state.entities.push(newEntity);
  },

  addEntityAndUpdateItsSource(state, action) {
    const { newEntity, newSource } = action.payload;
    const { entities, sources } = state;
    const nextUniqueId = getNextUniqueId(state);
    newEntity.id = nextUniqueId;
    newSource.output = nextUniqueId;

    const sourceIndex = sources.findIndex((s) => s.id === newSource.id);
    if (sourceIndex === -1) {
      throw new Error('Source not found');
    }
    sources.splice(sourceIndex, 1, newSource);
    entities.push(newEntity);
    state.teselaJsonCache[newEntity.id] = convertToTeselaJson(newEntity);
  },

  updateEntityAndItsSource(state, action) {
    const { newEntity, newSource } = action.payload;
    const { entities, sources } = state;

    const sourceIndex = sources.findIndex((s) => s.id === newSource.id);
    if (sourceIndex === -1) {
      throw new Error('Source not found');
    }
    sources.splice(sourceIndex, 1, newSource);

    newEntity.id = newSource.output;
    const entityIndex = entities.findIndex((e) => e.id === newEntity.id);
    if (entityIndex === -1) {
      throw new Error('Entity not found');
    }
    entities.splice(entityIndex, 1, newEntity);
    state.teselaJsonCache[newEntity.id] = convertToTeselaJson(newEntity);
  },

  updateSource(state, action) {
    const newSource = action.payload;
    const { sources } = state;
    const source = sources.find((s) => s.id === newSource.id);
    Object.assign(source, newSource);
  },

  replaceSource(state, action) {
    const newSource = action.payload;
    const { sources } = state;
    const sourceIndex = sources.findIndex((s) => s.id === newSource.id);
    if (sourceIndex === -1) {
      throw new Error('Source not found');
    }
    sources.splice(sourceIndex, 1, newSource);
  },

  deleteSourceAndItsChildren(state, action) {
    const sourceId = action.payload;
    const { sources, entities } = state;
    const sources2delete = [];
    const entities2delete = [];
    const currentSources = [sources.find((s) => s.id === sourceId)];
    while (currentSources.length > 0) {
      const currentSource = currentSources.pop();
      sources2delete.push(currentSource.id);
      if (currentSource.output !== null) {
        entities2delete.push(currentSource.output);
        currentSources.push(...sources.filter((ss) => ss.input.includes(currentSource.output)));
      }
    }
    state.sources = sources.filter((s) => !sources2delete.includes(s.id));
    state.entities = entities.filter((e) => !entities2delete.includes(e.id));
    state.files = state.files.filter((f) => !entities2delete.includes(f.sequence_id));
    entities2delete.forEach((e) => {
      delete state.teselaJsonCache[e];
      deleteFilesFromSessionStorage(e);
    });
  },

  setState(state, action) {
    const { sources, entities, primers, description, files } = action.payload;
    if (!Array.isArray(sources) || !Array.isArray(entities)) {
      throw new Error('Cloning strategy not valid: fields `sources` and `entities` should exist and be arrays');
    }
    const ids = [...sources.map((s) => s.id), ...entities.map((e) => e.id)];
    // They should all be positive integers
    if (ids.some((id) => id < 1 || !Number.isInteger(id))) {
      throw new Error('Some ids are not positive integers');
    }
    // None should be repeated
    if (new Set(ids).size !== ids.length) {
      throw new Error('Repeated ids in the sources and entities');
    }
    state.sources = sources;
    state.entities = entities;
    state.teselaJsonCache = {};
    state.primers = primers || [];
    state.description = description || '';
    state.files = files || [];
    entities.forEach((e) => {
      if (e.type === 'TextFileSequence') {
        state.teselaJsonCache[e.id] = convertToTeselaJson(e);
      }
    });
  },

  setDescription(state, action) {
    state.description = action.payload;
  },

  setSelectedRegions(state, action) {
    state.selectedRegions = [...action.payload];
  },

  setKnownErrors(state, action) {
    state.knownErrors = action.payload;
  },

  setConfig(state, action) {
    state.config = action.payload;
    state.config.loaded = true;
  },

  addPrimer(state, action) {
    const primer = action.payload;
    const { primers } = state;
    const nextPrimerId = getNextPrimerId(primers);
    primers.push({ ...primer, id: nextPrimerId });
  },

  addPrimerAndLinkToEntity(state, action) {
    const { primer, entityId, position } = action.payload;
    const { primers, primer2entityLinks } = state;
    const nextPrimerId = getNextPrimerId(primers);
    primers.push({ ...primer, id: nextPrimerId });
    primer2entityLinks.push({ primerId: nextPrimerId, entityId, position });
  },

  setPrimers(state, action) {
    const primers = action.payload;
    // Ids are unique and all are positive integers
    const ids = primers.map((p) => p.id);
    if (ids.some((id) => id < 1 || !Number.isInteger(id))) {
      throw new Error('Some ids are not positive integers');
    }
    // None should be repeated
    if (new Set(ids).size !== ids.length) {
      throw new Error('Repeated ids in the primers');
    }
    state.primers = primers;
  },

  deletePrimer(state, action) {
    const primerId = action.payload;
    state.primers = state.primers.filter((p) => p.id !== primerId);
    // Delete all links to this primer
    state.primer2entityLinks = state.primer2entityLinks.filter((link) => link.primerId !== primerId);
  },

  editPrimer(state, action) {
    const editedPrimer = action.payload;
    const targetPrimer = state.primers.find((p) => p.id === editedPrimer.id);
    if (!targetPrimer) {
      throw new Error('Primer not found');
    }
    Object.assign(targetPrimer, editedPrimer);
  },

  addPrimersToPCRSource(state, action) {
    const { sourceId, fwdPrimer, revPrimer } = action.payload;
    const { sources, primers } = state;
    const nextId = getNextPrimerId(primers);
    // For now, primers were coming with id=0 from the backend
    const copyFwdPrimer = { ...fwdPrimer };
    const copyRevPrimer = { ...revPrimer };
    copyFwdPrimer.id = nextId;
    copyRevPrimer.id = nextId + 1;
    primers.push(copyFwdPrimer);
    primers.push(copyRevPrimer);

    const source = sources.find((s) => s.id === sourceId);
    if (!source) {
      throw new Error('Source not found');
    }
    source.forward_primer = nextId;
    source.reverse_primer = nextId + 1;
  },

  addToSourcesWithHiddenAncestors(state, action) {
    const sourceId = action.payload;
    state.sourcesWithHiddenAncestors.push(sourceId);
  },

  removeFromSourcesWithHiddenAncestors(state, action) {
    const sourceId = action.payload;
    state.sourcesWithHiddenAncestors = state.sourcesWithHiddenAncestors.filter((id) => id !== sourceId);
  },

  addAlert(state, action) {
    state.alerts.push(action.payload);
  },

  removeAlert(state, action) {
    const message = action.payload;
    state.alerts = state.alerts.filter((a) => a.message !== message);
  },

  addFile(state, action) {
    state.files.push(action.payload);
  },

  setFiles(state, action) {
    state.files = action.payload;
  },

  removeFile(state, action) {
    const { fileName, sequenceId } = action.payload;
    state.files = state.files.filter((f) => f.file_name !== fileName || f.sequence_id !== sequenceId);
  },

  removeFilesAssociatedToSequence(state, action) {
    const sequenceId = action.payload;
    state.files = state.files.filter((f) => f.sequence_id !== sequenceId);
    deleteFilesFromSessionStorage(sequenceId);
  },

  addDatabaseIdToEntity(state, action) {
    const { databaseId, id } = action.payload;
    const entity = state.entities.find((e) => e.id === id);
    if (!entity) {
      throw new Error('Entity not found');
    }
    const source = state.sources.find((s) => s.output === id);
    if (!source) {
      throw new Error('Source not found');
    }
    source.database_id = databaseId;
  },
  addDatabaseIdToPrimer(state, action) {
    const { databaseId, localId } = action.payload;
    const primer = state.primers.find((p) => p.id === localId);
    if (!primer) {
      throw new Error('Primer not found');
    }
    primer.database_id = databaseId;
  },
};

/* eslint-enable no-param-reassign */

const cloningSlice = createSlice({
  name: 'cloning',
  initialState: { ...initialState },
  reducers: reducer,
});

export const cloningActions = cloningSlice.actions;
export default cloningSlice.reducer;
