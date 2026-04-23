import React from 'react';
import PrimerSelect from './PrimerSelect';
import { DatabaseProvider } from '@opencloning/ui/providers/DatabaseContext';
import OpenCloningDBInterface from './OpenCloningDBInterface';
import { clickMultiSelectOption } from '../../../cypress/e2e/common_functions';

describe('<PrimerSelect />', () => {
  beforeEach(() => {
    cy.loginToOpenCloningDB('bootstrap@example.com', 'password', 1);
  });


  it('searches for "ase1" and shows results', () => {
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
});
