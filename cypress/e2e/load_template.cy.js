describe('Test load template functionality', () => {
  beforeEach(() => {
    cy.visit('/');
  });
  it('Can load template', () => {
    // Open the template menu
    cy.get('.MuiToolbar-root button.MuiButtonBase-root').contains('Templates').click();

    // Contains the MoClo YTK template and the submission option
    cy.get('.load-template-item').contains('MoClo YTK').should('exist');
    cy.get('.load-template-item').contains('🔎 Can\'t find your favourite kit?').should('exist');

    // Load first template
    cy.get('.MuiAccordionSummary-root').contains('MoClo YTK').click();
    cy.get('.MuiAccordionDetails-root .MuiListItemText-secondary').contains('N-term').first().click();

    // The dialog should be closed
    cy.get('.load-template-dialog').should('not.exist');

    // No error should be displayed
    cy.get('header .MuiAlert-message').should('not.exist');

    // It loads the template
    cy.get('div.cloning-tab-pannel').contains('Assembly connector', { timeout: 20000 });

    // Images are properly displayed
    cy.get('div.collection-source img').should('be.visible').and(($img) => {
      // "naturalWidth" and "naturalHeight" are set when the image loads
      expect($img[0].naturalWidth).to.be.greaterThan(0);
    });
  });
});
