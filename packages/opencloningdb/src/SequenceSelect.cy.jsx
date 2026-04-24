import React from 'react';
import SequenceSelect from './SequenceSelect';
import { clickMultiSelectOption } from '../../../cypress/e2e/common_functions';

const SEQUENCE_NAME = 'ase1_CDS_PCR';

describe('<SequenceSelect />', () => {
  beforeEach(() => {
    cy.loginToOpenCloningDB('bootstrap@example.com', 'password', 1);
  });

  it('searches for a sequence and shows results', () => {
    const onChangeSpy = cy.spy().as('onChangeSpy');
    cy.intercept('GET', 'http://localhost:8001/sequences*').as('getSequences');

    cy.getStub('get_sequences').then((sequencesStub) => {
      const stubSequence = sequencesStub.response.body.items.find((sequence) => sequence.name === SEQUENCE_NAME);
      cy.wrap(stubSequence).as('stubSequence');
    });

    cy.mount(
      <SequenceSelect label="Sequence" onChange={onChangeSpy} multiple={false} />
    );

    cy.get('input').click();
    cy.contains('Type at least').should('exist');
    cy.get('input').type(SEQUENCE_NAME);
    cy.get('.MuiAutocomplete-listbox li', { timeout: 10000 }).should('have.length.greaterThan', 0);
    cy.get('@stubSequence').then((stubSequence) => {
      cy.wait('@getSequences').then(({ response }) => {
        const liveSequence = response.body.items.find((sequence) => sequence.name === SEQUENCE_NAME);
        expect(liveSequence).to.include({
          name: stubSequence.name,
          seguid: stubSequence.seguid,
          sequence_type: stubSequence.sequence_type,
        });
        expect(liveSequence.sample_uids).to.deep.equal(stubSequence.sample_uids);
        expect(liveSequence.tags).to.deep.equal(stubSequence.tags);
        cy.wrap(liveSequence).as('liveSequence');
      });
    });

    clickMultiSelectOption('Sequence', SEQUENCE_NAME, 'div');

    cy.get('@liveSequence').then((liveSequence) => {
      cy.get('@onChangeSpy').should('have.been.calledWith', liveSequence);
    });

    cy.get('input').should('have.value', SEQUENCE_NAME);
  });
});
