describe('opencloningdb login', () => {
  beforeEach(() => {
    cy.task('db:reset');
    cy.visit('/login');
  });

  it('rejects wrong credentials', () => {
    cy.get('input[type="email"]').type('bootstrap@example.com');
    cy.get('input[type="password"]').type('wrong-password');
    cy.get('button[type="submit"]').click();
    cy.get('.MuiAlert-message').should('be.visible');
    cy.location('pathname').should('eq', '/login');
  });

  it('logs in the bootstrap user and lands on /sequences', () => {
    cy.get('input[type="email"]').type('bootstrap@example.com');
    cy.get('input[type="password"]').type('password');
    cy.get('button[type="submit"]').click();
    cy.location('pathname', { timeout: 10000 }).should('eq', '/sequences');
    cy.contains('Sequences').should('be.visible');
    cy.window().its('localStorage').invoke('getItem', 'token').should('not.be.null');
  });

  it('redirects anonymous visits to /login', () => {
    cy.clearLocalStorage();
    cy.visit('/sequences');
    cy.location('pathname').should('eq', '/login');
  });
});
