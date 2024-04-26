import { manuallyTypeSequence, addSource } from './common_functions';

describe('Test restriction component', () => {
  beforeEach(() => {
    cy.visit('/');
  });
  it('Works with single enzyme', () => {
    manuallyTypeSequence('aagaattcaaaagaattcaa');
    addSource('restriction');
    // Click the selector
    cy.get('li#source-3 .MuiInputBase-root').eq(1).click();
    // Select EcoRI
    cy.get('label').contains('Enzymes used').siblings('div').children('input')
      .type('EcoRI');
    cy.get('div[role="presentation"]').contains('EcoRI').click();
    // Cut with EcoRI
    cy.get('button').contains('Perform restriction').click();
    // Contains both the parent with the subset, and the child with the result
    cy.get('li#source-3').contains('20 bps');
    cy.get('li#source-3').contains('7 bps');
    cy.get('li#source-3 .overhang-representation').contains('ttcttaa');
    // The subset is shown
    cy.get('li#source-3 .multiple-output-selector .veSelectionLayer').should('exist');
    cy.get('li#source-3 .multiple-output-selector [title="Selecting 8 bps from 1 to 8"]');
    // Clicking on the buttons should change the selection (we move back)
    cy.get('li#source-3 .multiple-output-selector [data-testid="ForwardIcon"]').first().click();
    cy.get('li#source-3 .overhang-representation').contains('ttcttaa').should('not.exist');
    cy.get('li#source-3 .overhang-representation').contains('aattcaa');
    // We select the central fragment
    cy.get('li#source-3 .multiple-output-selector [data-testid="ForwardIcon"]').first().click();
    cy.get('li#source-3 .overhang-representation').contains('aattcaaaag');
    cy.get('li#source-3 .overhang-representation').contains('gttttcttaa');
    cy.get('button').contains('Choose fragment').click();
    // The result is shown
    cy.get('li#sequence-4 li#source-3').should('exist');
    cy.get('li#sequence-4', { timeout: 20000 }).contains('14 bps');
  });
  it('works with multiple enzymes', () => {
    manuallyTypeSequence('aagaattcaaaaGTCGACaa');
    addSource('restriction');
    // Select the enzymes and submit
    cy.get('li#source-3 .MuiInputBase-root').eq(1).click();
    cy.get('div[role="presentation"]', { timeout: 20000 }).contains('EcoRI').click();
    cy.get('li#source-3 .MuiInputBase-root').eq(1).click();
    cy.get('div[role="presentation"]').contains('SalI').click();
    cy.get('button').contains('Perform restriction').click();
    // The result is shown and there are 3 possible fragments (both enzymes were sent)
    cy.get('li#source-3 .overhang-representation').contains('ttcttaa');
    cy.get('li#source-3 .multiple-output-selector [data-testid="ForwardIcon"]').eq(1).click();
    cy.get('li#source-3 .overhang-representation').contains('gttttcagct');
    cy.get('li#source-3 .multiple-output-selector [data-testid="ForwardIcon"]').eq(1).click();
    cy.get('li#source-3 .overhang-representation').contains('tcgacaa');
    cy.get('li#source-3 .multiple-output-selector [data-testid="ForwardIcon"]').eq(1).click();
    cy.get('li#source-3 .overhang-representation').contains('ttcttaa');

    // We select the first fragment
    cy.get('button').contains('Choose fragment').click();
    // The result is shown
    cy.get('li#sequence-4 li#source-3').should('exist');
    cy.get('li#sequence-4 .overhang-representation').contains('ttcttaa');
  });
  it('does not show choices if there is one possible output', () => {
    manuallyTypeSequence('aagaattcaaaa', true);
    addSource('restriction');
    // Cut with EcoRI
    cy.get('li#source-3 .MuiInputBase-root').eq(1).click();
    cy.get('div[role="presentation"]').contains('EcoRI').click();
    cy.get('button').contains('Perform restriction').click();
    // Directly displays the result
    cy.get('li#sequence-4 li#source-3').should('exist');
    cy.get('li#sequence-4 .overhang-representation').contains('aattcaaaaaag');
  });
  it('applies the right constraints', () => {
    manuallyTypeSequence('aagaattcaaaaGTCGACaa');
    addSource('restriction');
    // Before selecting an enzyme, you cannot submit
    cy.get('button').contains('Perform restriction').should('not.exist');
  });
  it('allows re-restriction', () => {
    manuallyTypeSequence('aagaattcaaaaGTCGACaa');
    addSource('restriction');
    // Select the enzymes and submit
    cy.get('li#source-3 .MuiInputBase-root').eq(1).click();
    cy.get('div[role="presentation"]', { timeout: 20000 }).contains('EcoRI').click();
    cy.get('button').contains('Perform restriction').click();
    // The cut shown is EcoRI
    cy.get('li#source-3 .overhang-representation').contains('ttcttaa');
    // Unselect EcoRI and select SalI
    cy.get('li#source-3 .MuiInputBase-root').eq(1).click();
    cy.get('div[role="presentation"]').contains('EcoRI').click();
    cy.get('li#source-3 .MuiInputBase-root').eq(1).click();
    cy.get('div[role="presentation"]').contains('SalI').click();
    cy.get('button').contains('Perform restriction').click();
    // The cut shown is SalI
    cy.get('li#source-3 .overhang-representation').contains('TTCTT...TTTTCAGCT');
    // Select this cut
    cy.get('button').contains('Choose fragment').click();
    // The result is shown
    cy.get('li#sequence-4 li#source-3').should('exist');
    cy.get('li#sequence-4 .overhang-representation').contains('TTCTT...TTTTCAGCT');
  });
  it('shows the right error if the enzyme does not cut', () => {
    // Type the sequence
    manuallyTypeSequence('aagaattcaaaaGTCGACaa');
    addSource('restriction');
    // Select the enzymes and submit
    cy.get('li#source-3 .MuiInputBase-root').eq(1).click();
    cy.get('div[role="presentation"]', { timeout: 20000 }).contains('AanI').click();
    cy.get('li#source-3 .MuiInputBase-root').eq(1).click();
    cy.get('div[role="presentation"]').contains('AatII').click();
    cy.get('button').contains('Perform restriction').click();
    // The cut shown is EcoRI
    cy.get('li#source-3').contains('These enzymes do not cut');
  });
  it('shows the right error if the backend server fails', () => {
    manuallyTypeSequence('aagaattcaaaaGTCGACaa');
    addSource('restriction');
    // Select the enzymes and submit
    cy.get('li#source-3 .MuiInputBase-root').eq(1).click();
    cy.get('div[role="presentation"]', { timeout: 20000 }).contains('EcoRI').click();
    // Intercept the request
    // simulate backend not connected
    cy.intercept('POST', '/restriction', { forceNetworkError: true });
    cy.get('button').contains('Perform restriction').click();
    cy.get('li#source-3').contains('Cannot connect to backend server');
  });
});
