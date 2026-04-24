import React from 'react';
import GetPrimerComponent from './GetPrimerComponent';
import { clickMultiSelectOption } from '../../../cypress/e2e/common_functions';

describe('<GetPrimerComponent />', () => {
  beforeEach(() => {
    cy.loginToOpenCloningDB('bootstrap@example.com', 'password', 1);
  });

  it('successfully selects a primer and calls setPrimer with correct data', () => {
    const setPrimerSpy = cy.spy().as('setPrimerSpy');
    const setErrorSpy = cy.spy().as('setErrorSpy');

    cy.mount(<GetPrimerComponent setPrimer={setPrimerSpy} setError={setErrorSpy} />);

    cy.get('input').type('ase1_fwd');
    cy.get('.MuiAutocomplete-listbox li', { timeout: 10000 }).should('have.length.greaterThan', 0);
    clickMultiSelectOption('Primer', 'ase1_fwd', 'div');

    cy.getStub('get_primers').then((primersStub) => {
      const selectedPrimer = primersStub.response.body.items.find((p) => p.name === 'ase1_fwd');
      cy.get('@setPrimerSpy').should('have.been.calledWithMatch', {
        name: selectedPrimer.name,
        sequence: selectedPrimer.sequence,
        database_id: selectedPrimer.id,
      });
    });
    cy.get('@setErrorSpy').should('have.been.calledWith', '');
  });

  it('clears primer and error when selection is cleared', () => {
    const setPrimerSpy = cy.spy().as('setPrimerSpy');
    const setErrorSpy = cy.spy().as('setErrorSpy');

    cy.mount(<GetPrimerComponent setPrimer={setPrimerSpy} setError={setErrorSpy} />);

    cy.get('input').type('ase1_fwd');
    cy.get('.MuiAutocomplete-listbox li', { timeout: 10000 }).should('have.length.greaterThan', 0);
    clickMultiSelectOption('Primer', 'ase1_fwd', 'div');
    cy.get('@setPrimerSpy').should('have.been.calledWithMatch', { name: 'ase1_fwd' });

    cy.get('.MuiAutocomplete-clearIndicator').click();

    cy.get('@setPrimerSpy').should('have.been.calledWith', null);
    cy.get('@setErrorSpy').should('have.been.calledWith', '');
  });
});
