import React from 'react';
import App from './App';
import { setInputValue } from '../../../cypress/e2e/common_functions';

describe('App', () => {
  it('Works correctly to define overhangs', () => {
    cy.mount(<App />);
    cy.viewport(1200, 900);

    // Initially, StartingPage should be displayed
    cy.contains('How would you like to start?').should('be.visible');

    // Click on "Defining parts from overhangs" option
    cy.contains('Defining parts from overhangs').click();
    cy.get('[data-testid="overhangs-step"]').should('be.visible');
    cy.get('[data-testid="overhangs-step"] textarea').first().focus().clear();
    cy.get('[data-testid="overhangs-step"] textarea').first().focus().type('CCCT\nCGCT\nCCCT\n\nCGCT\nCACA\nCCCT', { delay: 0 });

    // The first element of the overhangs preview table should be the first overhang
    cy.get('[data-testid="overhangs-step-container"] [data-testid="overhangs-preview-table"] tr').first().find('td').should('have.length', 3)
    cy.get('[data-testid="overhangs-step-container"] [data-testid="overhangs-preview-table"] tr').first().find('td').eq(0).find('h6').should('have.text', '1');
    cy.get('[data-testid="overhangs-step-container"] [data-testid="overhangs-preview-table"] tr').first().find('td').eq(1).find('h6').should('have.text', '3');
    cy.get('[data-testid="overhangs-step-container"] [data-testid="overhangs-preview-table"] tr').first().find('td').eq(2).find('h6').should('have.text', '4');

    cy.get('[data-testid="overhangs-step-container"] [data-testid="overhangs-preview-table"] tr').eq(1).find('td').should('have.length', 2)
    cy.get('[data-testid="overhangs-step-container"] [data-testid="overhangs-preview-table"] tr').eq(1).find('td').eq(0).find('h6').should('have.text', '1');
    cy.get('[data-testid="overhangs-step-container"] [data-testid="overhangs-preview-table"] tr').eq(1).find('td').eq(1).find('h6').should('have.text', '2');

    cy.get('[data-testid="overhangs-step-container"] button').contains('Next').click();

    cy.get('[data-testid="design-form"]').should('be.visible');
  });
});
