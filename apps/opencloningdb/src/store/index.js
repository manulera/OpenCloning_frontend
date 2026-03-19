import store, { extendStore } from '@opencloning/store';
import appReducer from './appReducer';

extendStore({ opencloningdb: appReducer });

export default store;
