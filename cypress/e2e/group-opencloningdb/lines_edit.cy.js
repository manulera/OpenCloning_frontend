describe('Actions that can be perfomed by an edit user on the Lines page', () => {
  afterEach(() => {
    cy.resetDB();
  })
  it('can tag lines from the table', () => {
    cy.addTagInTableTest('lines');
  });
  it('can remove and add tags from the detail page', () => {
    cy.addTagInDetailPageTest('lines', 'crispr_hdr-line', 'crispr_hdr');
  });
  it('can rename a line', () => {
    cy.e2eLogin('/lines', 'bootstrap@example.com', 'password');
    cy.get('tbody tr').contains('crispr_hdr-line').click();
    cy.get('[data-testid="resource-detail-header-title"]').contains('crispr_hdr-line').should('exist');
    cy.get('[aria-label="Edit line UID"]').click();
    cy.setInputValue('Line UID', 'crispr_hdr-line-new');
    cy.get('button').contains('Save').click();
    cy.dbAlertExists('Line UID updated successfully');
    cy.closeDbAlerts();
    cy.get('[data-testid="resource-detail-header-title"]').contains('crispr_hdr-line-new').should('exist');
  });
  it('can delete a line that has no children', () => {
    cy.e2eLogin('/lines', 'bootstrap@example.com', 'password');
    cy.get('tbody tr').contains('crispr_hdr-line').click();
    cy.get('[data-testid="resource-detail-header-title"]').contains('crispr_hdr-line').should('exist');
    cy.get('button').contains('Delete line').click();
    cy.get('button').contains('Confirm delete').click();
    cy.dbAlertExists('Line deleted successfully');
    cy.closeDbAlerts();
    // Verify we are redirected to the lines list page after deletion
    cy.url().should('match', /\/lines$/);
    // Check that the deleted line no longer appears in the table
    cy.get('tbody').should('not.contain', 'crispr_hdr-line');
  });
  it('cannot delete a line that has children', () => {
    cy.e2eLogin('/lines', 'bootstrap@example.com', 'password');
    cy.get('tbody tr').contains('parent_strain').click();
    cy.get('[data-testid="resource-detail-header-title"]').contains('parent_strain').should('exist');
    cy.get('button').contains('Delete line').should('be.disabled');
  });
});
