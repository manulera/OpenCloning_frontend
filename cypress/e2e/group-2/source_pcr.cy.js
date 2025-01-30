import { getReverseComplementSequenceString } from '@teselagen/sequence-utils';
import { addPrimer, addSource, manuallyTypeSequence, clickMultiSelectOption, setInputValue, addLane, skipGoogleSheetErrors, skipNcbiCheck, deleteSourceById, deleteSourceByContent } from './common_functions';

describe('Tests PCR functionality', () => {
  beforeEach(() => {
    cy.visit('/');
    // Intercepts must be in this order
    skipGoogleSheetErrors();
    skipNcbiCheck();
  });
  it('works in the normal case', () => {
    addPrimer('fwd_test', 'ACGTACGT');
    addPrimer('rvs_test', 'GCGCGCGC');
    manuallyTypeSequence('TTTTACGTACGTAAAAAAGCGCGCGCTTTTT');
    addSource('PCRSource');

    clickMultiSelectOption('Forward primer', 'fwd_test', 'li#source-3');
    clickMultiSelectOption('Reverse primer', 'rvs_test', 'li#source-3');

    // Change minimal annealing
    setInputValue('Minimal annealing', '8', 'li#source-3');
    cy.get('button').contains('Perform PCR').click();
    // The result is shown
    cy.get('li#sequence-4 li#source-3', { timeout: 20000 }).should('exist');
    cy.get('li#sequence-4').contains('22 bps');
  });
  it('can use the same primer twice', () => {
    addPrimer('fwd_test', 'ACGTACGT');
    addPrimer('rvs_test', 'GCGCGCGC');
    manuallyTypeSequence('TTTTACGTACGTAAAAAAACGTACGTTTTTT');
    addSource('PCRSource');
    clickMultiSelectOption('Forward primer', 'fwd_test', 'li#source-3');
    clickMultiSelectOption('Reverse primer', 'fwd_test', 'li#source-3');
    // Change minimal annealing
    setInputValue('Minimal annealing', '8', 'li#source-3');
    cy.get('button').contains('Perform PCR').click();
    // The result is shown
    cy.get('li#sequence-4 li#source-3', { timeout: 20000 }).should('exist');
    cy.get('li#sequence-4').contains('22 bps');
  });
  it('gives the right error for minimal annealing', () => {
    addPrimer('fwd_test', 'ACGTACGT');
    addPrimer('rvs_test', 'GCGCGCGC');
    manuallyTypeSequence('TTTTACGTACGTAAAAAAGCGCGCGCTTTTT');
    addSource('PCRSource');

    clickMultiSelectOption('Forward primer', 'fwd_test', 'li#source-3');
    clickMultiSelectOption('Reverse primer', 'rvs_test', 'li#source-3');
    cy.get('button').contains('Perform PCR').click();
    cy.get('.submit-backend-api .loading-progress').should('not.exist', { timeout: 20000 });
    cy.get('.MuiAlert-message').contains('No pair of annealing primers was found.');
  });
  it('gives the right error for no annealing', () => {
    addPrimer('fwd_test', 'CCCCCCCC');
    addPrimer('rvs_test', 'CCCCCCCC');
    manuallyTypeSequence('TTTTACGTACGTAAAAAAGCGCGCGCTTTTT');
    addSource('PCRSource');

    clickMultiSelectOption('Forward primer', 'fwd_test', 'li#source-3');
    clickMultiSelectOption('Reverse primer', 'rvs_test', 'li#source-3');
    cy.get('button').contains('Perform PCR').click();
    cy.get('.submit-backend-api .loading-progress').should('not.exist', { timeout: 20000 });
    cy.get('.MuiAlert-message').contains('No pair of annealing primers was found.');
  });
  it('shows the submission button only after the primers are selected', () => {
    addPrimer('fwd_test', 'ACGTACGT');
    addPrimer('rvs_test', 'GCGCGCGC');
    manuallyTypeSequence('TTTTACGTACGTAAAAAAGCGCGCGCTTTTT');
    addSource('PCRSource');
    // Submission not available until primers are both selected
    cy.get('button').contains('Perform PCR').should('not.exist');
    clickMultiSelectOption('Forward primer', 'fwd_test', 'li#source-3');
    cy.get('button').contains('Perform PCR').should('not.exist');
    clickMultiSelectOption('Reverse primer', 'rvs_test', 'li#source-3');
    cy.get('button').contains('Perform PCR').should('exist');
  });

  it('works with mismatches', () => {
    addPrimer('fwd_test', 'ACGAACGT');
    addPrimer('rvs_test', 'GCGAGCGC');
    manuallyTypeSequence('TTTTACGTACGTAAAAAAGCGCGCGCTTTTT');
    addSource('PCRSource');

    clickMultiSelectOption('Forward primer', 'fwd_test', 'li#source-3');
    clickMultiSelectOption('Reverse primer', 'rvs_test', 'li#source-3');

    // Change minimal annealing
    setInputValue('Minimal annealing', '8', 'li#source-3');
    cy.get('button').contains('Perform PCR').click();
    cy.get('.submit-backend-api .loading-progress').should('not.exist', { timeout: 20000 });

    // Error, because mismatches are not set
    cy.get('.MuiAlert-message');

    // Set the mismatches
    setInputValue('Mismatches allowed', '1', 'li#source-3');
    cy.get('button').contains('Perform PCR').click();
    // The result is shown
    cy.get('li#sequence-4 li#source-3', { timeout: 20000 }).should('exist');
    cy.get('li#sequence-4').contains('22 bps');
  });
  it('works when there are two possible PCR products', () => {
    addPrimer('fwd_test', 'ACGTACGT');
    addPrimer('rvs_test', 'GCGCGCGC');
    manuallyTypeSequence('ACGTACGTTTTTACGTACGTAAAAAAGCGCGCGCTTTTT');

    addSource('PCRSource');
    clickMultiSelectOption('Forward primer', 'fwd_test', 'li#source-3');
    clickMultiSelectOption('Reverse primer', 'rvs_test', 'li#source-3');

    setInputValue('Minimal annealing', '8', 'li#source-3');
    cy.get('button').contains('Perform PCR').click();
    cy.get('.multiple-output-selector').should('exist');

    deleteSourceById(1);
    addLane();
    manuallyTypeSequence(getReverseComplementSequenceString('ACGTACGTTTTTACGTACGTAAAAAAGCGCGCGCTTTTT'));

    addSource('PCRSource');
    clickMultiSelectOption('Forward primer', 'fwd_test', 'li#source-3');
    clickMultiSelectOption('Reverse primer', 'rvs_test', 'li#source-3');

    setInputValue('Minimal annealing', '8', 'li#source-3');
    cy.get('button').contains('Perform PCR').click();
    cy.get('.multiple-output-selector').should('exist');
  });
  it('works when adding primer features', () => {
    addPrimer('fwd_test', 'ACGTACGT');
    addPrimer('rvs_test', 'GCGCGCGC');
    manuallyTypeSequence('TTTTACGTACGTAAAAAAGCGCGCGCTTTTT');
    addSource('PCRSource');
    clickMultiSelectOption('Forward primer', 'fwd_test', 'li#source-3');
    clickMultiSelectOption('Reverse primer', 'rvs_test', 'li#source-3');
    setInputValue('Minimal annealing', '8', 'li#source-3');
    cy.get('span').contains('Add primer features').click({ force: true });
    cy.get('button').contains('Perform PCR').click();

    // Check that the features are present in the by downloading the json
    cy.get('li#sequence-4 svg[data-testid="DownloadIcon"]', { timeOut: 20000 }).first().click();
    setInputValue('File name', 'source_pcr', '.MuiDialogContent-root');
    cy.get('.MuiDialogContent-root span').contains('json').click();
    cy.get('.MuiDialogActions-root button').contains('Save file').click();
    cy.task('readFileMaybe', 'cypress/downloads/source_pcr.json').then((fileContent) => {
      expect(fileContent).to.include('/label=\\"fwd_test\\"');
      expect(fileContent).to.include('/label=\\"rvs_test\\"');
    });

    // Delete the source and do the same without ticking
    deleteSourceByContent('PCR');
    addSource('PCRSource');
    clickMultiSelectOption('Forward primer', 'fwd_test', 'li#source-3');
    clickMultiSelectOption('Reverse primer', 'rvs_test', 'li#source-3');
    setInputValue('Minimal annealing', '8', 'li#source-3');
    cy.get('button').contains('Perform PCR').click();

    // Check that the features are NOT present in the by downloading the json
    cy.get('li#sequence-4 svg[data-testid="DownloadIcon"]', { timeOut: 20000 }).first().click();
    setInputValue('File name', 'source_pcr2', '.MuiDialogContent-root');
    cy.get('.MuiDialogContent-root span').contains('json').click();
    cy.get('.MuiDialogActions-root button').contains('Save file').click();
    cy.task('readFileMaybe', 'cypress/downloads/source_pcr2.json').then((fileContent) => {
      expect(fileContent).to.not.include('/label=\\"fwd_test\\"');
      expect(fileContent).to.not.include('/label=\\"rvs_test\\"');
    });
  });
});
