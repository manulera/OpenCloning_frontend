import { createSlice } from '@reduxjs/toolkit';
import { doesSourceHaveOutput, getNextUniqueId } from './cloning_utils';
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
      type: null,
    },
  ],
  sequences: [],
  network: null,
  currentTab: 0,
  description: '',
  selectedRegions: [],
  knownErrors: {},
  primers: [],
  primer2sequenceLinks: [],
  config: {
    loaded: false,
    backendUrl: null,
  },
  sourcesWithHiddenAncestors: [],
  teselaJsonCache: {},
  alerts: [],
  files: [],
  appInfo: {},
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
    const inputSequencesIds = action.payload;
    const { sources } = state;
    const nextUniqueId = getNextUniqueId(state);
    sources.push({
      id: nextUniqueId,
      input: inputSequencesIds.map((id) => ({ sequence: id })),
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
    const { sourceId, newSequence, newSource } = action.payload;
    const { sources, sequences } = state;
    const source2update = sources.find((s) => s.id === sourceId);
    if (source2update === undefined) {
      throw new Error('Source not found');
    }

    // Add the template sequence
    sequences.push({
      id: sourceId,
      ...newSequence,
    });

    // Add the source that will take the template sequence as input
    sources.push({
      id: getNextUniqueId(state),
      ...newSource,
      input: [...(newSource.input || []), { sequence: sourceId }],
    });
  },

  addPCRsAndSubsequentSourcesForAssembly(state, action) {
    // This is used by the PCR primer design for Gibson Assemblies. You pass a
    // sourceId (PCR from which the primer design was started),
    // and a list of templateIds to be amplified by PCR. Their outputs
    // will be used as input for a subsequent assembly reaction.
    const { sourceId, templateIds, sourceType, newSequence } = action.payload;
    const { sources, sequences } = state;

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
        type: 'PCRSource',
      };
      sources.push(newSource);
      sources2update.push(newSource.id);
    });

    // Add the output sequences
    const newSequenceIds = [];
    sources2update.forEach((id) => {
      const newSequenceId = getNextUniqueId(state);
      sequences.push({
        ...newSequence,
        id: newSequenceId,
      });
      newSequenceIds.push(newSequenceId);
      const newSource = sources.find((s) => s.id === id);
      newSource.output = newSequenceId;
    });

    if (sourceType !== null) {
      // Add the Assembly that takes the PCR outputs as input
      sources.push({
        id: getNextUniqueId(state),
        input: newSequenceIds,
        type: sourceType,
      });
    }
  },

  addSourceAndItsOutputSequence(state, action) {
    const { source, sequence } = action.payload;
    const { sources, sequences } = state;

    const sourceId = getNextUniqueId(state);
    const sequenceId = sourceId;
    const newSequence = {
      ...sequence,
      id: sequenceId,
    };
    const newSource = {
      ...source,
      id: sourceId,
      output: sequenceId,
    };
    sequences.push(newSequence);
    sources.push(newSource);
    state.teselaJsonCache[sequenceId] = convertToTeselaJson(newSequence);
  },

  addSequenceInBetween(state, action) {
    const existingSourceId = action.payload;
    const existingSource = state.sources.find((s) => s.id === existingSourceId);
    const newSourceId = getNextUniqueId(state);
    const newSequence = {
      id: newSourceId,
      type: 'TemplateSequence',
    };
    const newSource = {
      id: newSourceId,
      input: existingSource.input,
      type: null,
    };
    existingSource.input = [{ sequence: newSequence.id }];
    state.sources.push(newSource);
    state.sequences.push(newSequence);
  },

  addSequenceAndUpdateItsSource(state, action) {
    const { newSequence, newSource } = action.payload;
    const { sequences, sources } = state;
    newSequence.id = newSource.id;

    const sourceIndex = sources.findIndex((s) => s.id === newSource.id);
    if (sourceIndex === -1) {
      throw new Error('Source not found');
    }
    sources.splice(sourceIndex, 1, newSource);
    sequences.push(newSequence);
    state.teselaJsonCache[newSequence.id] = convertToTeselaJson(newSequence);
  },

  updateSequenceAndItsSource(state, action) {
    const { newSequence, newSource } = action.payload;
    const { sequences, sources } = state;

    const sourceIndex = sources.findIndex((s) => s.id === newSource.id);
    if (sourceIndex === -1) {
      throw new Error('Source not found');
    }
    sources.splice(sourceIndex, 1, newSource);

    newSequence.id = newSource.id;
    const sequenceIndex = sequences.findIndex((e) => e.id === newSequence.id);
    if (sequenceIndex === -1) {
      throw new Error('Sequence not found');
    }
    sequences.splice(sequenceIndex, 1, newSequence);
    state.teselaJsonCache[newSequence.id] = convertToTeselaJson(newSequence);
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
    const { sources, sequences } = state;
    const sources2delete = [];
    const sequences2delete = [];
    const currentSources = [sources.find((s) => s.id === sourceId)];
    while (currentSources.length > 0) {
      const currentSource = currentSources.pop();
      sources2delete.push(currentSource.id);
      if (doesSourceHaveOutput(state, currentSource.id)) {
        sequences2delete.push(currentSource.id);
        currentSources.push(...sources.filter((ss) => ss.input.some(({sequence}) => sequence === currentSource.id)));
      }
    }
    state.sources = sources.filter((s) => !sources2delete.includes(s.id));
    state.sequences = sequences.filter((e) => !sequences2delete.includes(e.id));
    state.files = state.files.filter((f) => !sequences2delete.includes(f.sequence_id));
    sequences2delete.forEach((e) => {
      delete state.teselaJsonCache[e];
      deleteFilesFromSessionStorage(e);
    });
  },

  setState(state, action) {
    const { sources, sequences, primers, description, files } = action.payload;
    if (!Array.isArray(sources) || !Array.isArray(sequences)) {
      throw new Error('Cloning strategy not valid: fields `sources` and `sequences` should exist and be arrays');
    }
    const ids = [...sources.map((s) => s.id), ...sequences.map((e) => e.id)];
    // They should all be positive integers
    if (ids.some((id) => id < 1 || !Number.isInteger(id))) {
      throw new Error('Some ids are not positive integers');
    }
    // None should be repeated
    const sourceIds = sources.map((s) => s.id);
    const sequenceIds = sequences.map((e) => e.id);
    if (new Set(sourceIds).size !== sourceIds.length || new Set(sequenceIds).size !== sequenceIds.length) {
      throw new Error('Repeated ids in sources or sequences');
    }
    state.sources = sources;
    state.sequences = sequences;
    state.teselaJsonCache = {};
    state.primers = primers || [];
    state.description = description || '';
    state.files = files || [];
    sequences.forEach((e) => {
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
    const nextPrimerId = getNextUniqueId(state);
    primers.push({ ...primer, id: nextPrimerId });
  },

  addPrimerAndLinkToSequence(state, action) {
    const { primer, sequenceId, position } = action.payload;
    const { primers, primer2sequenceLinks } = state;
    const nextPrimerId = getNextUniqueId(state);
    primers.push({ ...primer, id: nextPrimerId });
    primer2sequenceLinks.push({ primerId: nextPrimerId, sequenceId, position });
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
    state.primer2sequenceLinks = state.primer2sequenceLinks.filter((link) => link.primerId !== primerId);
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
    const nextId = getNextUniqueId(state);
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
    source.input = [ {sequence: nextId}, ...source.input, {sequence: nextId + 1} ];
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

  addDatabaseIdToSequence(state, action) {
    const { databaseId, id } = action.payload;
    const sequence = state.sequences.find((e) => e.id === id);
    if (!sequence) {
      throw new Error('Sequence not found');
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

  updateAppInfo(state, action) {
    state.appInfo = { ...state.appInfo, ...action.payload };
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
