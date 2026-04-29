describe('Actions that can be perfomed by an edit user on the Primers page', () => {
  afterEach(() => {
    cy.resetDB();
  })
  it('can tag primers from the table', () => {
    cy.addTagInTableTest('primers');
  });
  it('can remove and add tags from the detail page', () => {
    cy.addTagInDetailPageTest('primers', 'fwd_restriction_then_ligation', 'templateless_PCR');
  });
  it('can add primers from the design tab', () => {
    cy.e2eLogin('/design', 'bootstrap@example.com', 'password');
    cy.addPrimer('test_primer', 'AACCCCTTTGGG').then(() => {
      cy.get('.primer-table-container').contains('test_primer').should('exist');
      cy.intercept('POST', 'http://localhost:8001/primer').as('addPrimer');
      cy.changeTab('Primers', '#opencloning-app-tabs');
      cy.get('.primer-table-container [data-testid="SaveIcon"]').click();
      cy.get('[data-testid="submit-to-database-component"]').within(() => {
        cy.get('input#resource_title').should('have.value', 'test_primer');
        cy.contains('To change the primer name').should('exist');
        cy.get('button').contains('Submit').click();
      });
      cy.wait('@addPrimer');
      cy.get('.primer-table-container').contains('test_primer').should('exist');
      cy.changeTab('Primers', '[data-testid="opencloningdb-app-tabs"]');
      cy.get('[data-testid="primers-page"] tbody tr').last().within(() => {
        cy.get('td').contains('test_primer').should('exist');
        cy.get('td').contains('AACCCCTTTGGG').should('exist');
      });
      

    });
  });
});
