import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import SubmitToDatabaseComponent from './SubmitToDatabaseComponent';
import { eLabFTWHttpClient } from './common';
import { mockEntities, mockPrimers, mockSources, mockTeselaJsonCache } from '../../../tests/mockNetworkData';
import { clearAutocompleteValue } from '../../../cypress/e2e/common_functions';

// Mock initial state with both primers and sequences
const defaultState = {
  entities: mockEntities,
  sources: mockSources,
  primers: mockPrimers,
  teselaJsonCache: mockTeselaJsonCache,
};

const createTestStore = (cloningState) => configureStore({
  reducer: {
    cloning: (state = cloningState) => state,
  },
  preloadedState: { cloning: cloningState },
});

describe('<SubmitToDatabaseComponent />', () => {
  it('Primers: initializes with primer name and handles updates', () => {
    cy.stub(eLabFTWHttpClient, 'get')
      .withArgs('/api/v2/items_types', { headers: { Authorization: 'test-read-key' } })
      .resolves({
        data: [
          { id: 1, title: 'Primers' },
          { id: 2, title: 'Sequences' },
        ],
      });
    const store = createTestStore(defaultState);
    const setSubmissionDataSpy = cy.spy().as('setSubmissionDataSpy');

    cy.mount(
      <Provider store={store}>
        <SubmitToDatabaseComponent
          id={1}
          resourceType="primer"
          setSubmissionData={setSubmissionDataSpy}
        />
      </Provider>,
    );

    // Should initialize with primer name
    cy.get('input#resource_title').should('have.value', 'Primer1');

    // Change title
    cy.get('input#resource_title').clear();
    cy.get('input#resource_title').type('Modified Primer');

    // Select category
    cy.get('input').last().click();
    cy.get('li').contains('Primers').click();

    // Should update submission data with both title and category
    cy.get('@setSubmissionDataSpy').should((spy) => {
      const updateFn = spy.lastCall.args[0];
      const result = updateFn({ existingKey: 'value' });
      expect(result).to.deep.equal({
        existingKey: 'value',
        sequenceCategoryId: 1,
        title: 'Modified Primer',
      });
    });
    // Clearing the field should set submission data to null
    clearAutocompleteValue('Save primer as', 'div');
    cy.get('@setSubmissionDataSpy').should((spy) => {
      const result = spy.lastCall.args[0];
      expect(result).equal(null);
    });
  });

  it('Sequences: initializes with sequence name and handles updates', () => {
    cy.stub(eLabFTWHttpClient, 'get')
      .withArgs('/api/v2/items_types', { headers: { Authorization: 'test-read-key' } })
      .resolves({
        data: [
          { id: 1, title: 'Primers' },
          { id: 2, title: 'Sequences' },
        ],
      });
    const store = createTestStore(defaultState);
    const setSubmissionDataSpy = cy.spy().as('setSubmissionDataSpy');

    cy.mount(
      <Provider store={store}>
        <SubmitToDatabaseComponent
          id={1}
          resourceType="sequence"
          setSubmissionData={setSubmissionDataSpy}
        />
      </Provider>,
    );

    // Should initialize with primer name
    cy.get('input#resource_title').should('have.value', 'Entity1');

    // Change title
    cy.get('input#resource_title').clear();
    cy.get('input#resource_title').type('Modified Sequence');

    // Select category
    cy.get('input').last().click();
    cy.get('li').contains('Sequences').click();

    // Should update submission data with both title and category
    cy.get('@setSubmissionDataSpy').should((spy) => {
      const updateFn = spy.lastCall.args[0];
      const result = updateFn({ existingKey: 'value' });
      expect(result).to.deep.equal({
        existingKey: 'value',
        sequenceCategoryId: 2,
        title: 'Modified Sequence',
      });
    });
    // Clearing the field should set submission data to null
    clearAutocompleteValue('Save sequence as', 'div');
    cy.get('@setSubmissionDataSpy').should((spy) => {
      const result = spy.lastCall.args[0];
      expect(result).equal(null);
    });
  });

  it('handles API errors in category loading', () => {
    const store = createTestStore(defaultState);
    let firstCall = true;

    // Stub API to fail first time
    cy.stub(eLabFTWHttpClient, 'get')
      .withArgs('/api/v2/items_types', { headers: { Authorization: 'test-read-key' } })
      .callsFake(() => {
        if (firstCall) {
          firstCall = false;
          const error = new Error('Failed to fetch');
          error.response = { status: 500 };
          return Promise.reject(error);
        }
        return Promise.resolve({
          data: [
            { id: 1, title: 'Primers' },
            { id: 2, title: 'Sequences' },
          ],
        });
      });

    cy.mount(
      <Provider store={store}>
        <SubmitToDatabaseComponent
          id={1}
          resourceType="primer"
          setSubmissionData={cy.spy()}
        />
      </Provider>,
    );

    // Should show error state
    cy.get('.MuiAlert-colorError').should('exist');
    cy.contains('Could not retrieve categories').should('exist');

    // Click retry
    cy.contains('Retry').click();

    // Should show categories after retry
    cy.get('input').last().click();
    cy.get('li').contains('Primers').should('exist');
    cy.get('li').contains('Sequences').should('exist');
  });
});
