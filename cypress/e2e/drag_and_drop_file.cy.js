import { loadExample, skipGoogleSheetErrors, skipNcbiCheck } from './common_functions';

describe('Test drag and drop functionality', () => {
  beforeEach(() => {
    cy.visit('/');
    // Intercepts must be in this order
    skipGoogleSheetErrors();
    skipNcbiCheck();
    cy.get('li#source-1').should('exist');
  });
  it('Shows the drop area when dragging a file', () => {
    cy.get('div.cloning-history').trigger('dragover');
    cy.get('div.cloning-history').should('have.class', 'dragging-file');
    cy.get('div.cloning-history').contains('Drop multiple sequence').should('exist');
    cy.get('div.cloning-history').trigger('dragleave');
    cy.get('div.cloning-history').should('not.have.class', 'dragging-file');

    // Also can be closed
    cy.get('div.cloning-history').trigger('dragover');
    cy.get('div.cloning-history').should('have.class', 'dragging-file');
    cy.get('div.cloning-history').contains('Drop multiple sequence').should('exist');
    cy.get('div.cloning-history .cancel-icon').click();
    cy.get('div.cloning-history').should('not.have.class', 'dragging-file');
  });
  it('Can load single sequence file', () => {
    cy.get('div.cloning-history').selectFile('public/examples/ase1.gb', { action: 'drag-drop' });
    // This also checks that the empty source was replaced
    cy.get('li#sequence-2', { timeout: 20000 }).contains('CU329670');
    cy.get('li#sequence-2 li#source-1').contains('Read from uploaded file ase1.gb');
  });
  it('Can load multiple sequence files, with multiple sequences in them', () => {
    cy.get('div.cloning-history').selectFile(['public/examples/ase1.gb', 'public/examples/dummy_multi_fasta.fasta'], { action: 'drag-drop' });
    // There should be three sources displayed, and three sequences (7 because of the Add Source button)
    cy.get('div.tf-tree.tf-ancestor-tree ul li').should('have.length', 7);
  });
  it('Can load a history file', () => {
    cy.get('div.cloning-history').selectFile('public/examples/homologous_recombination.json', { action: 'drag-drop' });
    // No error message should be displayed
    cy.get('div.MuiAlert-message').should('not.exist');
    cy.get('div.tf-tree.tf-ancestor-tree').contains('Homologous recombination with').should('exist');
  });
  it('Shows the right errors when dropping wrong files', () => {
    // JSON file + something else
    cy.get('div.cloning-history').selectFile(['public/examples/homologous_recombination.json', 'public/examples/ase1.gb'], { action: 'drag-drop' });
    cy.get('div.MuiAlert-message').contains('Drop either a single JSON file or multiple sequence files. Not both.');

    // JSON file with wrong content
    cy.get('div.cloning-history').selectFile('public/examples/wrong_history.json', { action: 'drag-drop' });
    cy.get('div.MuiAlert-message').contains('JSON file in wrong format');

    // Files which are not sequences
    cy.get('div.cloning-history').selectFile('public/favicon.ico', { action: 'drag-drop' });
    cy.get('div.MuiAlert-message').contains('Could not read the file favicon.ico');

    // Files which are not sequences mixed with sequences
    cy.get('div.cloning-history').selectFile(['public/examples/ase1.gb', 'public/favicon.ico'], { action: 'drag-drop' });
    cy.get('div.MuiAlert-message').contains('Could not read the file favicon.ico');
  });
  it('Can merge with existing history', () => {
    loadExample('Gibson assembly');

    cy.get('div.cloning-history').selectFile('public/examples/homologous_recombination.json', { action: 'drag-drop', force: true });
    cy.get('.history-loaded-dialog').contains('Add to existing').click();
    cy.get('.history-loaded-dialog button').contains('Select').click();

    // Previous
    cy.get('div.cloning-tab-pannel').contains('Gibson assembly of fragments');
    // Newly loaded
    cy.get('div.cloning-tab-pannel').contains('Homologous recombination');

    // Cannot load one with the same primer names again

    cy.get('div.cloning-history').selectFile('public/examples/homologous_recombination.json', { action: 'drag-drop', force: true });
    cy.get('.history-loaded-dialog').contains('Add to existing').click();
    cy.get('.history-loaded-dialog button').contains('Select').click();

    // Shows error and does not load them again
    cy.get('.MuiAlert-message').contains('Primer name from loaded file exists in current session').should('exist');
    cy.get('div.cloning-tab-pannel').filter(':contains("Homologous recombination")').should('have.length', 1);

    // Can replace the history
    cy.get('.MuiToolbar-root .MuiButtonBase-root').contains('File').siblings('input').selectFile('public/examples/crispr_hdr.json', { force: true });
    cy.get('.history-loaded-dialog').contains('Replace existing').click();
    cy.get('.history-loaded-dialog button').contains('Select').click();

    cy.get('div.cloning-tab-pannel').contains('Homologous recombination').should('not.exist');
    cy.get('div.cloning-tab-pannel').contains('CRISPR HDR with').should('exist');
  });
});
