import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import PrimerTableRow from './PrimerTableRow';

const defaultState = {
  config: { loaded: true, backendUrl: 'https://backend/url' },
};

const store = configureStore({
  reducer: {
    cloning: (state = defaultState) => state,
  },
  preloadedState: { cloning: defaultState },
});

const primer = {
  id: 1,
  name: 'Test Primer',
  sequence: 'ATCG',
  database_id: null,
};

describe('<PrimerTableRow />', () => {
  it('caches primer details after first fetch', () => {
    cy.intercept('GET', '**/primer_details*', {
      statusCode: 200,
      body: {
        melting_temperature: 50.5,
        gc_content: 0.25,
      },
    }).as('getPrimerDetails');

    cy.mount(
      <Provider store={store}>
        <PrimerTableRow
          primer={primer}
        />
      </Provider>,
    );

    // First render should make the request and display the loading skeleton
    cy.get('.melting-temperature .MuiSkeleton-root').should('exist');
    cy.get('.gc-content .MuiSkeleton-root').should('exist');
    cy.wait('@getPrimerDetails');
    cy.get('.melting-temperature').should('contain', '50.5');
    cy.get('.gc-content').should('contain', '0.25');

    // Re-mounting with same sequence should not make another request
    cy.mount(
      <PrimerTableRow
        primer={primer}
      />,
    );

    cy.get('@getPrimerDetails.all').should('have.length', 1);
    cy.get('.melting-temperature').should('contain', '50.5');
    cy.get('.gc-content').should('contain', '0.25');
  });
  it('handles network errors or server errors', () => {
    cy.intercept('GET', '**/primer_details*', {
      forceNetworkError: true,
    }).as('getPrimerDetails2');
    cy.mount(
      <Provider store={store}>
        <PrimerTableRow
          // We have to use a different sequence to avoid caching
          primer={{ ...primer, sequence: 'AAAA' }}
          deletePrimer={cy.spy().as('deletePrimer')}
          canBeDeleted
          onEditClick={cy.spy().as('onEditClick')}
        />
      </Provider>,
    );
    cy.wait('@getPrimerDetails2');
    cy.get('.melting-temperature [data-testid="ErrorIcon"]').should('exist');
    cy.get('.gc-content [data-testid="ErrorIcon"]').should('exist');
    cy.get('@getPrimerDetails2.all').should('have.length', 1);
    // Check tooltip text on error icon hover
    cy.get('.melting-temperature [data-testid="ErrorIcon"]').trigger('mouseover');
    cy.get('.MuiTooltip-popper').should('contain', 'Retry request to get primer details');
    // After clicking retry, getPrimerDetails should be called again
    cy.get('.melting-temperature [data-testid="ErrorIcon"]').click();
    cy.get('@getPrimerDetails2.all').should('have.length', 2);
  });
});
