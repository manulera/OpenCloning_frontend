import React from 'react';
import PrimerSelect from './PrimerSelect';
import { DatabaseProvider } from '@opencloning/ui/providers/DatabaseContext';
import OpenCloningDBInterface from './OpenCloningDBInterface';
import { clickMultiSelectOption } from '../../../cypress/e2e/common_functions';

describe('<PrimerSelect />', () => {
  it('searches for "ase1" and shows results', () => {
    cy.loginToOpenCloningDB('bootstrap@example.com', 'password', 1);
    const primerSpy = cy.spy().as('primerSpy');
    cy.mount(
      <DatabaseProvider value={OpenCloningDBInterface}>
        <PrimerSelect setPrimer={primerSpy} />
      </DatabaseProvider>
    );
    // Clicking on the input
    cy.get('input').click();
    cy.contains('Type at least').should('exist');
    cy.get('input').type('ase1');
    cy.get('.MuiAutocomplete-listbox li', { timeout: 10000 }).should('have.length.greaterThan', 0);
    clickMultiSelectOption('Primer', 'ase1_fwd', 'div');

    cy.getStub('get_primers').then((primersStub) => {
      const selectedPrimer = primersStub.response.body.items.find(primer => primer.name === 'ase1_fwd');
      cy.get('@primerSpy').should('have.been.calledWith', selectedPrimer);
    });

    // Input should show the selected primer
    cy.get('input').should('have.value', '16 - ase1_fwd');
  });

  it('shows an error message when the request fails', () => {
    cy.intercept('GET', 'http://localhost:8001/primers*', { statusCode: 500 }).as('getPrimers');
    cy.mount(
      <DatabaseProvider value={OpenCloningDBInterface}>
        <PrimerSelect setPrimer={cy.stub()} />
      </DatabaseProvider>
    );
    cy.get('input').type('ase1');
    cy.wait('@getPrimers');
    cy.contains('Could not retrieve primers from OpenCloningDB').should('exist');
    cy.contains('button', 'Retry').should('exist');
  });
});
