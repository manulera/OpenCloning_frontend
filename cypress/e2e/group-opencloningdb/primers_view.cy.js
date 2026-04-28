describe('PrimersPage', () => {
  it('should render and make the right search request', () => {
    cy.intercept('GET', 'http://localhost:8001/primers*').as('getPrimers');
    cy.e2eLogin('/primers', 'view-only-user@example.com', 'password');
    cy.wait('@getPrimers').then(({ response, request }) => {
      expect(request.query).to.deep.equal({page: "1", size: "25"});
      cy.get('h5').contains('Primers').should('exist');
      const primers = response.body.items;
      const primerWithoutTagsNorUID = primers.find((primer) => primer.name === 'lacZ_attB1_fwd');
      cy.get('tbody tr')
        .filter(`:contains(${primerWithoutTagsNorUID.name})`)
        .should('have.length', 1)
        .first()
        .within(() => {
          cy.get('td').eq(1).should('have.text', '—');
          cy.get('td').eq(2).should('have.text', primerWithoutTagsNorUID.name);
          cy.get('td').eq(3).should('have.text', '-');
          cy.get('td').eq(4).should('have.text', primerWithoutTagsNorUID.sequence);
        });
      const primerWithTagsAndUID = primers.find((primer) => primer.name === 'fwd_restriction_then_ligation');
      cy.get('tbody tr')
        .filter(`:contains(${primerWithTagsAndUID.name})`)
        .should('have.length', 1)
        .first()
        .within(() => {
          cy.get('td').eq(1).should('have.text', primerWithTagsAndUID.uid);
          cy.get('td').eq(2).should('have.text', primerWithTagsAndUID.name);
          cy.get('td').eq(3).contains(primerWithTagsAndUID.tags[0].name).should('exist');
          cy.get('td').eq(4).should('have.text', primerWithTagsAndUID.sequence);
        });
    });
    cy.intercept('GET', 'http://localhost:8001/primers*').as('getPrimers2');
    cy.setInputValue('UID', 'ML7', '[data-testid="primers-page"]');
    cy.setInputValue('Name', 'fwd_restriction_then_ligation', '[data-testid="primers-page"]');
    cy.clickMultiSelectOption('Tags', 'templateless_PCR', '[data-testid="primers-page"]');
    cy.get('button').contains('Search').click();
    cy.wait('@getPrimers2').then(({ response, request }) => {
      cy.wrap(request.query).should('have.property', 'page', "1");
      cy.wrap(request.query).should('have.property', 'size', "25");
      cy.wrap(request.query).should('have.property', 'uid', "ML7");
      cy.wrap(request.query).should('have.property', 'name', "fwd_restriction_then_ligation");
      cy.wrap(request.query.tags).should('match', /\d+/);
    });
    // Finally a query to verify that multiple tags are working, mock since no need
    cy.intercept('GET', 'http://localhost:8001/primers*', { statusCode: 200, body: { items: [] } }).as('getPrimers3');
    cy.setAutocompleteValue('Tags', 'crispr_hdr', '[data-testid="primers-page"]');
    cy.get('button').contains('Search').click();
    cy.wait('@getPrimers3').then(({ response, request }) => {
      cy.wrap(request.query.tags).should('have.length', 2);
      cy.wrap(request.query.tags).each((tag) => {
        cy.wrap(tag).should('match', /\d+/);
      });
    });
  });
  it('should set query params from the URL', () => {
    cy.e2eLogin('/primers', 'view-only-user@example.com', 'password');
    cy.intercept('GET', 'http://localhost:8001/primers*', { statusCode: 200, body: { items: [] } }).as('getPrimers2');
    cy.visit('/primers?uid=ML7&name=fwd_restriction_then_ligation&tags=1&tags=2');

    cy.wait('@getPrimers2').then(({ response, request }) => {
      cy.wrap(request.query).should('have.property', 'uid', "ML7");
      cy.wrap(request.query).should('have.property', 'name', "fwd_restriction_then_ligation");
      cy.wrap(request.query.tags).should('have.length', 2);
    });
  });
});
