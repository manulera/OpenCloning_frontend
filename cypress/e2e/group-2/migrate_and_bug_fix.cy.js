import { addLane, addSource } from '../common_functions';

describe('Test that when files are loaded, old versions are migrated and bug fixes are applied', () => {
  beforeEach(() => {
    cy.visit('/');
  });
  it('Can migrate old files', () => {
    // When drag and drop
    cy.get('div.cloning-history').selectFile('cypress/test_files/old_and_bug_fix/crispr_hdr.json', { action: 'drag-drop' });
    cy.get('div.MuiAlert-message', { timeout: 20000 }).contains('migrated to the latest version');
    cy.get('div.MuiAlert-action svg[data-testid="CloseIcon"]').click();
    cy.get('div.MuiAlert-message').should('not.exist');
    addLane();
    // When loading from file in source
    addSource('UploadedFileSource', true);
    cy.get('form.submit-sequence-file input').last().selectFile('cypress/test_files/old_and_bug_fix/crispr_hdr.json', { force: true });
    cy.get('div.MuiAlert-message', { timeout: 20000 }).contains('migrated to the latest version');
    cy.get('div.MuiAlert-action svg[data-testid="CloseIcon"]').click();
    cy.get('div.MuiAlert-message').should('not.exist');
    // When loading from menu
    cy.get('.MuiToolbar-root .MuiButtonBase-root').contains('File').siblings('input').selectFile('cypress/test_files/old_and_bug_fix/crispr_hdr.json', { force: true });
    cy.get('.history-loaded-dialog').contains('Replace existing').click();
    cy.get('.history-loaded-dialog button').contains('Select').click();
    cy.get('div.MuiAlert-message', { timeout: 20000 }).contains('migrated to the latest version');
    cy.get('div.MuiAlert-action svg[data-testid="CloseIcon"]').click();
    cy.get('div.MuiAlert-message').should('not.exist');
  });
  it('Can fix bugs in old files', () => {
    // When drag and drop
    cy.get('div.cloning-history').selectFile('cypress/test_files/old_and_bug_fix/gateway.json', { action: 'drag-drop' });
    cy.get('div.MuiAlert-message', { timeout: 20000 }).contains('migrated to the latest version');
    cy.get('div.MuiAlert-message').contains('contained an error');
    cy.get('div.MuiAlert-action svg[data-testid="CloseIcon"]').first().click();
    cy.get('div.MuiAlert-action svg[data-testid="CloseIcon"]').first().click();
    cy.get('div.MuiAlert-message').should('not.exist');
    addLane();
    // When loading from file in source
    addSource('UploadedFileSource', true);
    cy.get('form.submit-sequence-file input').last().selectFile('cypress/test_files/old_and_bug_fix/gateway.json', { force: true });
    cy.get('div.MuiAlert-message', { timeout: 20000 }).contains('migrated to the latest version');
    cy.get('div.MuiAlert-message').contains('contained an error');
    cy.get('div.MuiAlert-action svg[data-testid="CloseIcon"]').first().click();
    cy.get('div.MuiAlert-action svg[data-testid="CloseIcon"]').first().click();
    cy.get('div.MuiAlert-message').should('not.exist');
    // When loading from menu
    cy.get('.MuiToolbar-root .MuiButtonBase-root').contains('File').siblings('input').selectFile('cypress/test_files/old_and_bug_fix/gateway.json', { force: true });
    cy.get('.history-loaded-dialog').contains('Replace existing').click();
    cy.get('.history-loaded-dialog button').contains('Select').click();
    cy.get('div.MuiAlert-message', { timeout: 20000 }).contains('migrated to the latest version');
    cy.get('div.MuiAlert-action svg[data-testid="CloseIcon"]').first().click();
    cy.get('div.MuiAlert-action svg[data-testid="CloseIcon"]').first().click();
    cy.get('div.MuiAlert-message').should('not.exist');
  });
});
