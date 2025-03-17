import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import PrimersNotInDatabaseComponent from './PrimersNotInDatabaseComponent';
import { clickMultiSelectOption } from '../../../cypress/e2e/common_functions';
import { eLabFTWHttpClient } from './common';

// Mock initial state
const createMockState = (primers = [], sources = []) => ({
  cloning: {
    subStates: {
      'test-id': {
        primers,
        sources,
      },
    },
  },
});

const createTestStore = (initialState) => configureStore({
  reducer: {
    cloning: (state = initialState.cloning) => state,
  },
  preloadedState: initialState,
});

describe('<PrimersNotInDatabaseComponent />', () => {
  beforeEach(() => {
    // Stub API calls for category selection
    cy.stub(eLabFTWHttpClient, 'get')
      .withArgs('/api/v2/items_types')
      .resolves({
        data: [
          { id: 1, title: 'Primers' },
          { id: 2, title: 'Other' },
        ],
      });
  });

  it('renders nothing when no primers need saving', () => {
    const store = createTestStore(createMockState(
      [{ id: 1, name: 'Primer1', database_id: 123 }],
      [{ id: 'source1', primers: [1] }],
    ));

    cy.mount(
      <Provider store={store}>
        <PrimersNotInDatabaseComponent
          id="test-id"
          submissionData={{}}
          setSubmissionData={cy.spy().as('setSubmissionDataSpy')}
        />
      </Provider>,
    );

    // Component should not render anything
    cy.get('.MuiAlert-root').should('not.exist');
  });

  it('shows primers that need saving and handles category selection', () => {
    const primers = [
      { id: 1, name: 'Primer1', database_id: null },
      { id: 2, name: 'Primer2', database_id: null },
      { id: 3, name: 'Primer3', database_id: 123 }, // Already in database
    ];
    const sources = [
      { id: 'source1', primers: [1, 2, 3] },
    ];

    const store = createTestStore(createMockState(primers, sources));
    const setSubmissionDataSpy = cy.spy().as('setSubmissionDataSpy');

    cy.mount(
      <Provider store={store}>
        <PrimersNotInDatabaseComponent
          id="test-id"
          submissionData={{}}
          setSubmissionData={setSubmissionDataSpy}
        />
      </Provider>,
    );

    // Should show primers that need saving
    cy.get('.MuiAlert-message').within(() => {
      cy.contains('Do you want used primers to be saved to the database?').should('exist');
      cy.contains('Primer1').should('exist');
      cy.contains('Primer2').should('exist');
      cy.contains('Primer3').should('not.exist');
    });

    // Select a category
    clickMultiSelectOption('Save primers as', 'Primers', 'div');

    // Should update submission data
    cy.get('@setSubmissionDataSpy').should((spy) => {
      const updateFn = spy.lastCall.args[0];
      const result = updateFn({});
      expect(result).to.deep.equal({ primerCategoryId: 1 });
    });
  });

  it('shows success state when category is selected', () => {
    const primers = [
      { id: 1, name: 'Primer1', database_id: null },
    ];
    const sources = [
      { id: 'source1', primers: [1] },
    ];

    const store = createTestStore(createMockState(primers, sources));

    cy.mount(
      <Provider store={store}>
        <PrimersNotInDatabaseComponent
          id="test-id"
          submissionData={{ primerCategoryId: 1 }}
          setSubmissionData={cy.spy().as('setSubmissionDataSpy')}
        />
      </Provider>,
    );

    // Should show success state
    cy.get('.MuiAlert-root').should('have.attr', 'severity', 'success');
    cy.contains('Do you want used primers to be saved to the database?').should('not.exist');
  });

  it('handles category deselection', () => {
    const primers = [
      { id: 1, name: 'Primer1', database_id: null },
    ];
    const sources = [
      { id: 'source1', primers: [1] },
    ];

    const store = createTestStore(createMockState(primers, sources));
    const setSubmissionDataSpy = cy.spy().as('setSubmissionDataSpy');

    cy.mount(
      <Provider store={store}>
        <PrimersNotInDatabaseComponent
          id="test-id"
          submissionData={{ primerCategoryId: 1 }}
          setSubmissionData={setSubmissionDataSpy}
        />
      </Provider>,
    );

    // Clear the category selection
    cy.get('.MuiAutocomplete-clearIndicator').click();

    // Should update submission data
    cy.get('@setSubmissionDataSpy').should((spy) => {
      const updateFn = spy.lastCall.args[0];
      const result = updateFn({ primerCategoryId: 1 });
      expect(result).to.deep.equal({ primerCategoryId: null });
    });
  });
});
