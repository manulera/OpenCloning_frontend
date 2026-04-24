import React from 'react';
import GetSequenceFileAndDatabaseIdComponent from './GetSequenceFileAndDatabaseIdComponent';
import { clickMultiSelectOption } from '../../../cypress/e2e/common_functions';

const SEQUENCE_NAME = 'ase1_CDS_PCR';

function expectCloningStrategyFile(file, sequenceId, expectedSequenceFile) {
  expect(file.name).to.equal('cloning_strategy.json');
  return cy.readFileAsText(file).then((content) => {
    const parsed = JSON.parse(content);
    expect(parsed.sources).to.have.length(1);
    expect(parsed.sources[0].database_id).to.equal(sequenceId);
    expect(parsed.sources[0].type).to.equal('DatabaseSource');
    expect(parsed.sequences).to.have.length(1);
    expect(parsed.sequences[0]).to.include({
      ...expectedSequenceFile,
      id: 1,
    });
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
    cy.intercept('GET', 'http://localhost:8001/sequences*').as('getSequences');
    cy.intercept('GET', 'http://localhost:8001/sequence/*/text_file_sequence').as('getSequenceFile');

    cy.getStub('get_sequences').then((sequencesStub) => {
      const stubSequence = sequencesStub.response.body.items.find((sequence) => sequence.name === SEQUENCE_NAME);
      cy.wrap(stubSequence).as('stubSequence');
    });

    cy.getStub('get_text_file_sequence').then((textFileSequenceStub) => {
      cy.wrap(textFileSequenceStub.response.body).as('stubSequenceFile');
    });

    cy.mount(
      <GetSequenceFileAndDatabaseIdComponent setFile={setFileSpy} setDatabaseId={setDatabaseIdSpy} />,
    );

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
        cy.wrap(liveSequence).as('liveSequence');
      });
    });

    clickMultiSelectOption('Sequence', SEQUENCE_NAME, 'div');

    cy.get('@liveSequence').then((liveSequence) => {
      cy.get('@stubSequenceFile').then((stubSequenceFile) => {
        cy.wait('@getSequenceFile').then(({ request, response }) => {
          expect(request.url).to.include(`/sequence/${liveSequence.id}/text_file_sequence`);
          expect(response.body).to.include({
            file_content: stubSequenceFile.file_content,
            overhang_crick_3prime: stubSequenceFile.overhang_crick_3prime,
            overhang_watson_3prime: stubSequenceFile.overhang_watson_3prime,
            sequence_file_format: stubSequenceFile.sequence_file_format,
            type: stubSequenceFile.type,
          });
          cy.get('@setDatabaseIdSpy').should('have.been.calledWith', liveSequence.id);
          cy.get('@setFileSpy').should('have.been.calledOnce');
          return cy.get('@setFileSpy').then((spy) => {
            const [file] = spy.lastCall.args;
            return expectCloningStrategyFile(file, liveSequence.id, stubSequenceFile);
          });
        });
      });
    });
  });

  it('shows a retry button when requesting the selected file fails and retries successfully', () => {
    const setFileSpy = cy.spy().as('setFileSpy');
    const setDatabaseIdSpy = cy.spy().as('setDatabaseIdSpy');

    cy.mount(
      <GetSequenceFileAndDatabaseIdComponent setFile={setFileSpy} setDatabaseId={setDatabaseIdSpy} />,
    );

    cy.get('input').type(SEQUENCE_NAME);
    cy.get('.MuiAutocomplete-listbox li', { timeout: 10000 }).should('have.length.greaterThan', 0);

    let callCount = 0;
    cy.intercept('GET', `**/text_file_sequence`, (req) => {
      callCount += 1;
      if (callCount === 1) {
        req.reply({ statusCode: 500 });
        return;
      }

      req.reply({
        statusCode: 200,
        body: {},
      })}).as('getSequenceFile');

    clickMultiSelectOption('Sequence', SEQUENCE_NAME, 'div');

    cy.wait('@getSequenceFile');
    cy.contains('Failed to load sequence file.').should('exist');
    cy.get('@setFileSpy').should('not.have.been.called');
    cy.get('@setDatabaseIdSpy').should('not.have.been.called');

    cy.contains('button', 'Retry').click();

    cy.wait('@getSequenceFile');
    cy.contains('Failed to load sequence file.').should('not.exist');
    cy.get('@setFileSpy').should('have.been.calledOnce');
    cy.get('@setDatabaseIdSpy').should('have.been.calledOnce');

  });
});

