describe('Actions that can be perfomed by an edit user on the Primers page', () => {
  afterEach(() => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8001/__test/reset-db',
      headers: {
        'x-test-reset-token': 'RESET-TOKEN',
      },
      failOnStatusCode: false,
    }).its('status').should('eq', 204);
  })
  it('can tag primers from the table', () => {
    cy.intercept('GET', 'http://localhost:8001/primers*').as('getPrimers');
    cy.e2eLogin('/primers', 'bootstrap@example.com', 'password');
    cy.wait('@getPrimers')
    cy.get('tbody tr').contains('test-tag').should('not.exist')
    cy.get('tbody tr input').eq(0).click();
    cy.get('tbody tr input').eq(1).click();
    cy.get('button').contains('Tag Primers').click();
    cy.setInputValue('Tags', 'test-tag', '[data-testid="tag-entities-dialog"]');
    cy.get('div[role="presentation"]').contains('Create tag').click();
    cy.clickMultiSelectOption('Tags', 'test-tag', '[data-testid="tag-entities-dialog"]');
    cy.get('[data-testid="tag-entities-dialog"] button').contains('Tag').click();
    cy.get('tbody tr').eq(0).contains('test-tag').should('exist');
    cy.get('tbody tr').eq(1).contains('test-tag').should('exist');
    cy.get('tbody tr').eq(2).contains('test-tag').should('not.exist');
  });
  it('can remove and add tags from the detail page', () => {
    cy.intercept('GET', 'http://localhost:8001/primers*').as('getPrimers');
    cy.e2eLogin('/primers', 'bootstrap@example.com', 'password');
    cy.wait('@getPrimers').then(({ response }) => {
      const primer = response.body.items.find((primer) => primer.name === 'fwd_restriction_then_ligation');
      const tagId = primer.tags[0].id;
      cy.get('tbody tr button').contains('fwd_restriction_then_ligation').click();
      cy.get('[data-testid="resource-detail-header-title"]').contains('fwd_restriction_then_ligation').should('exist');
      cy.intercept('DELETE', `http://localhost:8001/input_entity/${primer.id}/tags/${tagId}`).as('deleteTag');
      cy.get('[data-testid="tag-chip-with-delete"]').filter(':contains("templateless_PCR")').within(
        () => {
          cy.get('svg[data-testid="ClearIcon"]').click();
        }
      );
      cy.wait('@deleteTag')
      cy.get('[data-testid="tag-chip-with-delete"]').should('not.exist');
      cy.get('[data-testid="tag-chip-list"]').contains('No tags').should('exist');
      cy.get('svg[data-testid="AddIcon"]').click();
      cy.setAutocompleteValue('Tags', 'templateless_PCR', '[data-testid="tag-entities-dialog"]');
      cy.get('[data-testid="tag-entities-dialog"] button').contains('Tag').click();
      cy.get('[data-testid="tag-chip-with-delete"]').filter(':contains("templateless_PCR")').should('exist');

    });

  });
});
