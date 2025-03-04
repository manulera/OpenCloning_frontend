describe('Test load from URL', () => {
  it('can load example', () => {
    cy.visit('/?source=example&example=gibson_assembly.json');
    cy.contains('Gibson assembly of fragments').should('exist');
  });
  it('displays error if example does not exist', () => {
    cy.visit('/?source=example&example=nonexistent.json');
    cy.contains('Error loading example').should('exist');
  });
  it('no error if example is not provided', () => {
    cy.visit('/?source=example');
    cy.get('.MuiAlert-message').should('not.exist');
  });
});
