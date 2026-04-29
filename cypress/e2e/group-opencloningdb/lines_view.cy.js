describe('LinesPage', () => {
  it('should render and make the right search request', () => {
    cy.intercept('GET', 'http://localhost:8001/lines*').as('getLines');
    cy.e2eLogin('/lines', 'view-only-user@example.com', 'password');
    cy.wait('@getLines').then(({ response, request }) => {
      expect(request.query).to.deep.equal({ page: '1', size: '25' });
      cy.get('h5').contains('Lines').should('exist');

      const lines = response.body.items;
      const exampleLine = lines.find((line) => line.uid === 'crispr_hdr-line');

      expect(exampleLine).to.exist;
      const alleleNames = exampleLine.sequences_in_line
        .filter((sequence) => sequence.sequence_type === 'allele')
        .map((sequence) => sequence.name);
      const plasmidNames = exampleLine.sequences_in_line
        .filter((sequence) => sequence.sequence_type === 'plasmid')
        .map((sequence) => sequence.name);

      expect(alleleNames).to.include('3xHA-ase1');
      expect(plasmidNames).to.include('pFA6a-3HA-kanMX6');
      expect(exampleLine.tags.map((tag) => tag.name)).to.include('crispr_hdr');

      cy.get('tbody tr')
        .filter(`:contains(${exampleLine.uid})`)
        .should('have.length', 1)
        .first()
        .within(() => {
          cy.get('td').eq(1).should('contain', exampleLine.uid);
          cy.get('td').eq(2).should('contain', '3xHA-ase1');
          cy.get('td').eq(3).should('contain', 'pFA6a-3HA-kanMX6');
          cy.get('td').eq(4).contains('crispr_hdr').should('exist');
        });
    });

    cy.intercept('GET', 'http://localhost:8001/lines*').as('getLines2');
    cy.setInputValue('UID', 'crispr_hdr-line', '[data-testid="lines-page"]');
    cy.setInputValue('Genotype', '3xHA-ase1', '[data-testid="lines-page"]');
    cy.setInputValue('Plasmid', 'pFA6a-3HA-kanMX6', '[data-testid="lines-page"]');
    cy.clickMultiSelectOption('Tags', 'crispr_hdr', '[data-testid="lines-page"]');
    cy.get('[data-testid="lines-page"] button').contains('Search').click();
    cy.wait('@getLines2').then(({ response, request }) => {
      cy.wrap(request.query).should('have.property', 'page', '1');
      cy.wrap(request.query).should('have.property', 'size', '25');
      cy.wrap(request.query).should('have.property', 'uid', 'crispr_hdr-line');
      cy.wrap(request.query).should('have.property', 'genotype', '3xHA-ase1');
      cy.wrap(request.query).should('have.property', 'plasmid', 'pFA6a-3HA-kanMX6');
      cy.wrap(request.query.tags).should('match', /\d+/);

      const filteredLines = response.body.items;
      expect(filteredLines).to.have.length(1);
      expect(filteredLines[0].uid).to.equal('crispr_hdr-line');

      cy.get('tbody tr')
        .should('have.length', 1)
        .first()
        .within(() => {
          cy.get('td').eq(1).should('contain', 'crispr_hdr-line');
          cy.get('td').eq(2).should('contain', '3xHA-ase1');
          cy.get('td').eq(3).should('contain', 'pFA6a-3HA-kanMX6');
          cy.get('td').eq(4).contains('crispr_hdr').should('exist');
        });
    });
  });

  it('should set query params from the URL', () => {
    cy.e2eLogin('/lines', 'view-only-user@example.com', 'password');
    cy.intercept('GET', 'http://localhost:8001/lines*', { statusCode: 200, body: { items: [] } }).as('getLines');
    cy.visit('/lines?uid=crispr_hdr-line&genotype=3xHA-ase1&plasmid=pFA6a-3HA-kanMX6&tags=4');
    cy.wait('@getLines').then(({ request }) => {
      cy.wrap(request.query).should('have.property', 'uid', 'crispr_hdr-line');
      cy.wrap(request.query).should('have.property', 'genotype', '3xHA-ase1');
      cy.wrap(request.query).should('have.property', 'plasmid', 'pFA6a-3HA-kanMX6');
      cy.wrap(request.query).should('have.property', 'tags', '4');
    });
  });

  it('clicking on entry shows the detail page', () => {
    cy.intercept('GET', 'http://localhost:8001/lines*').as('getLines');
    cy.e2eLogin('/lines', 'view-only-user@example.com', 'password');
    cy.wait('@getLines').then(({ response }) => {
      const line = response.body.items.find((item) => item.uid === 'crispr_hdr-line');
      cy.intercept('GET', `http://localhost:8001/line/${line.id}`).as('getLineDetail');
      cy.intercept('GET', `http://localhost:8001/line/${line.parent_ids[0]}`).as('getParentLine');

      cy.get('tbody button').contains(line.uid).click();
      cy.wait('@getLineDetail');
      cy.wait('@getParentLine');

      cy.get('[data-testid="resource-detail-header-title"] h5').contains(line.uid).should('exist');
      cy.get('[data-testid="tag-chip-with-delete"]').contains('crispr_hdr').should('exist');
      cy.get('[data-testid="line-genotype"]').contains('3xHA-ase1').should('exist');
      cy.get('[data-testid="line-plasmids"]').contains('pFA6a-3HA-kanMX6').should('exist');
      cy.get('[data-testid="line-parent-lines"]').contains('parent_strain').should('exist');
      cy.get('button').contains('Transformation').should('exist');
      cy.get('button').contains('parent_strain').click();
      cy.get('[data-testid="resource-detail-header-title"] h5').contains('parent_strain', { timeout: 20000 }).should('exist');
      cy.get('p').contains('No genotype, plasmids, or parents for this line.').should('exist');
    });
  });

  it('TODO: add the second primer-parity line case when lines can be added to the design tab', () => {
    // Placeholder requested by the user: Lines currently have no Add to Design Tab flow on the list or detail page.
  });
});
