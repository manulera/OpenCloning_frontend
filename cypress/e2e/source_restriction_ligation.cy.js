import { addSource, manuallyTypeSequence, clickMultiSelectOption, clickSequenceOutputArrow } from './common_functions';

describe('Tests restriction-ligation functionality', () => {
  beforeEach(() => {
    cy.visit('/');
  });
  it('works in the normal case', () => {
    manuallyTypeSequence('aaaaGAATTCaa');
    cy.get('svg[data-testid="AddCircleIcon"]', { timeout: 20000 }).last().click();
    manuallyTypeSequence('ccGAATTCcc');
    addSource('restriction_and_ligation');
    clickMultiSelectOption('Input sequences', '4', 'li#source-5');
    clickMultiSelectOption('Enzymes used', 'EcoRI', 'li#source-5');
    cy.get('li#source-5 button').contains('Submit').click();
    // Shows multiple options
    cy.get('li#source-5 .multiple-output-selector').should('exist');

    // Click to get result
    cy.get('li#source-5 button').contains('Choose fragment').click();

    // Check that the result is correct
    cy.get('li#source-5').contains('Restriction with EcoRI, then ligation');
    cy.get('li#sequence-6 li#source-5');
    cy.get('li#sequence-6').contains('12 bps');
  });
  it('works with single input', () => {
    manuallyTypeSequence('aaaaGAATTCttGAATTCccccc');
    addSource('restriction_and_ligation');
    clickMultiSelectOption('Enzymes used', 'EcoRI', 'li#source-3');
    cy.get('li#source-3 button').contains('Submit').click();

    cy.get('li#source-3 .multiple-output-selector', { timeOut: 2000 }).should('exist');

    // Shows multiple options, one round the other linear
    cy.get('li#source-3 .multiple-output-selector .veCircularView').contains('8 bps');
    clickSequenceOutputArrow('li#source-3');
    cy.get('li#source-3 .multiple-output-selector .veLinearView').contains('15 bps');

    // Click to get result
    cy.get('li#source-3 button').contains('Choose fragment').click();

    // // Check that the result is correct
    cy.get('li#source-3').contains('Restriction with EcoRI, then ligation');
    cy.get('li#sequence-4 li#source-3');
    cy.get('li#sequence-4').contains('15 bps');
  });
  it('circular constrain works', () => {
    manuallyTypeSequence('aaaaGAATTCttGAATTCccccc');
    addSource('restriction_and_ligation');
    clickMultiSelectOption('Enzymes used', 'EcoRI', 'li#source-3');

    cy.get('#tab-panel-0 span').contains('Circular assemblies').click();
    cy.get('li#source-3 button').contains('Submit').click();

    // // Check that the result is correct
    cy.get('li#source-3').contains('Restriction with EcoRI, then ligation');
    cy.get('li#sequence-4 li#source-3');
    cy.get('li#sequence-4 .veCircularView').contains('8 bps');
  });
  it('displays an error when ligations cannot be made', () => {
    manuallyTypeSequence('aaaaGAATTCttt');
    cy.get('svg[data-testid="AddCircleIcon"]', { timeout: 20000 }).last().click();
    manuallyTypeSequence('aaaaGTCGACttt');
    addSource('restriction_and_ligation');

    clickMultiSelectOption('Enzymes used', 'EcoRI', 'li#source-5');
    clickMultiSelectOption('Enzymes used', 'SalI', 'li#source-5');
    clickMultiSelectOption('Input sequences', '4', 'li#source-5');

    cy.get('li#source-5 button').contains('Submit').click();
    cy.get('li#source-5 .MuiAlert-message').contains('No compatible restriction-ligation was found.');
  });
  it('displays errors when server fails', () => {
    manuallyTypeSequence('aagaattcaaaagaattcaa');
    addSource('restriction_and_ligation');
    clickMultiSelectOption('Enzymes used', 'EcoRI', 'li#source-3');
    cy.intercept('POST', 'http://127.0.0.1:8000/restriction_and_ligation*', { forceNetworkError: true }).as('ligation');
    cy.get('li#source-3 button').contains('Submit').click();
    cy.get('li#source-3 .MuiAlert-message').contains('Cannot connect');
    // Internal server error
    cy.intercept('POST', 'http://127.0.0.1:8000/restriction_and_ligation*', { statusCode: 500 }).as('ligation2');
    cy.get('li#source-3 button').contains('Submit').click();
    cy.get('li#source-3 .MuiAlert-message').contains('Internal server error');
  });
});
