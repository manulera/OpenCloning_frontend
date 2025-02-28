import { addSource, clickMultiSelectOption, loadExample, deleteSourceByContent } from '../common_functions';

describe('Tests Gateway cloning functionality', () => {
  beforeEach(() => {
    cy.visit('/');
  });
  it('works in the normal case', () => {
    loadExample('Gateway cloning');
    deleteSourceByContent('Gateway BP reaction');
    addSource('GatewaySource');
    clickMultiSelectOption('Assembly inputs', '4');

    // Submit icon not visible
    cy.get('.open-cloning button.submit-backend-api').should('not.exist');
    clickMultiSelectOption('Reaction type', 'BP');
    cy.get('.open-cloning button.submit-backend-api').click();
    // Only one possible output should have been created
    cy.get('.open-cloning li').contains('Gateway BP reaction', { timeout: 20000 }).should('exist');

    // Submit again with single-site recombination
    addSource('GatewaySource');
    clickMultiSelectOption('Assembly inputs', 'Select all');
    clickMultiSelectOption('Reaction type', 'LR');
    // Toggle Single-site recombination
    cy.get('span').contains('Single-site recombination').click({ force: true });
    cy.get('.open-cloning button.submit-backend-api').click();
    // Multiple options should be shown with 4 options
    cy.get('.multiple-output-selector-navigate', { timeout: 20000 }).contains('4').should('exist');

    // Toggle again and resubmit to get 2
    cy.get('span').contains('Single-site recombination').click({ force: true });
    cy.get('.open-cloning button.submit-backend-api').click();
    cy.get('.multiple-output-selector-navigate', { timeout: 20000 }).contains('2').should('exist');
    cy.get('button').contains('Choose product').click();
    cy.get('.open-cloning li').contains('Gateway LR reaction', { timeout: 20000 }).should('exist');

    // Try the wrong reaction type
    deleteSourceByContent('Gateway LR reaction');
    addSource('GatewaySource');
    clickMultiSelectOption('Assembly inputs', 'Select all');
    clickMultiSelectOption('Reaction type', 'BP');
    cy.get('.open-cloning button.submit-backend-api').click();
    // There should be an error
    cy.get('.MuiAlert-message').contains('Inputs are not compatible for BP').should('exist');

    // Test that circular only works with select all
    deleteSourceByContent('Gateway BP reaction');
    addSource('GatewaySource');
    clickMultiSelectOption('Assembly inputs', '4');
    clickMultiSelectOption('Reaction type', 'BP');
    cy.get('span').contains('Single-site recombination').click({ force: true });
    cy.get('span').contains('Circular assemblies').click({ force: true });
    cy.get('.open-cloning button.submit-backend-api').click();
    cy.get('.multiple-output-selector-navigate', { timeout: 20000 }).contains('3').should('exist');
  });
});
