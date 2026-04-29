Cypress.Commands.add('addTagInTableTest', (resourcePlural) => {
  cy.intercept('GET', `http://localhost:8001/${resourcePlural}*`).as('getRequest');
  cy.e2eLogin(`/${resourcePlural}`, 'bootstrap@example.com', 'password');
  cy.wait('@getRequest')
  cy.get('tbody tr').contains('test-tag').should('not.exist')
  cy.get('tbody tr input').eq(0).click();
  cy.get('tbody tr input').eq(1).click();
  cy.get('button').contains(`Tag ${resourcePlural}`, { matchCase: false }).click();
  cy.setInputValue('Tags', 'test-tag', '[data-testid="tag-entities-dialog"]');
  cy.get('div[role="presentation"]').contains('Create tag').click();
  cy.clickMultiSelectOption('Tags', 'test-tag', '[data-testid="tag-entities-dialog"]');
  cy.get('[data-testid="tag-entities-dialog"] button').contains('Tag').click();
  cy.get('tbody tr').eq(0).contains('test-tag').should('exist');
  cy.get('tbody tr').eq(1).contains('test-tag').should('exist');
  cy.get('tbody tr').eq(2).contains('test-tag').should('not.exist');
});

Cypress.Commands.add('addTagInDetailPageTest', (resourcePlural, resourceName, expectedTagName) => {
  cy.intercept('GET', `http://localhost:8001/${resourcePlural}*`).as('getRequest');
  cy.e2eLogin(`/${resourcePlural}`, 'bootstrap@example.com', 'password');
  cy.wait('@getRequest').then(({ response }) => {
    console.log(response.body.items);
    const resource = response.body.items.find((resource) => resource.name === resourceName || resource.uid === resourceName);
    const tagId = resource.tags[0].id;
    cy.get('tbody tr button').contains(resourceName).click();
    cy.get('[data-testid="resource-detail-header-title"]').contains(resourceName).should('exist');
    cy.intercept('DELETE', `http://localhost:8001/*/${resource.id}/tags/${tagId}`).as('deleteTag');
    cy.get('[data-testid="tag-chip-with-delete"]').filter(`:contains(${expectedTagName})`).within(
      () => {
        cy.get('svg[data-testid="ClearIcon"]').click();
      }
    );
    cy.wait('@deleteTag')
    cy.get('[data-testid="tag-chip-with-delete"]').should('not.exist');
    cy.get('[data-testid="tag-chip-list"]').contains('No tags').should('exist');
    cy.get('svg[data-testid="AddIcon"]').click();
    cy.setAutocompleteValue('Tags', expectedTagName, '[data-testid="tag-entities-dialog"]');
    cy.get('[data-testid="tag-entities-dialog"] button').contains('Tag').click();
    cy.get('[data-testid="tag-chip-with-delete"]').filter(`:contains(${expectedTagName})`).should('exist');

  });
});
