import React from 'react';
import PrimerSelect from './PrimerSelect';
import { DatabaseProvider } from '@opencloning/ui/providers/DatabaseContext';
import OpenCloningDBInterface from './OpenCloningDBInterface';
import { clickMultiSelectOption } from '../../../cypress/e2e/common_functions';

const PRIMER_NAME = 'lacZ_attB1_fwd';

describe('<PrimerSelect />', () => {
  it('searches for a primer and shows results', () => {
    cy.loginToOpenCloningDB('bootstrap@example.com', 'password', 1);
    const primerSpy = cy.spy().as('primerSpy');
    cy.intercept('GET', 'http://localhost:8001/primers*').as('getPrimers');

    cy.getStub('get_primers').then((primersStub) => {
      const stubPrimer = primersStub.response.body.items.find((primer) => primer.name === PRIMER_NAME);
      cy.wrap(stubPrimer).as('stubPrimer');
    });

    cy.mount(
      <DatabaseProvider value={OpenCloningDBInterface}>
        <PrimerSelect setPrimer={primerSpy} />
      </DatabaseProvider>
    );
    // Clicking on the input
    cy.get('input').click();
    cy.contains('Type at least').should('exist');
    cy.get('input').type(PRIMER_NAME);
    cy.get('.MuiAutocomplete-listbox li', { timeout: 10000 }).should('have.length.greaterThan', 0);
    cy.get('@stubPrimer').then((stubPrimer) => {
      cy.wait('@getPrimers').then(({ response }) => {
        const livePrimer = response.body.items.find((primer) => primer.name === PRIMER_NAME);
        expect(livePrimer).to.include({
          name: stubPrimer.name,
          sequence: stubPrimer.sequence,
        });
        cy.wrap(livePrimer).as('livePrimer');
      });
    });

    clickMultiSelectOption('Primer', PRIMER_NAME, 'div');

    cy.get('@livePrimer').then((livePrimer) => {
      cy.get('@primerSpy').should('have.been.calledWith', livePrimer);
      cy.get('input').should('have.value', `${livePrimer.id} - ${PRIMER_NAME}`);
    });
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
