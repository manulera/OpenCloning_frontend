describe('SequencesPage', () => {
  it('should render and make the right search request', () => {
    cy.intercept('GET', 'http://localhost:8001/sequences*').as('getSequences');
    cy.e2eLogin('/sequences', 'view-only-user@example.com', 'password');
    cy.wait('@getSequences').then(({ response, request }) => {
      expect(request.query).to.deep.equal({ page: '1', size: '25' });
      cy.get('h5').contains('Sequences').should('exist');

      const sequences = response.body.items;
      const exampleSequence = sequences.find((sequence) => sequence.name === 'pREX0008');

      expect(exampleSequence).to.exist;
      expect(exampleSequence.sample_uids).to.deep.equal(['example_sequencing-sample']);
      expect(exampleSequence.sequence_type).to.equal('plasmid');
      expect(exampleSequence.tags.map((tag) => tag.name)).to.include('example_sequencing');

      cy.get('tbody tr')
        .filter(`:contains(${exampleSequence.name})`)
        .should('have.length', 1)
        .first()
        .within(() => {
          cy.get('td').eq(1).should('contain', 'example_sequencing-sample');
          cy.get('td').eq(2).should('contain', exampleSequence.name);
          cy.get('td').eq(3).should('contain', 'Plasmid');
          cy.get('td').eq(4).contains('example_sequencing').should('exist');
        });
    });

    cy.intercept('GET', 'http://localhost:8001/sequences*').as('getSequences2');
    cy.setInputValue('UID', 'example_sequencing-sample', '[data-testid="sequences-page"]');
    cy.setInputValue('Name', 'pREX0008', '[data-testid="sequences-page"]');
    cy.clickMultiSelectOption('Type', 'Plasmid', '[data-testid="sequences-page"]');
    cy.clickMultiSelectOption('Tags', 'example_sequencing', '[data-testid="sequences-page"]');
    cy.get('[data-testid="sequences-page"] button').contains('Search').click();
    cy.wait('@getSequences2').then(({ response, request }) => {
      cy.wrap(request.query).should('have.property', 'page', '1');
      cy.wrap(request.query).should('have.property', 'size', '25');
      cy.wrap(request.query).should('have.property', 'uid', 'example_sequencing-sample');
      cy.wrap(request.query).should('have.property', 'name', 'pREX0008');
      cy.wrap(request.query).should('have.property', 'sequence_types', 'plasmid');
      cy.wrap(request.query.tags).should('match', /\d+/);

      const filteredSequences = response.body.items;
      expect(filteredSequences).to.have.length(1);
      expect(filteredSequences[0].name).to.equal('pREX0008');

      cy.get('tbody tr')
        .should('have.length', 1)
        .first()
        .within(() => {
          cy.get('td').eq(1).should('contain', 'example_sequencing-sample');
          cy.get('td').eq(2).should('contain', 'pREX0008');
          cy.get('td').eq(3).should('contain', 'Plasmid');
          cy.get('td').eq(4).contains('example_sequencing').should('exist');
        });
    });

    cy.intercept('GET', 'http://localhost:8001/sequences*').as('getSequences3');
    cy.get('[data-testid="sequences-page"] label').contains('With UID').parent().find('input').click({ force: true });
    cy.get('[data-testid="sequences-page"] button').contains('Search').click();
    cy.wait('@getSequences3').then(({ request }) => {
      cy.wrap(request.query).should('have.property', 'has_uid', 'true');
      cy.wrap(request.query).should('have.property', 'uid', 'example_sequencing-sample');
      cy.wrap(request.query).should('have.property', 'name', 'pREX0008');
      cy.wrap(request.query).should('have.property', 'sequence_types', 'plasmid');
      cy.wrap(request.query.tags).should('match', /\d+/);
    });
  });

  it('should set query params from the URL', () => {
    cy.e2eLogin('/sequences', 'view-only-user@example.com', 'password');
    cy.intercept('GET', 'http://localhost:8001/sequences*').as('getSequences');
    cy.visit('/sequences?uid=example_sequencing-sample&name=pREX0008&sequence_types=plasmid&tags=1&has_uid=true');
    cy.wait('@getSequences').then(({ request }) => {
      cy.wrap(request.query).should('have.property', 'uid', 'example_sequencing-sample');
      cy.wrap(request.query).should('have.property', 'name', 'pREX0008');
      cy.wrap(request.query).should('have.property', 'sequence_types', 'plasmid');
      cy.wrap(request.query).should('have.property', 'has_uid', 'true');
      cy.wrap(request.query.tags).should('match', /\d+/);
    });
  });
});
