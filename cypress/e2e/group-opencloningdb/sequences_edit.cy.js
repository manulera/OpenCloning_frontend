describe('Actions that can be perfomed by an edit user on the Sequences page', () => {
  afterEach(() => {
    cy.resetDB();
  })
  it('can tag sequences from the table', () => {
    cy.addTagInTableTest('sequences');
  });
  it('can remove and add tags from the detail page', () => {
    cy.addTagInDetailPageTest('sequences', 'pREX0008', 'example_sequencing');
  });
});
