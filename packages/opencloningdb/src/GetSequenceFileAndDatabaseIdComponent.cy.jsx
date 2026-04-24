import React from 'react';
import GetSequenceFileAndDatabaseIdComponent from './GetSequenceFileAndDatabaseIdComponent';
import { clickMultiSelectOption } from '../../../cypress/e2e/common_functions';

function expectCloningStrategyFile(file, sequenceId) {
  expect(file.name).to.equal('cloning_strategy.json');
  return cy.readFileAsText(file).then((content) => {
    const parsed = JSON.parse(content);
    expect(parsed.sources).to.have.length(1);
    expect(parsed.sources[0].database_id).to.equal(sequenceId);
    expect(parsed.sources[0].type).to.equal('DatabaseSource');
    expect(parsed.sequences).to.have.length(1);
    expect(parsed.sequences[0].id).to.equal(1);
    expect(parsed.primers).to.eql([]);
  });
}

describe('<GetSequenceFileAndDatabaseIdComponent />', () => {
  beforeEach(() => {
    cy.loginToOpenCloningDB('bootstrap@example.com', 'password', 1);
  });

  it('selects a sequence and calls setFile and setDatabaseId with correct data', () => {
    const setFileSpy = cy.spy().as('setFileSpy');
    const setDatabaseIdSpy = cy.spy().as('setDatabaseIdSpy');

    cy.mount(
      <GetSequenceFileAndDatabaseIdComponent setFile={setFileSpy} setDatabaseId={setDatabaseIdSpy} />,
    );

    cy.get('input').type('ase1_CDS_PCR');
    cy.get('.MuiAutocomplete-listbox li', { timeout: 10000 }).should('have.length.greaterThan', 0);
    clickMultiSelectOption('Sequence', 'ase1_CDS_PCR', 'div');

    cy.getStub('get_sequences').then((sequencesStub) => {
      const sequence = sequencesStub.response.body.items.find((s) => s.name === 'ase1_CDS_PCR');
      cy.get('@setDatabaseIdSpy').should('have.been.calledWith', sequence.id);
      cy.get('@setFileSpy').should('have.been.calledOnce');
      return cy.get('@setFileSpy').then((spy) => {
        const [file] = spy.lastCall.args;
        return expectCloningStrategyFile(file, sequence.id);
      });
    });
  });

  it('shows a retry button when requesting the selected file fails and retries successfully', () => {
    const setFileSpy = cy.spy().as('setFileSpy');
    const setDatabaseIdSpy = cy.spy().as('setDatabaseIdSpy');
    cy.stub(console, 'error').as('consoleError');

    cy.mount(
      <GetSequenceFileAndDatabaseIdComponent setFile={setFileSpy} setDatabaseId={setDatabaseIdSpy} />,
    );

    cy.getStub('get_sequences').then((sequencesStub) => {
      const sequence = sequencesStub.response.body.items.find((s) => s.name === 'ase1_CDS_PCR');
      cy.getStub('get_text_file_sequence').then((textFileSequenceStub) => {
        let callCount = 0;

        cy.intercept('GET', `**/sequence/${sequence.id}/text_file_sequence`, (req) => {
          callCount += 1;
          if (callCount === 1) {
            req.reply({ statusCode: 500 });
            return;
          }

          req.reply({ statusCode: 200, body: textFileSequenceStub.response.body });
        }).as('getSequenceFile');

        cy.get('input').type(sequence.name);
        cy.get('.MuiAutocomplete-listbox li', { timeout: 10000 }).should('have.length.greaterThan', 0);
        clickMultiSelectOption('Sequence', sequence.name, 'div');

        cy.wait('@getSequenceFile');
        cy.contains('Failed to load sequence file.').should('exist');
        cy.get('@setFileSpy').should('not.have.been.called');
        cy.get('@setDatabaseIdSpy').should('not.have.been.called');
        cy.get('@consoleError').should('have.been.calledWithMatch', 'Error fetching cloning strategy:');

        cy.contains('button', 'Retry').click();

        cy.wait('@getSequenceFile');
        cy.contains('Failed to load sequence file.').should('not.exist');
        cy.get('@setDatabaseIdSpy').should('have.been.calledWith', sequence.id);
        cy.get('@setFileSpy').should('have.been.calledOnce');
        cy.get('@setFileSpy').then((spy) => {
          const [file] = spy.lastCall.args;
          return expectCloningStrategyFile(file, sequence.id);
        });
      });
    });
  });
});
