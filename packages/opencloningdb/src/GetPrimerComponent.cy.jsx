import React from 'react';
import GetPrimerComponent from './GetPrimerComponent';
import { clickMultiSelectOption } from '../../../cypress/e2e/common_functions';

const PRIMER_NAME = 'lacZ_attB1_fwd';

describe('<GetPrimerComponent />', () => {
  beforeEach(() => {
    cy.loginToOpenCloningDB('bootstrap@example.com', 'password', 1);
  });

  it('successfully selects a primer and calls setPrimer with correct data', () => {
    const setPrimerSpy = cy.spy().as('setPrimerSpy');
    const setErrorSpy = cy.spy().as('setErrorSpy');
    cy.intercept('GET', 'http://localhost:8001/primers*').as('getPrimers');
    cy.intercept('GET', 'http://localhost:8001/primer/*').as('getPrimer');

    cy.getStub('get_primers').then((primersStub) => {
      const stubPrimer = primersStub.response.body.items.find((primer) => primer.name === PRIMER_NAME);
      cy.wrap(stubPrimer).as('stubPrimer');
    });

    cy.mount(<GetPrimerComponent setPrimer={setPrimerSpy} setError={setErrorSpy} />);

    cy.get('input').type(PRIMER_NAME);
    cy.get('.MuiAutocomplete-listbox li', { timeout: 10000 }).should('have.length.greaterThan', 0);
    cy.get('@stubPrimer').then((stubPrimer) => {
      cy.wait('@getPrimers').then(({ response }) => {
        const liveSearchPrimer = response.body.items.find((primer) => primer.name === PRIMER_NAME);
        expect(liveSearchPrimer).to.include({
          name: stubPrimer.name,
          sequence: stubPrimer.sequence,
        });
      });
    });

    clickMultiSelectOption('Primer', PRIMER_NAME, 'div');

    cy.get('@stubPrimer').then((stubPrimer) => {
      cy.wait('@getPrimer').then(({ response }) => {
        const expectedPrimer = {
          name: stubPrimer.name,
          sequence: stubPrimer.sequence,
          'database_id': response.body.id,
        };
        cy.get('@setPrimerSpy').should('have.been.calledWithMatch', {
          ...expectedPrimer,
        });
      });
    });
    cy.get('@setErrorSpy').should('have.been.calledWith', '');
  });

  it('clears primer and error when selection is cleared', () => {
    const setPrimerSpy = cy.spy().as('setPrimerSpy');
    const setErrorSpy = cy.spy().as('setErrorSpy');

    cy.mount(<GetPrimerComponent setPrimer={setPrimerSpy} setError={setErrorSpy} />);

    cy.get('input').type(PRIMER_NAME);
    cy.get('.MuiAutocomplete-listbox li', { timeout: 10000 }).should('have.length.greaterThan', 0);
    clickMultiSelectOption('Primer', PRIMER_NAME, 'div');
    cy.get('@setPrimerSpy').should('have.been.calledWithMatch', { name: PRIMER_NAME });

    cy.get('.MuiAutocomplete-clearIndicator').click();

    cy.get('@setPrimerSpy').should('have.been.calledWith', null);
    cy.get('@setErrorSpy').should('have.been.calledWith', '');
  });
});
