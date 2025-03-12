describe('Test load from URL', () => {
  it('can load example', () => {
    cy.visit('/?source=example&example=gibson_assembly.json');
    cy.contains('Gibson assembly of fragments', { timeout: 10000 }).should('exist');
  });
  it('displays error if example does not exist', () => {
    cy.visit('/?source=example&example=nonexistent.json');
    cy.contains('Error loading example', { timeout: 10000 }).should('exist');
  });
  it('no error if example is not provided', () => {
    cy.visit('/?source=example');
    cy.get('.MuiAlert-message', { timeout: 10000 }).should('not.exist');
  });
  it('can load template', () => {
    cy.visit('/?source=template&key=kits-moclo-ytk&template=assembly_template_001.json');
    cy.contains('You can use the ATG', { timeout: 10000 }).should('exist');
  });
});
