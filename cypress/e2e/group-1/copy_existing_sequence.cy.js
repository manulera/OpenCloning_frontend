import { addLane, addSource, clickMultiSelectOption, deleteSourceByContent, manuallyTypeSequence } from '../common_functions';

describe('Test copy existing sequence functionality', () => {
  beforeEach(() => {
    cy.visit('/');
  });
  it('Copies the correct sequence', () => {
    manuallyTypeSequence('ACGT');
    addLane();
    addSource('CopyEntity', true);
    clickMultiSelectOption('Sequence to copy', '2', 'li#source-3');
    cy.get('button').contains('Copy sequence').click();
    cy.get('li#source-1').should('exist');
    cy.get('li#source-3').should('exist');

    // Deleting one does not delete the other
    deleteSourceByContent('typed');
    cy.get('li#source-3').should('exist');
    cy.get('li#sequence-4').should('exist');
    cy.get('li#source-1').should('not.exist');
    cy.get('li#sequence-2').should('not.exist');
  });
  it('Copies linked files', () => {
    cy.get('.MuiToolbar-root .MuiButtonBase-root').contains('File').siblings('input').selectFile('public/examples/cloning_strategy_with_sequencing.zip', { force: true });
    cy.get('div.cloning-tab-pannel').contains('final_product.gb');
    addLane();
    addSource('CopyEntity', true);
    clickMultiSelectOption('Sequence to copy', '2', 'li#source-3');
    cy.get('button').contains('Copy sequence').click();
    cy.get('li#sequence-2').should('exist');
    cy.get('li#sequence-4').should('exist').then(() => {
      cy.window().its('sessionStorage')
        .invoke('getItem', 'verification-4-BZO904_13409044_13409044.ab1')
        .should('not.be.null');
      cy.window().its('sessionStorage').its('length').should('eq', 6);
    });
    cy.get('li#sequence-4 [data-testid="RuleIcon"]').click();
    cy.get('table').contains('BZO904_13409044_13409044.ab1');
    cy.get('table').contains('BZO903_13409037_13409037.ab1');
    cy.get('table').contains('BZO902_13409020_13409020.ab1');
  });
});
