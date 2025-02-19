import { cloningActions } from '../../src/store/cloning';

const { setState: setCloningState } = cloningActions;

/**
 * Loads test data and mounts a component for verification testing
 * @param {string} jsonPath - Path to the JSON test file
 * @param {Function} mountCallback - Callback that mounts the component
 * @returns {Cypress.Chainable} - A chainable promise for further assertions
 */
export function loadDataAndMount(jsonPath, store, mountCallback) {
  // Create a promise to handle the async dispatch
  const loadDataPromise = (data) => new Promise((resolve) => {
    store.dispatch(async (dispatch) => {
      const data2 = { ...data, entities: data.sequences };
      delete data2.sequences;
      dispatch(setCloningState(data2));
      resolve();
    });
  });

  // Return the chainable promise
  return cy.readFile(jsonPath)
    .then(loadDataPromise)
    .then(() => {
      mountCallback();
    });
}
