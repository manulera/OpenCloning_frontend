import { addSource, manuallyTypeSequence, clickMultiSelectOption, clickSequenceOutputArrow } from './common_functions';

describe('Tests ligation assembly functionality', () => {
  beforeEach(() => {
    cy.visit('/');
  });
  it('works with blunt ends', () => {
    manuallyTypeSequence('aagaattcaaaagaattcaa');
    cy.get('svg[data-testid="AddCircleIcon"]', { timeout: 20000 }).last().click();
    manuallyTypeSequence('aagaattcaaaagaattcaa');
    addSource('ligation');
    clickMultiSelectOption('Input sequences', '4', 'li#source-5');
    cy.get('#tab-panel-0 span').contains('Blunt ligation').click();
    cy.get('li#source-5 button').contains('Submit').click();
    cy.get('li#source-5 .assembly-plan-displayer').contains('rc').should('not.exist');
    clickSequenceOutputArrow('li#source-5');
    cy.get('li#source-5 .assembly-plan-displayer').contains('rc').should('exist');
    cy.get('li#source-5 button').contains('Choose fragment').click();
    cy.get('li#sequence-6 li#source-5');
    cy.get('li#sequence-6').contains('40 bps');
  });
  it('works with a single input for circularisation', () => {
    manuallyTypeSequence('aagaattcaaaagaattcaa');
    addSource('ligation');
    cy.get('#tab-panel-0 span').contains('Blunt ligation').click();
    cy.get('li#source-3 button').contains('Submit').click();
    cy.get('li#sequence-4 li#source-3');
    cy.get('li#sequence-4').contains('20 bps');
  });
  it('works with overhangs and single result', () => {
    manuallyTypeSequence('AAAcaa', false, [0, -3]);
    cy.get('svg[data-testid="AddCircleIcon"]', { timeout: 20000 }).last().click();
    manuallyTypeSequence('caaGGG', false, [-3, 0]);
    addSource('ligation');
    clickMultiSelectOption('Input sequences', '4', 'li#source-5');
    cy.get('li#source-5 button').contains('Submit').click();
    cy.get('li#sequence-6 li#source-5');
    cy.get('li#sequence-6').contains('9 bps');
  });
  it('works with overhangs and multiple results', () => {
    manuallyTypeSequence('AAAcaa', false, [0, -3]);
    cy.get('svg[data-testid="AddCircleIcon"]', { timeout: 20000 }).last().click();
    manuallyTypeSequence('caaGGGgtt', false, [-3, -3]);
    addSource('ligation');
    clickMultiSelectOption('Input sequences', '4', 'li#source-5');
    cy.get('li#source-5 button').contains('Submit').click();
    cy.get('.multiple-output-selector', { timeout: 20000 }).should('exist');
    clickSequenceOutputArrow('li#source-5');
    clickSequenceOutputArrow('li#source-5');
    cy.get('li#source-5 .assembly-plan-displayer').contains('rc').should('exist');
    cy.get('li#source-5 button').contains('Choose fragment').click();
    cy.get('li#sequence-6 li#source-5');
    cy.get('li#sequence-6').contains('13 bps');
  });
  it('works with partial overlaps', () => {
    manuallyTypeSequence('AAAcaa', false, [0, -3]);
    cy.get('svg[data-testid="AddCircleIcon"]', { timeout: 20000 }).last().click();
    manuallyTypeSequence('aaGGG', false, [-3, 0]);
    addSource('ligation');
    clickMultiSelectOption('Input sequences', '4', 'li#source-5');
    cy.get('#tab-panel-0 span').contains('Allow partial overlaps').click();
    cy.get('li#source-5 button').contains('Submit').click();
    cy.get('li#sequence-6 li#source-5');
    cy.get('li#sequence-6').contains('9 bps');
  });
  it('applies the right constraints to blunt / partial', () => {
    // If we click on the blunt ligation option, the partial overlaps option should be disabled
    // and vice versa
    manuallyTypeSequence('aagaattcaaaagaattcaa');
    addSource('ligation');
    cy.get('#tab-panel-0 span').contains('Blunt ligation').click();
    cy.get('#tab-panel-0 span').contains('Blunt ligation').find('svg[data-testid="CheckBoxIcon"]');
    cy.get('#tab-panel-0 span').contains('Allow partial overlaps').click();
    cy.get('#tab-panel-0 span').contains('Allow partial overlaps').find('svg[data-testid="CheckBoxIcon"]');

    // Blunt ligation should be unchecked
    cy.get('#tab-panel-0 span').contains('Blunt ligation').find('svg[data-testid="CheckBoxOutlineBlankIcon"]');

    // Circular does not change the others
    cy.get('#tab-panel-0 span').contains('Circular').click();
    cy.get('#tab-panel-0 span').contains('Blunt ligation').find('svg[data-testid="CheckBoxOutlineBlankIcon"]');
    cy.get('#tab-panel-0 span').contains('Allow partial overlaps').find('svg[data-testid="CheckBoxIcon"]');
  });
  it('displays an error when ligations cannot be made', () => {
    manuallyTypeSequence('aagaattcaaaagaattcaa');
    addSource('ligation');
    cy.get('li#source-3 button').contains('Submit').click();
    cy.get('li#source-3 .MuiAlert-message');
    // same with two inputs
    cy.get('svg[data-testid="AddCircleIcon"]').last().click();
    manuallyTypeSequence('aagaattcaaaagaattcaa');
    clickMultiSelectOption('Input sequences', '5', 'li#source-3');
    cy.get('li#source-3 button').contains('Submit').click();
    cy.get('li#source-3 .MuiAlert-message');
  });
  it('displays errors when server fails', () => {
    manuallyTypeSequence('aagaattcaaaagaattcaa');
    addSource('ligation');
    cy.get('#tab-panel-0 span').contains('Blunt ligation').click();
    cy.intercept('POST', 'http://127.0.0.1:8000/ligation*', { forceNetworkError: true }).as('ligation');
    cy.get('li#source-3 button').contains('Submit').click();
    cy.get('li#source-3 .MuiAlert-message').contains('Cannot connect');
    // Internal server error
    cy.intercept('POST', 'http://127.0.0.1:8000/ligation*', { statusCode: 500 }).as('ligation2');
    cy.get('li#source-3 button').contains('Submit').click();
    cy.get('li#source-3 .MuiAlert-message').contains('Internal server error');
  });
});
