import { createSlice } from '@reduxjs/toolkit';
import { constructNetwork } from '../utils/network';

const initialState = {
  mainSequenceId: null,
  nextUniqueId: 2,
  sources: [
    {
      id: 1,
      input: [],
      output: null,
      type: null,
      kind: 'source',
    },
  ],
  entities: [],
  network: null,
  currentTab: 0,
  description: '',
};

/* eslint-disable no-param-reassign */
const reducer = {

  setCurrentTab(state, action) {
    state.currentTab = action.payload;
  },

  setMainSequenceId(state, action) {
    state.mainSequenceId = action.payload;
  },

  addEmptySource(state, action) {
    const inputEntitiesIds = action.payload;
    const { sources } = state;
    sources.push({
      id: state.nextUniqueId,
      input: inputEntitiesIds,
      output: null,
      type: null,
      kind: 'source',
    });
    state.nextUniqueId += 1;
    state.network = constructNetwork(state.entities, state.sources);
  },

  addEntityAndItsSource(state, action) {
    const { newEntity, newSource } = action.payload;
    const { entities, sources } = state;
    newEntity.id = state.nextUniqueId;
    newSource.output = state.nextUniqueId;
    state.nextUniqueId += 1;
    entities.push(newEntity);
    // Replace the source with the new one
    const source = sources.find((s) => s.id === newSource.id);
    Object.assign(source, newSource);
    state.network = constructNetwork(state.entities, state.sources);
  },

  updateSource(state, action) {
    const newSource = action.payload;
    const { sources } = state;
    const source = sources.find((s) => s.id === newSource.id);
    Object.assign(source, newSource);
    state.network = constructNetwork(state.entities, state.sources);
  },

  deleteSourceAndItsChildren(state, action) {
    const sourceId = action.payload;
    const { sources, entities } = state;
    const sources2delete = [];
    const entities2delete = [];
    let currentSource = sources.find((s) => s.id === sourceId);
    while (currentSource !== undefined) {
      sources2delete.push(currentSource.id);
      if (currentSource.output === null) { break; }
      entities2delete.push(currentSource.output);
      currentSource = sources.find((ss) => ss.input.includes(currentSource.output));
    }
    state.sources = sources.filter((s) => !sources2delete.includes(s.id));
    state.entities = entities.filter((e) => !entities2delete.includes(e.id));
    state.network = constructNetwork(state.entities, state.sources);
  },

  setState(state, action) {
    const { sources, entities } = action.payload;
    state.nextUniqueId = Math.max(...sources.map((s) => s.id), ...entities.map((e) => e.id)) + 1;
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
    state.network = constructNetwork(entities, sources);
  },

  setDescription(state, action) {
    state.description = action.payload;
  },

  revertToInitialState(state) {
    Object.assign(state, initialState);
    state.network = constructNetwork(initialState.entities, initialState.sources);
  },
};
/* eslint-enable no-param-reassign */

const cloningSlice = createSlice({
  name: 'cloning',
  initialState: { ...initialState, network: constructNetwork(initialState.entities, initialState.sources) },
  reducers: reducer,
});

export const cloningActions = cloningSlice.actions;
export default cloningSlice.reducer;
