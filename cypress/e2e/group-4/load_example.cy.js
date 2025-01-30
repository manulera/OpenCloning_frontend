import { skipGoogleSheetErrors, skipNcbiCheck } from './common_functions';

describe('Test load example functionality', () => {
  beforeEach(() => {
    cy.visit('/');
    // Intercepts must be in this order
    skipGoogleSheetErrors();
    skipNcbiCheck();
  });
  it('Can load examples', () => {
    cy.get('.MuiToolbar-root button.MuiButtonBase-root').contains('Examples').click();

    cy.get('.load-example-dialog .load-example-item').each((el, index) => {
      cy.get('.load-example-dialog .load-example-item').eq(index).click();
      cy.get('div.finished-source').should('exist');
      // No error should be displayed
      cy.get('header .MuiAlert-message').should('not.exist');
      // None of those divs should be empty
      cy.get('div.finished-source').each((el) => {
        cy.get(el).should('not.be.empty');
      });
      cy.get('.MuiToolbar-root button.MuiButtonBase-root').contains('Examples').click();
    });
    // Verify one in particular
    cy.get('.load-example-dialog .load-example-item').contains('Integration of cassette by homologous recombination').click();
    // Loads cloning
    cy.get('div.cloning-tab-pannel').contains('Request to addgene with ID 19342', { timeout: 10000 });
    cy.get('div.cloning-tab-pannel').contains('4368 bps');
    cy.get('div.cloning-tab-pannel').should('be.visible');
    cy.get('div.description-tab-pannel').should('not.be.visible');
    // Loads primers
    cy.get('div.primer-tab-pannel').contains('AGTTTTCATATCTTCCTTTATATTCTATTAATTGAATTTCAAACATCGTTTTATTGAGCTCATTTACATCAACCGGTTCACGGATCCCCGGGTTAATTAA');
    cy.get('div.primer-tab-pannel').contains('CTTTTATGAATTATCTATATGCTGTATTCATATGCAAAAATATGTATATTTAAATTTGATCGATTAGGTAAATAAGAAGCGAATTCGAGCTCGTTTAAAC');
    // Loads description
    cy.get('div.description-tab-pannel').contains('Deletion of the ORF');
    // It's set to not-edit mode
    cy.get('div.description-tab-pannel button').contains('Edit description').should('exist');
    // The data model is loaded and displayed
    cy.get('div.data-model-tab-pannel code').contains('"input": [],');
  });
});
