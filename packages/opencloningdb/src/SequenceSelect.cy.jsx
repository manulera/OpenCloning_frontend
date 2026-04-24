import React from 'react';
import SequenceSelect from './SequenceSelect';
import { clickMultiSelectOption } from '../../../cypress/e2e/common_functions';

describe('<SequenceSelect />', () => {
  beforeEach(() => {
    cy.loginToOpenCloningDB('bootstrap@example.com', 'password', 1);
  });

  it('searches for "ase1" and shows results', () => {
    const onChangeSpy = cy.spy().as('onChangeSpy');
    cy.mount(
      <SequenceSelect label="Sequence" onChange={onChangeSpy} multiple={false} />
    );

    cy.get('input').click();
    cy.contains('Type at least').should('exist');
    cy.get('input').type('ase1');
    cy.get('.MuiAutocomplete-listbox li', { timeout: 10000 }).should('have.length.greaterThan', 0);
    clickMultiSelectOption('Sequence', 'ase1_CDS_PCR', 'div');

    cy.getStub('get_sequences').then((sequencesStub) => {
      const selectedSequence = sequencesStub.response.body.items.find((s) => s.name === 'ase1_CDS_PCR');
      cy.get('@onChangeSpy').should('have.been.calledWith', selectedSequence);
    });

    cy.get('input').should('have.value', 'ase1_CDS_PCR');
  });
});
