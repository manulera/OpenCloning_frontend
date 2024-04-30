import { addSource, manuallyTypeSequence, clickMultiSelectOption, loadHistory, deleteSource, clickSequenceOutputArrow, setInputValue, addPrimer } from './common_functions';

const homology1 = 'ATGCAAACAGTAATGATGGATGACATTCAAAGCACTGATT';
const homology2 = 'GTTTGCATCATTACTACCTACTGTAAGTTTCGTGACTAAA';
const guideRNASeq = 'CATTCAAAGCACTGATTaat';

describe('Tests homologous recombination and CRISPR functionality', () => {
  beforeEach(() => {
    cy.visit('/');
  });
  it('works in the normal case', () => {
    manuallyTypeSequence(`aaaaaa${homology1}aattggaa${homology2}tttttttt`);
    cy.get('svg[data-testid="AddCircleIcon"]', { timeout: 20000 }).last().click();
    manuallyTypeSequence(`${homology1}acaa${homology2}`);
    // Add gRNA
    cy.get('button.MuiTab-root').contains('Primers').click();
    addPrimer(guideRNASeq, 'gRNA-1');
    cy.get('button.MuiTab-root').contains('Cloning').click();

    ['crispr', 'homologous_recombination'].forEach((sourceType) => {
      addSource(sourceType);
      clickMultiSelectOption('Insert sequence', '4', 'li#source-5');
      if (sourceType === 'crispr') {
        clickMultiSelectOption('Select gRNAs', 'gRNA-1', 'li#source-5');
      }
      cy.get('li#source-5 button.submit-backend-api').click();
      cy.get('li#sequence-6 li#source-5').should('exist');
      cy.get('li#sequence-6').contains('98 bps');
      deleteSource(5);
    });
  });
  it('works with multiple options', () => {
    manuallyTypeSequence(`aaaaaa${homology1}aattggaa${homology1}tttttttt`);
    cy.get('svg[data-testid="AddCircleIcon"]', { timeout: 20000 }).last().click();
    manuallyTypeSequence(`${homology1}acaa${homology1}`);
    // Add gRNA
    cy.get('button.MuiTab-root').contains('Primers').click();
    addPrimer(guideRNASeq, 'gRNA-1');
    cy.get('button.MuiTab-root').contains('Cloning').click();

    ['crispr', 'homologous_recombination'].forEach((sourceType) => {
      addSource(sourceType);
      clickMultiSelectOption('Insert sequence', '4', 'li#source-5');
      if (sourceType === 'crispr') {
        clickMultiSelectOption('Select gRNAs', 'gRNA-1', 'li#source-5');
      }
      cy.get('li#source-5 button.submit-backend-api').click();
      cy.get('li#source-5 .multiple-output-selector', { timeOut: 2000 }).should('exist');
      cy.get('li#source-5 button').contains('Choose fragment').click();
      cy.get('li#sequence-6 li#source-5').should('exist');
      deleteSource(5);
    });

    // Shows multiple options
  });
  it('allows resubmission changing options, and gives error if not enough homology', () => {
    manuallyTypeSequence(`aaaaaa${homology1}aattggaa${homology1}tttttttt`);
    cy.get('svg[data-testid="AddCircleIcon"]', { timeout: 20000 }).last().click();
    manuallyTypeSequence(`${homology1}acaa${homology1}`);
    // Add gRNA
    cy.get('button.MuiTab-root').contains('Primers').click();
    addPrimer(guideRNASeq, 'gRNA-1');
    cy.get('button.MuiTab-root').contains('Cloning').click();

    ['crispr', 'homologous_recombination'].forEach((sourceType) => {
      addSource(sourceType);
      clickMultiSelectOption('Insert sequence', '4', 'li#source-5');
      if (sourceType === 'crispr') {
        clickMultiSelectOption('Select gRNAs', 'gRNA-1', 'li#source-5');
      }
      cy.get('li#source-5 button.submit-backend-api').click();
      cy.get('li#source-5 .multiple-output-selector', { timeOut: 2000 }).should('exist');
      setInputValue('Minimal homology length (in bp)', '80', 'li#source-5');
      cy.get('li#source-5 button.submit-backend-api').click();
      cy.get('li#source-5 .MuiAlert-message', { timeOut: 2000 }).should('exist');
      deleteSource(5);
    });
  });
  it('CRISPr shows the right error when RNA doesnt cut or cuts outside', () => {
    manuallyTypeSequence(`CTTTACACCTATGTATGAAGtgg${homology1}aattggaa${homology2}tttttttt`);
    cy.get('svg[data-testid="AddCircleIcon"]', { timeout: 20000 }).last().click();
    manuallyTypeSequence(`${homology1}acaa${homology2}`);

    addSource('crispr');
    clickMultiSelectOption('Insert sequence', '4', 'li#source-5');

    // Add gRNAs
    cy.get('button.MuiTab-root').contains('Primers').click();
    addPrimer('CTTTACACCTATGTATGAAG', 'gRNA-cut-outside');
    cy.get('button.MuiTab-root').contains('Primers').click();
    addPrimer('CTTTACACCCTATGTATGAAG', 'gRNA-no-cut');
    cy.get('button.MuiTab-root').contains('Cloning').click();

    // Test gRNA that cuts outside
    clickMultiSelectOption('Select gRNAs', 'gRNA-cut-outside', 'li#source-5');
    cy.get('li#source-5 button.submit-backend-api').click();
    cy.get('li#source-5 .MuiAlert-message', { timeOut: 2000 }).contains('not overlap');

    // Test gRNA that doesn't cut (even if one that cuts is passed as well)
    clickMultiSelectOption('Select gRNAs', 'gRNA-no-cut', 'li#source-5');
    cy.get('li#source-5 button.submit-backend-api').click();
    cy.get('li#source-5 .MuiAlert-message', { timeOut: 2000 }).contains('Could not find Cas9 cutsite');
  });
  it('displays errors when server fails', () => {
    manuallyTypeSequence(`aaaaaa${homology1}aattggaa${homology2}tttttttt`);
    cy.get('svg[data-testid="AddCircleIcon"]', { timeout: 20000 }).last().click();
    manuallyTypeSequence(`${homology1}acaa${homology2}`);
    // Add gRNA
    cy.get('button.MuiTab-root').contains('Primers').click();
    addPrimer(guideRNASeq, 'gRNA-1');
    cy.get('button.MuiTab-root').contains('Cloning').click();

    ['crispr', 'homologous_recombination'].forEach((sourceType) => {
      addSource(sourceType);
      clickMultiSelectOption('Insert sequence', '4', 'li#source-5');
      if (sourceType === 'crispr') {
        clickMultiSelectOption('Select gRNAs', 'gRNA-1', 'li#source-5');
      }
      cy.intercept('POST', 'http://127.0.0.1:8000/*', { forceNetworkError: true }).as('interc');
      cy.get('li#source-5 button.submit-backend-api').click();
      cy.get('li#source-5 .MuiAlert-message').contains('Cannot connect');

      cy.intercept('POST', 'http://127.0.0.1:8000/*', { statusCode: 500 }).as('interc2');
      cy.get('li#source-5 button.submit-backend-api').click();
      cy.get('li#source-5 .MuiAlert-message').contains('Internal server error');
      deleteSource(5);
    });
  });
});
