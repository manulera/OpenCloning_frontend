import { setInputValue, skipGoogleSheetErrors, skipNcbiCheck } from './common_functions';

describe('Test download sequence file', () => {
  beforeEach(() => {
    cy.visit('/');
    // Intercepts must be in this order
    skipGoogleSheetErrors();
    skipNcbiCheck();
  });
  it('Can download the file', () => {
    cy.get('.MuiToolbar-root .MuiButtonBase-root').contains('Examples').click();
    cy.get('li span').contains('Integration of cassette by homologous recombination').click();
    cy.get('li#sequence-2 svg[data-testid="DownloadIcon"]', { timeOut: 20000 }).click();
    setInputValue('File name', 'example', '.MuiDialogContent-root');
    // Download file as gb
    cy.get('.MuiDialogActions-root button').contains('Save file').click();
    cy.task('readFileMaybe', 'cypress/downloads/example.gb').then((fileContent) => {
      expect(fileContent).to.include('LOCUS       pFA6a-5FLAG-hphMX6      4531 bp');
    });
    // Download file as fasta
    cy.get('li#sequence-2 svg[data-testid="DownloadIcon"]').click();
    setInputValue('File name', 'example', '.MuiDialogContent-root');
    cy.get('.MuiDialogContent-root span').contains('fasta').click();
    cy.get('.MuiDialogActions-root button').contains('Save file').click();
    cy.task('readFileMaybe', 'cypress/downloads/example.fasta').then((fileContent) => {
      expect(fileContent).to.include('>pFA6a-5FLAG-hphMX6');
    });
    // Donwload history as json
    cy.get('li#sequence-4 svg[data-testid="DownloadIcon"]').first().click();
    setInputValue('File name', 'example', '.MuiDialogContent-root');
    cy.get('.MuiDialogContent-root span').contains('json').click();
    cy.get('.MuiDialogActions-root button').contains('Save file').click();
    cy.task('readFileMaybe', 'cypress/downloads/example.json').then((fileContent) => {
      expect(fileContent).to.include('"sequences":');
      expect(fileContent).to.include('"sources":');
      expect(fileContent).to.include('"primers":');
      expect(fileContent).to.include('"description":');
      // Sources
      expect(fileContent).to.include('"type": "AddGeneIdSource"');
      expect(fileContent).to.include('"type": "PCRSource"');
      expect(fileContent).to.not.include('"type": "GenomeCoordinatesSource"');
      expect(fileContent).to.not.include('"type": "HomologousRecombinationSource"');
      // Sequences
      expect(fileContent).to.include('pFA6a-5FLAG-hphMX6');
      expect(fileContent).to.include('pcr_product');
      expect(fileContent).to.not.include('modified_locus');
      expect(fileContent).to.not.include('CU329670');
      // Primers
      expect(fileContent).to.include('"name": "fwd"');
      expect(fileContent).to.include('"name": "rvs"');
    });
  });
});
