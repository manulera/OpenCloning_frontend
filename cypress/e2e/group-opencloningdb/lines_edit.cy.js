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
});
