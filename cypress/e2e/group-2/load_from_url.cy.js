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
  it('can load from locus tag', () => {
    // Without padding
    cy.visit('/?source=locus_tag&assembly_accession=GCA_000002945.3&locus_tag=SPNCRNA.1715');
    cy.get('.finished-source').contains('Genome region', { timeout: 10000 }).should('exist');
    cy.get('.finished-source').contains('1306681:1309359').should('exist');
    // With padding
    cy.visit('/?source=locus_tag&assembly_accession=GCA_000002945.3&locus_tag=SPNCRNA.1715&padding=1200');
    cy.get('.finished-source').contains('Genome region', { timeout: 10000 }).should('exist');
    cy.get('.finished-source').contains('1306481:1309559').should('exist');

    // Handles error if locus tag or assembly accession is wrong and can retry
    cy.intercept('GET','https://api.ncbi.nlm.nih.gov/datasets/v2alpha/genome/accession/GCA_000002945.3/annotation_report?search_text=SPNCRNA.1715', {
      statusCode: 404,
      body: 'Not Found'
    }).as('getAnnotationReport1');
    cy.visit('/?source=locus_tag&assembly_accession=GCA_000002945.3&locus_tag=SPNCRNA.1715');
    cy.wait('@getAnnotationReport1');
    cy.contains('Could not retrieve genome sequence').should('exist');
    cy.intercept('GET','https://api.ncbi.nlm.nih.gov/datasets/v2alpha/genome/accession/GCA_000002945.3/annotation_report?search_text=SPNCRNA.1715').as('getAnnotationReport2');
    cy.get('button').contains('Retry').click();
    cy.wait('@getAnnotationReport2');
    cy.contains('Could not retrieve genome sequence').should('exist');

  });
});
