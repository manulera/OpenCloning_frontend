import { skipGoogleSheetErrors, skipNcbiCheck } from './common_functions';

describe('Test download history file', () => {
  beforeEach(() => {
    cy.visit('/');
    // Intercepts must be in this order
    skipGoogleSheetErrors();
    skipNcbiCheck();
  });
  it('Can download the json and svg files', () => {
    cy.get('.MuiToolbar-root .MuiButtonBase-root').contains('Examples').click();
    cy.get('li span').contains('Integration of cassette by homologous recombination').click();
    cy.get('.MuiToolbar-root .MuiButtonBase-root').contains('File').click();
    cy.get('[role="menuitem"]').contains('Save cloning history to file').click();
    cy.task('readFileMaybe', 'cypress/downloads/history.json').then((fileContent) => {
      expect(fileContent).to.include('"sequences":');
      expect(fileContent).to.include('"sources":');
      expect(fileContent).to.include('"primers":');
      expect(fileContent).to.include('"description":');
    });
    // Print cloning history to svg (works from another tab)
    cy.get('button.MuiTab-root').contains('Primers').click();
    cy.get('.MuiToolbar-root .MuiButtonBase-root').contains('File').click();
    cy.get('[role="menuitem"]').contains('Print cloning history').click();
    cy.task('readFileMaybe', 'cypress/downloads/history.svg').then((fileContent) => {
      expect(fileContent).to.include('PCR with primers fwd and rvs');
    });
  });
});
