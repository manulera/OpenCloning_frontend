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
  it('can load genome coordinates', () => {
    cy.visit('/?source=genome_coordinates&sequence_accession=NC_003424.3&start=1168936&end=1173209&strand=1&assembly_accession=GCA_000002945.3');
    cy.contains('Genome region', { timeout: 10000 }).should('exist');
  });
  it('Error if server down', () => {
    cy.intercept('POST', '**/genome_coordinates', {
      forceNetworkError: true,
    });
    cy.visit('/?source=genome_coordinates&sequence_accession=NC_003424.3&start=1168936&end=1173209&strand=1&assembly_accession=GCA_000002945.3');

    cy.contains('Cannot connect to backend server', { timeout: 10000 }).should('exist');
  });
  it('Error if info missing', () => {
    cy.visit('/?source=genome_coordinates&sequence_accession=NC_003424.3&start=1168936');
    cy.contains('Error loading genome sequence from URL parameters', { timeout: 10000 }).should('exist');
  });
});
