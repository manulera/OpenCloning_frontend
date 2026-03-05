import { addLane, addSource, clickMultiSelectOption, setInputValue, manuallyTypeSequence } from '../common_functions';

describe('Recombinase', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('adds recombinase and submits with compatible sequences', () => {
    // From Python test: site1=AAaaTTC, site2=CCaaGC; sequences contain these sites
    manuallyTypeSequence('gggAAaaTTCaaattt');
    addLane();
    manuallyTypeSequence('cccCCaaGCtttaaa', true);
    addSource('RecombinaseSource');

    setInputValue('Site 1', 'AAaaTTC', 'div.assembly');
    setInputValue('Site 2', 'CCaaGC', 'div.assembly');
    cy.get('div.assembly button').contains('Add recombinase').click();
    clickMultiSelectOption('Assembly inputs', 'Select all', 'li');
    cy.get('div.assembly button').contains('Submit').click();
    cy.get('li#sequence-3 li#source-3', { timeout: 20000 }).should('exist');
  });

  it('gives the right error when sequences are not compatible', () => {
    manuallyTypeSequence('aagaattcaaaagaattcaa');
    addLane();
    manuallyTypeSequence('tagatatca');
    addSource('RecombinaseSource');

    setInputValue('Site 1', 'AAaaTTC', 'div.assembly');
    setInputValue('Site 2', 'CCaaGC', 'div.assembly');
    cy.get('div.assembly button').contains('Add recombinase').click();
    clickMultiSelectOption('Assembly inputs', 'Select all', 'li');
    cy.get('div.assembly button').contains('Submit').click();
    cy.get('li .MuiAlert-message', { timeout: 20000 }).should('contain', 'No compatible reaction');
  });
});
