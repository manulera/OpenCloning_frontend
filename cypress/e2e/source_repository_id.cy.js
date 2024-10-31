import { addSource, clickMultiSelectOption, setInputValue, skipGoogleSheetErrors, skipNcbiCheck } from './common_functions';

describe('RepositoryId Source', () => {
  beforeEach(() => {
    cy.visit('/');
    // Intercepts must be in this order
    skipGoogleSheetErrors();
    skipNcbiCheck();
    addSource('RepositoryIdSource', true);
  });
  it('works with addgene', () => {
    clickMultiSelectOption('Select repository', 'AddGene', 'li#source-1');
    setInputValue('AddGene ID', '39282', 'li#source-1');
    cy.get('button.MuiButtonBase-root').contains('Submit').click();
    cy.get('li#sequence-2 .corner-id', { timeout: 20000 }).first().should('have.text', '2');
    cy.get('li#sequence-2 li#source-1').should('exist');
    cy.get('li#sequence-2 li#source-1').contains('Request to addgene with ID 39282');
    cy.get('li#sequence-2').contains('pFA6a');
    cy.get('li#sequence-2').contains('5086 bps');
    // links to https://www.addgene.org/39282/sequences/
    cy.get('li#source-1 a[href="https://www.addgene.org/39282/sequences/"]').should('be.visible');
  });
  it('works with genbank', () => {
    clickMultiSelectOption('Select repository', 'GenBank', 'li#source-1');
    setInputValue('GenBank ID', 'NM_001018957.2', 'li#source-1');
    cy.get('li#source-1 button.MuiButtonBase-root').click();
    cy.get('li#sequence-2 .corner-id', { timeout: 20000 }).first().should('have.text', '2');
    cy.get('li#sequence-2 li#source-1').should('exist');
    cy.get('li#sequence-2 li#source-1').contains('Request to genbank with ID NM_001018957.2 ');
    cy.get('li#sequence-2').contains('NM_001018957.2');
    cy.get('li#sequence-2').contains('2671 bps');

    // links to https://www.ncbi.nlm.nih.gov/nuccore/NM_001018957.2
    cy.get('li#source-1 a[href="https://www.ncbi.nlm.nih.gov/nuccore/NM_001018957.2"]').should('be.visible');
  });
  it('works with benchling', () => {
    clickMultiSelectOption('Select repository', 'Benchling', 'li#source-1');
    setInputValue('Benchling URL', 'https://benchling.com/siverson/f/lib_B94YxDHhQh-cidar-moclo-library/seq_dh1FrJTc-b0015_dh/edit', 'li#source-1');
    cy.get('li#source-1 button.MuiButtonBase-root').click();
    cy.get('li#sequence-2 .corner-id', { timeout: 20000 }).first().should('have.text', '2');
    cy.get('li#sequence-2 li#source-1').should('exist');
    cy.get('li#sequence-2 li#source-1').contains('Request to Benchling');
    cy.get('li#sequence-2').contains('2237 bps');

    // links to the /edit
    cy.get('li#source-1 a[href="https://benchling.com/siverson/f/lib_B94YxDHhQh-cidar-moclo-library/seq_dh1FrJTc-b0015_dh/edit"]').should('be.visible');
  });
  it('works with SnapGene', () => {
    clickMultiSelectOption('Select repository', 'SnapGene', 'li#source-1');
    // When clicking in the input, displays message
    cy.get('li#source-1').contains('Plasmid name').siblings('div').first()
      .click();
    cy.get('div[role="presentation"]').contains('Type at least 3 characters to search').should('be.visible');

    // Click outside
    cy.get('body').click(0, 0);

    // Cannot submit if nothing selected
    cy.get('li#source-1 button').contains('Submit').should('not.exist');

    setInputValue('Plasmid name', 'pfa', 'li#source-1');
    clickMultiSelectOption('Plasmid name', 'pFastBac1', 'li#source-1');

    // Can clear the input
    cy.get('li#source-1').contains('Plasmid name').siblings('div').children('input')
      .click();
    cy.get('li#source-1 button.MuiAutocomplete-clearIndicator').click();
    cy.get('body').click(0, 0);

    // When clicking in the input, displays message
    cy.get('li#source-1').contains('Plasmid name').siblings('div').first()
      .click();
    cy.get('div[role="presentation"]').contains('Type at least 3 characters to search').should('be.visible');
    cy.get('body').click(0, 0);

    // Can submit
    setInputValue('Plasmid name', 'pfa', 'li#source-1');
    clickMultiSelectOption('Plasmid name', 'pFastBac1', 'li#source-1');
    cy.get('li#source-1 button').contains('Submit').click();

    // Shows the plasmid name
    cy.get('li#sequence-2').contains('pFastBac1');
    cy.get('li#sequence-2').contains('4776 bps');

    // Links to https://www.snapgene.com/plasmids/insect_cell_vectors/pFastBac1
    cy.get('li#source-1 a[href="https://www.snapgene.com/plasmids/insect_cell_vectors/pFastBac1"]').should('be.visible');
    cy.get('li#source-1').contains('Plasmid pFastBac1 from SnapGene').should('be.visible');
  });
  it('works with Euroscarf', () => {
    clickMultiSelectOption('Select repository', 'Euroscarf', 'li#source-1');
    setInputValue('Euroscarf ID', 'P30174', 'li#source-1');
    cy.get('li#source-1 button').contains('Submit').click();
    cy.get('li#sequence-2').contains('pKT128');
    cy.get('li#sequence-2').contains('4738 bps');

    // Links to http://www.euroscarf.de/plasmid_details.php?accno=P30174
    cy.get('li#source-1 a[href="http://www.euroscarf.de/plasmid_details.php?accno=P30174"]').should('be.visible');
  });
  it('handles empty value and wrong IDs', () => {
    // AddGene =================================
    clickMultiSelectOption('Select repository', 'AddGene', 'li#source-1');
    // Cannot submit empty value
    cy.get('#repository-id-1').clear('');
    cy.get('li#source-1 button.MuiButtonBase-root').should('not.exist');
    // Cannot submit value that does not fit the regex
    cy.get('#repository-id-1').clear('a');
    cy.get('#repository-id-1').type('aaa');
    cy.get('li#source-1 button.MuiButtonBase-root').should('not.exist');
    // An id that does not exist returns an error
    setInputValue('AddGene ID', '39282392823928239282392823928239282', 'li#source-1');
    cy.get('li#source-1 button.MuiButtonBase-root').click();
    cy.get('.MuiAlert-message', { timeout: 20000 }).should('be.visible');

    // GenBank =================================
    clickMultiSelectOption('Select repository', 'GenBank', 'li#source-1');
    // Cannot submit empty
    cy.get('li#source-1 button.MuiButtonBase-root').should('not.exist');
    // Error when it does not exist
    cy.get('#repository-id-1').clear('a');
    cy.get('#repository-id-1').type('aaa');
    cy.get('li#source-1 button.MuiButtonBase-root').click();
    cy.get('.MuiAlert-message', { timeout: 20000 }).should('be.visible');

    // Benchling =================================
    clickMultiSelectOption('Select repository', 'Benchling', 'li#source-1');
    // Cannot submit empty
    cy.get('li#source-1 button.MuiButtonBase-root').should('not.exist');
    // Cannot submit value that does not fit the regex
    setInputValue('Benchling URL', 'hello', 'li#source-1');
    cy.get('li#source-1 button.MuiButtonBase-root').should('not.exist');

    setInputValue('Benchling URL', 'https://benchling.com/siverson/f/lib_B94YxDHhQh-cidar-moclo-library/seq_dh1FrJTc-b0015_dh.gb', 'li#source-1');
    cy.get('li#source-1 button.MuiButtonBase-root').should('not.exist');

    setInputValue('Benchling URL', 'https://benchling.com/siverson/f/lib_B94YxDHhQh-cidar-moclo-library/seq_dh1FrJTc-b0015_dh', 'li#source-1');
    cy.get('li#source-1 button.MuiButtonBase-root').should('not.exist');

    // Error when it does not exist
    setInputValue('Benchling URL', 'https://benchling.com/bluh/blah/edit', 'li#source-1');
    cy.get('li#source-1 button.MuiButtonBase-root').click();
    cy.get('.MuiAlert-message', { timeout: 20000 }).should('be.visible');

    // Euroscarf =================================
    clickMultiSelectOption('Select repository', 'Euroscarf', 'li#source-1');
    // Cannot submit empty
    cy.get('li#source-1 button.MuiButtonBase-root').should('not.exist');
    // Cannot submit value that does not fit the regex
    setInputValue('Euroscarf ID', 'X30174', 'li#source-1');
    cy.get('li#source-1 button.MuiButtonBase-root').should('not.exist');
    // An id that does not exist returns an error
    setInputValue('Euroscarf ID', 'P9999999999999', 'li#source-1');
    cy.get('li#source-1 button.MuiButtonBase-root').click();
    cy.get('.MuiAlert-message', { timeout: 20000 }).should('be.visible');
  });
});
