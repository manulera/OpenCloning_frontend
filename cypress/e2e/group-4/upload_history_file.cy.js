import { closeAlerts, loadExample} from '../common_functions';

describe('Test upload history from file', () => {
  beforeEach(() => {
    cy.visit('/');
  });
  it('JSON: Can upload a correct json file', () => {
    cy.get('.MuiToolbar-root .MuiButtonBase-root').contains('File').siblings('input').selectFile('public/examples/restriction_then_ligation.json', { force: true });
    cy.get('div.cloning-tab-pannel').contains('PCR with primers fwd and rvs');
    cy.get('div.cloning-tab-pannel').should('be.visible');
    cy.get('div.description-tab-pannel').should('not.be.visible');

    // When loading a cloning strategy with files as json, they are dropped
    cy.get('.MuiToolbar-root .MuiButtonBase-root').contains('File').siblings('input').selectFile('cypress/test_files/cloning_strategy_with_sequencing.json', { force: true });
    cy.get('.history-loaded-dialog').contains('Replace existing').click();
    cy.get('.history-loaded-dialog button').contains('Select').click();
    cy.get('div.cloning-tab-pannel').contains('final_product.gb').then(() => {
      cy.window().its('sessionStorage').its('length').should('eq', 0);
    });
    // No verification files are listed either
    cy.get('li#sequence-2 [data-testid="RuleIcon"]').click();
    cy.get('table td').should('not.exist');
  });
  it('JSON: Can merge with existing history', () => {
    loadExample('CRISPR HDR');
    cy.get('.MuiToolbar-root .MuiButtonBase-root').contains('File').siblings('input').selectFile('public/examples/restriction_then_ligation.json', { force: true });
    cy.get('.history-loaded-dialog').contains('Add to existing').click();
    cy.get('.history-loaded-dialog button').contains('Select').click();
    // Previous
    cy.get('div.cloning-tab-pannel').contains('CRISPR HDR with');
    // Newly loaded
    cy.get('div.cloning-tab-pannel').contains('Ligation of fragments');

    // Cannot load one with the same primer names again
    cy.get('.MuiToolbar-root .MuiButtonBase-root').contains('File').siblings('input').selectFile('public/examples/crispr_hdr.json', { force: true });
    cy.get('.history-loaded-dialog').contains('Add to existing').click();
    cy.get('.history-loaded-dialog button').contains('Select').click();

    // Shows error and does not load them again
    cy.get('.MuiAlert-message').contains('Primer name from loaded file exists in current session').should('exist');
    cy.get('div.cloning-tab-pannel').filter(':contains("CRISPR HDR with")').should('have.length', 1);

    // Can replace the history
    cy.get('.MuiToolbar-root .MuiButtonBase-root').contains('File').siblings('input').selectFile('public/examples/crispr_hdr.json', { force: true });
    cy.get('.history-loaded-dialog').contains('Replace existing').click();
    cy.get('.history-loaded-dialog button').contains('Select').click();

    cy.get('div.cloning-tab-pannel').contains('Ligation of fragments').should('not.exist');
    cy.get('div.cloning-tab-pannel').contains('CRISPR HDR with').should('exist');
  });
  it('Gives an error message for an incorrect type of file', () => {
    cy.get('.MuiToolbar-root .MuiButtonBase-root').contains('File').siblings('input').selectFile('public/examples/ase1.gb', { force: true });
    cy.get('.MuiAlert-message').contains('Only JSON and zip files are accepted');
    cy.get('.MuiToolbar-root .MuiButtonBase-root').contains('File').siblings('input').selectFile('cypress/test_files/wrong_history.json', { force: true });
    cy.get('.MuiAlert-message').contains('Cloning strategy not valid');
  });
  it('Zip: Can upload a correct zip file', () => {
    cy.get('.MuiToolbar-root .MuiButtonBase-root').contains('File').siblings('input').selectFile('public/examples/cloning_strategy_with_sequencing.zip', { force: true });
    cy.get('div.cloning-tab-pannel').contains('final_product.gb').then(() => {
    // Check that the files are in the session storage
      cy.window().its('sessionStorage')
        .invoke('getItem', 'verification-2-BZO904_13409044_13409044.ab1')
        .should('not.be.null');
      cy.window().its('sessionStorage')
        .invoke('getItem', 'verification-2-BZO903_13409037_13409037.ab1')
        .should('not.be.null');
      cy.window().its('sessionStorage')
        .invoke('getItem', 'verification-2-BZO902_13409020_13409020.ab1')
        .should('not.be.null');
    });
    // Clicking on the data-testid="RuleIcon" should open the verification file dialog
    cy.get('li#sequence-2 [data-testid="RuleIcon"]').click();
    cy.get('table').contains('BZO904_13409044_13409044.ab1');
    cy.get('table').contains('BZO903_13409037_13409037.ab1');
    cy.get('table').contains('BZO902_13409020_13409020.ab1');
  });
  it('Zip: Can merge with existing history', () => {
    loadExample('CRISPR HDR');
    cy.get('.MuiToolbar-root .MuiButtonBase-root').contains('File').siblings('input').selectFile('cypress/test_files/zip_with_primer.zip', { force: true });
    cy.get('.history-loaded-dialog').contains('Add to existing').click();
    cy.get('.history-loaded-dialog button').contains('Select').click();
    cy.get('div.cloning-tab-pannel').contains('PCR with primers');
    cy.get('div.cloning-tab-pannel').contains('final_product.gb');

    // Cannot load one with the same primer names again
    cy.get('.MuiToolbar-root .MuiButtonBase-root').contains('File').siblings('input').selectFile('cypress/test_files/zip_with_primer.zip', { force: true });
    cy.get('.history-loaded-dialog').contains('Add to existing').click();
    cy.get('.history-loaded-dialog button').contains('Select').click();

    // Shows error and does not load them again
    cy.get('.MuiAlert-message').contains('Primer name from loaded file exists in current session').should('exist');
    cy.get('div.cloning-tab-pannel').filter(':contains("final_product.gb")').should('have.length', 1);

    // Can replace the history
    cy.get('.MuiToolbar-root .MuiButtonBase-root').contains('File').siblings('input').selectFile('cypress/test_files/zip_with_primer.zip', { force: true });
    cy.get('.history-loaded-dialog').contains('Replace existing').click();
    cy.get('.history-loaded-dialog button').contains('Select').click();

    cy.get('div.cloning-tab-pannel').contains('final_product.gb').should('exist');
    cy.get('div.cloning-tab-pannel').contains('PCR with primers').should('not.exist');
  });
  it('Zip: error handling', () => {
    cy.get('.MuiToolbar-root .MuiButtonBase-root').contains('File').siblings('input').selectFile('cypress/test_files/wrong_json_in_zip.zip', { force: true });
    cy.get('.MuiAlert-message').contains('Cloning strategy not valid').then(() => {
      // Check that nothing was added to session storage
      cy.window().its('sessionStorage').its('length').should('eq', 0);
    });
    closeAlerts();
    // If something was in session storage, it remains there
    cy.get('.MuiToolbar-root .MuiButtonBase-root').contains('File').siblings('input').selectFile('cypress/test_files/zip_with_primer.zip', { force: true });
    cy.get('div.cloning-tab-pannel').contains('final_product.gb').should('exist');
    cy.get('.MuiToolbar-root .MuiButtonBase-root').contains('File').siblings('input').selectFile('cypress/test_files/wrong_json_in_zip.zip', { force: true });
    cy.get('.history-loaded-dialog').contains('Replace existing').click();
    cy.get('.history-loaded-dialog button').contains('Select').click();
    cy.get('.MuiAlert-message').contains('Cloning strategy not valid').then(() => {
      // Check that nothing was removed from session storage
      cy.window().its('sessionStorage').its('length').should('eq', 3);
    });
    closeAlerts();
    // Missing files in zip
    cy.get('.MuiToolbar-root .MuiButtonBase-root').contains('File').siblings('input').selectFile('cypress/test_files/zip_missing_files.zip', { force: true });
    cy.get('.MuiAlert-message').contains('File verification-2-BZO904_13409044_13409044.ab1 not found in zip.').should('exist');
    closeAlerts();
    // Excess file in zip
    cy.get('.MuiToolbar-root .MuiButtonBase-root').contains('File').siblings('input').selectFile('cypress/test_files/zip_extra_files.zip', { force: true });
    cy.get('.MuiAlert-message').contains('File verification-2-BZO902_13409020_13409020.ab1 found in zip but not in cloning strategy.').should('exist');
    closeAlerts();
    // No json file in zip
    cy.get('.MuiToolbar-root .MuiButtonBase-root').contains('File').siblings('input').selectFile('cypress/test_files/zip_no_json.zip', { force: true });
    cy.get('.MuiAlert-message').contains('Zip file must contain').should('exist');
  });
});
