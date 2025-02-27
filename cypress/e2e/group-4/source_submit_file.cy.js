import { addLane, addSource, clickMultiSelectOption } from '../common_functions';

describe('File Source', () => {
  beforeEach(() => {
    cy.visit('/');
    addSource('UploadedFileSource', 1);
  });
  it('works on normal case', () => {
    //  This does not really test that clicking the button opens the file interface, but I did not see how
    cy.get('li#source-1 form.submit-sequence-file input').eq(2).selectFile('public/examples/ase1.gb', { force: true });
    cy.get('li#sequence-2', { timeout: 20000 }).contains('CU329670');
    cy.get('li#sequence-2 li#source-1').contains('Read from file ase1.gb');
  });
  it('gives the right error when file has a wrong extension', () => {
    //  This does not really test that clicking the button opens the file interface, but I did not see how
    cy.get('li#source-1 form.submit-sequence-file input').eq(2).selectFile('cypress/test_files/wrong_extension.txt', { force: true });
    cy.get('li#source-1 .MuiAlert-message').contains('We could not guess the format');
  });
  it('gives the right error when file has a wrong content', () => {
    //  This does not really test that clicking the button opens the file interface, but I did not see how
    cy.get('li#source-1 form.submit-sequence-file input').eq(2).selectFile('cypress/test_files/wrong_content.gb', { force: true });
    cy.get('li#source-1 .MuiAlert-message').contains('Biopython cannot process');
  });
  it('allows to circularize non-fasta files', () => {
    cy.get('li#source-1').contains('Circularize').click();
    cy.get('li#source-1 form.submit-sequence-file input').eq(2).selectFile('public/examples/ase1.gb', { force: true });
    cy.get('li#sequence-2 svg.circularViewSvg', { timeout: 20000 }).should('exist');
  });
  it('works when circularize is checked and file is multi-fasta', () => {
    cy.get('li#source-1').contains('Circularize').click();
    cy.get('li#source-1 form.submit-sequence-file input').eq(2).selectFile('public/examples/dummy_multi_fasta.fasta', { force: true });
    cy.get('li#source-1 svg.circularViewSvg', { timeout: 20000 }).should('exist');
  });
  it('allows to specify input format', () => {
    clickMultiSelectOption('File format', 'FASTA', 'li#source-1');
    cy.get('li#source-1 form.submit-sequence-file input').eq(2).selectFile('public/examples/fasta_file_with_gb_extension.gb', { force: true });
    cy.get('li#source-1', { timeout: 20000 }).contains('Choose product');
  });
  it('works when loading a JSON history file', () => {
    cy.get('li#source-1 form.submit-sequence-file input').eq(2).selectFile('public/examples/golden_gate.json', { force: true });
    cy.get('li', { timeout: 20000 }).contains('Restriction with BsaI');
    // You can load another history file on top
    addLane();
    addSource('UploadedFileSource', true);
    cy.get('form.submit-sequence-file input').eq(2).selectFile('public/examples/gibson_assembly.json', { force: true });
    cy.get('li', { timeout: 20000 }).contains('Restriction with BsaI');
    cy.get('li').contains('Gibson');

    // Can add a JSON file with files, and they are dropped
    addLane();
    addSource('UploadedFileSource', true);
    cy.get('form.submit-sequence-file input').eq(2).selectFile('cypress/test_files/cloning_strategy_with_sequencing.json', { force: true });
    cy.get('li#source-37').contains('final_product.gb').then(() => {
      cy.window().its('sessionStorage').its('length').should('eq', 0);
    });
    // No verification files are listed either
    cy.get('li#sequence-38 [data-testid="RuleIcon"]').click();
    cy.get('.verification-file-dialog table td').should('not.exist');
    cy.get('.verification-file-dialog button').contains('Close').click();

    // Cannot submit one with primers with the same names
    addLane();
    addSource('UploadedFileSource', true);
    cy.get('form.submit-sequence-file input').eq(2).selectFile('cypress/test_files/primer_same_name_different_sequence.json', { force: true });
    cy.get('.open-cloning li .MuiAlert-message').contains('Primer name fwd exists');

    // Loading a history file with invalid JSON gives an error
    clickMultiSelectOption('File format', 'JSON (history file)', '.open-cloning li');
    cy.get('form.submit-sequence-file input').eq(2).selectFile('public/examples/ase1.gb', { force: true });
    cy.get('li .MuiAlert-message').contains('Invalid JSON');

    // Loading a valid json file with wrong history gives an error
    clickMultiSelectOption('File format', 'JSON (history file)', '.open-cloning li');
    cy.get('form.submit-sequence-file input').eq(2).selectFile('package.json', { force: true });
    cy.get('li .MuiAlert-message').contains('JSON file should contain');
  });
  it('works when loading a zip file', () => {
    // Load normal zip file
    cy.get('li#source-1 form.submit-sequence-file input').eq(2).selectFile('cypress/test_files/zip_with_same_primer.zip', { force: true });
    cy.get('li#source-1').contains('final_product.gb').then(() => {
      cy.window().its('sessionStorage').its('length').should('eq', 3);
    });
    cy.get('li#sequence-2 [data-testid="RuleIcon"]').click();
    cy.get('.verification-file-dialog table tr').should('have.length', 4);
    cy.get('.verification-file-dialog button').contains('Close').click();

    // Load another one on top
    addLane();
    addSource('UploadedFileSource', true);
    cy.get('form.submit-sequence-file input').eq(2).selectFile('public/examples/cloning_strategy_with_sequencing.zip', { force: true });
    cy.get('li#source-1').contains('final_product.gb');
    cy.get('li#source-3').contains('final_product.gb').then(() => {
      cy.window().its('sessionStorage').its('length').should('eq', 6);
    });
    cy.get('li#sequence-4 [data-testid="RuleIcon"]').click();
    cy.get('.verification-file-dialog table tr').should('have.length', 4);
    cy.get('.verification-file-dialog button').contains('Close').click();

    // Error handling
    addLane();
    addSource('UploadedFileSource', true);
    cy.get('form.submit-sequence-file input').eq(2).selectFile('cypress/test_files/zip_with_conflicting_primer.zip', { force: true });
    cy.get('.open-cloning .MuiAlert-message').contains('Primer name dummy exists');

    cy.get('form.submit-sequence-file input').eq(2).selectFile('cypress/test_files/wrong_json_in_zip.zip', { force: true });
    cy.get('.open-cloning .MuiAlert-message').contains('should contain');

    cy.get('form.submit-sequence-file input').eq(2).selectFile('cypress/test_files/zip_missing_files.zip', { force: true });
    cy.get('.open-cloning .MuiAlert-message').contains('File verification-2-BZO904_13409044_13409044.ab1 not found in zip.');

    cy.get('form.submit-sequence-file input').eq(2).selectFile('cypress/test_files/zip_extra_files.zip', { force: true });
    cy.get('.open-cloning .MuiAlert-message').contains('File verification-2-BZO902_13409020_13409020.ab1 found in zip but not in cloning strategy.');

    cy.get('form.submit-sequence-file input').eq(2).selectFile('cypress/test_files/zip_no_json.zip', { force: true });
    cy.get('.open-cloning .MuiAlert-message').contains('Zip file must contain');
  });
});
