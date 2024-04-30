import { clickMultiSelectOption, manuallyTypeSequence } from './common_functions';

const allOptions = ['restriction', 'PCR', 'ligation', 'gibson_assembly', 'homologous_recombination', 'restriction_and_ligation', 'polymerase_extension', 'crispr'];
const multiInputOptions = ['ligation', 'gibson_assembly', 'homologous_recombination', 'restriction_and_ligation', 'crispr'];
function checkAllOptions(sourceId) {
  cy.get(`ul[aria-labelledby="select-source-${sourceId}-label"] li`).should('have.length', allOptions.length);
  allOptions.forEach((value) => {
    cy.get(`ul[aria-labelledby="select-source-${sourceId}-label"] li[data-value="${value}"]`).should('exist');
  });
}
function checkMultiInputOptions(sourceId) {
  cy.get(`ul[aria-labelledby="select-source-${sourceId}-label"] li`).should('have.length', multiInputOptions.length);
  multiInputOptions.forEach((value) => {
    cy.get(`ul[aria-labelledby="select-source-${sourceId}-label"] li[data-value="${value}"]`).should('exist');
  });
}

describe('Test Source input constrains', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('Empty source displays the right options', () => {
    cy.get('#tab-panel-0 .MuiInputBase-root').click();
    cy.get('ul[aria-labelledby="select-source-1-label"] li').should('have.length', 5);
    cy.get('ul[aria-labelledby="select-source-1-label"] li[data-value="repository_id"]').should('exist');
    cy.get('ul[aria-labelledby="select-source-1-label"] li[data-value="manually_typed"]').should('exist');
    cy.get('ul[aria-labelledby="select-source-1-label"] li[data-value="genome_region"]').should('exist');
    cy.get('ul[aria-labelledby="select-source-1-label"] li[data-value="file"]').should('exist');
    cy.get('ul[aria-labelledby="select-source-1-label"] li[data-value="oligonucleotide_hybridization"]').should('exist');
  });
  it('All experimental sources are available as children of a sequence', () => {
    manuallyTypeSequence('atata');
    cy.get('svg[data-testid="AddCircleIcon"]').first().click();
    cy.get('li#source-3 .MuiInputBase-root', { timeout: 20000 }).click();
    checkAllOptions(3);
  });
  it('Constrains based on inputs are applied correctly', () => {
    // Manually type one sequence
    manuallyTypeSequence('atata');
    // Manually type another one
    cy.get('svg[data-testid="AddCircleIcon"]', { timeout: 20000 }).last().click();
    manuallyTypeSequence('atata');
    // Wait for request to resolve
    cy.get('li#sequence-4', { timeout: 20000 }).should('exist');
    // Go into PCR
    cy.get('svg[data-testid="AddCircleIcon"]').first().click();
    cy.get('li#source-5 .MuiInputBase-root').click();
    checkAllOptions(5);
    cy.get('body').click(0, 0);
    // Change to multi-input
    multiInputOptions.forEach((value) => {
      if (value !== 'homologous_recombination' && value !== 'crispr') {
        cy.get('li#source-5 .MuiInputBase-root').eq(0).click();
        cy.get(`li[data-value="${value}"]`).click();
        cy.get('li#source-5 .MuiInputBase-root').eq(0).click();
        // Should have all options since there is only one input
        checkAllOptions(5);
        cy.get(`li[data-value="${value}"]`).click();
        // Add another input
        cy.get('li#source-5 .MuiInputBase-root').eq(1).click();
        // Two inputs listed
        cy.get('ul[role="listbox"] li').should('have.length', 2);
        // Select the second input and click outside to close select element
        cy.get('li[data-value="4"]').click();
        cy.get('body').click(0, 0);
        // Now there should only be 4 options
        cy.get('li#source-5 .MuiInputBase-root').eq(0).click();
        checkMultiInputOptions(5);
        cy.get('body').click(0, 0);
        // We unselect the second input
        cy.get('li#source-5 .MuiInputBase-root').eq(1).click();
        cy.get('li[data-value="4"]').click();
        cy.get('body').click(0, 0);
        // We are back to having 6 options
        cy.get('li#source-5 .MuiInputBase-root').eq(0).click();
        checkAllOptions(5);
        cy.get('body').click(0, 0);
        // We cannot unset the first input
        clickMultiSelectOption('Input sequences', '2', 'li#source-5');
        // Still there
        cy.get('li#source-5 li#sequence-2').should('exist');
      } else {
        cy.get('li#source-5 .MuiInputBase-root').eq(0).click();
        cy.get(`li[data-value="${value}"]`).click();
        cy.get('li#source-5 .MuiInputBase-root').eq(0).click();
        // Should have all options since there is only one input
        checkAllOptions(5);
        cy.get(`li[data-value="${value}"]`).click();
        cy.get('label').contains('Template sequence').siblings('div').children('[aria-labelledby="select-single-inputs"]')
          .first()
          .click();
        // Two inputs listed
        cy.get('ul[role="listbox"] li').should('have.length', 2);
        // Cannot unset (source still hanging from sequence)
        cy.get('li[data-value="2"]').click();
        cy.get('li#source-5').children('ul').children('li#sequence-2').should('exist');

        // Can switch template
        cy.get('label').contains('Template sequence').siblings('div').children('[aria-labelledby="select-single-inputs"]')
          .first()
          .click();
        cy.get('li[data-value="4"]').click();
        cy.get('li#source-5').children('ul').children('li#sequence-4').should('exist');

        // Can select insert
        cy.get('label').contains('Insert sequence').siblings('div').children('[aria-labelledby="select-single-inputs"]')
          .first()
          .click();
        cy.get('ul[role="listbox"] li').should('have.length', 2);
        cy.get('ul[role="listbox"] li').contains('None');
        cy.get('ul[role="listbox"] li').contains('2');
        cy.get('li[data-value="2"]').click();

        // Insert is set as input of the source
        cy.get('li#source-5').children('ul').children('li#sequence-2').should('exist');
        cy.get('li#source-5').children('ul').children('li#sequence-4').should('exist');

        // Can unset insert
        cy.get('label').contains('Insert sequence').siblings('div').children('[aria-labelledby="select-single-inputs"]')
          .first()
          .click();
        cy.get('ul[role="listbox"] li').should('have.length', 2);
        cy.get('ul[role="listbox"] li').contains('None');
        cy.get('ul[role="listbox"] li').contains('2');
        cy.get('li[data-value=""]').click();

        // Insert is unset
        cy.get('li#source-5').children('ul').children('li#sequence-2').should('not.exist');
        cy.get('li#source-5').children('ul').children('li#sequence-4').should('exist');

        // Switch back to template being 2
        cy.get('label').contains('Template sequence').siblings('div').children('[aria-labelledby="select-single-inputs"]')
          .first()
          .click();
        cy.get('li[data-value="2"]').click();
      }
    });
  });
});
