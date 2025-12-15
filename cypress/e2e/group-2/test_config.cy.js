import { manuallyTypeSequence } from "../common_functions";
import defaultConfig from '../../../apps/opencloning/public/config.dev.json';


describe('test that configuration works', () => {

  it('Annotation source is not available if enablePlannotate is false', () => {
    // Intercept config.json request and modify enablePlannotate to false
    cy.intercept('GET', '**/config.json', (req) => {
      req.reply({ statusCode: 200, body: {...defaultConfig, enablePlannotate: false}});
    }).as('configRequest');

    cy.visit('/');
    cy.wait('@configRequest');

    manuallyTypeSequence('atata');
    cy.get('svg[data-testid="AddCircleIcon"]', { timeout: 20000 }).first().click();
    cy.get('li#source-2 .MuiInputBase-root').click();
    cy.get('li[data-value="AnnotationSource"]').should('not.exist');
    cy.get('li[data-value="RestrictionEnzymeDigestionSource"]').should('exist');
  });
  it('Annotation source is available if enablePlannotate is true', () => {
    // Intercept config.json request and modify enablePlannotate to true
    cy.intercept('GET', '**/config.json', (req) => {
      req.reply({ statusCode: 200, body: {...defaultConfig, enablePlannotate: true}});
    }).as('configRequest');
  
    cy.visit('/');
    cy.wait('@configRequest');

    manuallyTypeSequence('atata');
    cy.get('svg[data-testid="AddCircleIcon"]', { timeout: 20000 }).first().click();
    cy.get('li#source-2 .MuiInputBase-root').click();
    cy.get('li[data-value="AnnotationSource"]').should('exist');
  });
  it('Assembler is not available if enableAssembler is false', () => {
    // Intercept config.json request and modify enableAssembler to false
    cy.intercept('GET', '**/config.json', (req) => {
      req.reply({ statusCode: 200, body: {...defaultConfig, enableAssembler: false}});
    }).as('configRequest');

    cy.visit('/');
    cy.wait('@configRequest');

    // Wait for the app to finish loading
    cy.get('.loading-state-message', { timeout: 10000 }).should('not.exist');

    // Check that the assembler tab is not present
    cy.get('.MuiTabs-root').contains('Assembler').should('not.exist');
  });

  it('Assembler is available if enableAssembler is true', () => {
    // Intercept config.json request and modify enableAssembler to true
    cy.intercept('GET', '**/config.json', (req) => {
      req.reply({ statusCode: 200, body: {...defaultConfig, enableAssembler: true}});
    }).as('configRequest');
    cy.visit('/');
    cy.wait('@configRequest');

    // Check that the assembler tab is present
    cy.get('.MuiTabs-root').contains('Assembler').should('exist');
  });

});

