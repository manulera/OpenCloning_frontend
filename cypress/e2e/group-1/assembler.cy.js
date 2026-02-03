import { changeTab } from '../common_functions';

describe('Test assembler functionality', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('Can open assembler tab and load MoClo assembly', () => {
    // Navigate to the Assembler tab
    changeTab('Assembler');
    
    // Verify the assembler tab is visible by checking for the warning alert and Load Syntax button
    cy.get('.MuiAlert-root').contains('The Assembler is experimental').should('be.visible');
    cy.get('button').contains('Load Syntax').should('be.visible');
    
    // Click on Load Syntax button
    cy.get('button').contains('Load Syntax').click();
    
    // Wait for the dialog to open and load syntaxes
    cy.get('div[role="dialog"]', { timeout: 10000 }).should('be.visible');
    cy.get('div[role="dialog"]').contains('Load an existing syntax').should('be.visible');
    
    // Wait for syntaxes to load and find MoClo syntax
    cy.get('div[role="dialog"] li', { timeout: 10000 }).should('have.length.greaterThan', 0);
    cy.get('div[role="dialog"] li').contains('MoClo', { matchCase: false }).should('exist');
    
    // Click on the MoClo syntax
    cy.get('div[role="dialog"] li').contains('MoClo', { matchCase: false }).click();
    
    // Wait for the syntax to load (dialog should close and assembler component should appear)
    cy.get('div[role="dialog"]').should('not.exist');
    
    // Verify that the assembler component is now visible with the loaded syntax
    // After loading syntax, the "Add Plasmids" button should appear
    cy.get('button').contains('Add Plasmids', { timeout: 10000 }).should('be.visible');
    // Verify the assembler component is rendered by checking for the Category select
    cy.get('label').contains('Category', { timeout: 10000 }).should('be.visible');


    cy.get('[data-testid="plasmid-select"]').last().click();
    cy.get('li[role="option"]').first().click();
    cy.get('[data-testid="plasmid-select"]').last().click();
    cy.get('li[role="option"]').eq(1).click();
    
    // Select the next category and one or two plasmids for each category
    cy.get('[data-testid="category-select"]').last().click();
    cy.get('li[role="option"]').contains('2 (Promoter)').click();
    cy.get('[data-testid="plasmid-select"]').last().click();
    cy.get('li[role="option"]').first().click();
    // cy.get('[data-testid="plasmid-select"]').last().click();
    // cy.get('li[role="option"]').eq(1).click();

    cy.get('[data-testid="category-select"]').last().click();
    cy.get('li[role="option"]').contains('3').click();
    cy.get('[data-testid="plasmid-select"]').last().click();
    cy.get('li[role="option"]').first().click();
    // cy.get('[data-testid="plasmid-select"]').last().click();
    // cy.get('li[role="option"]').eq(1).click();

    cy.get('[data-testid="category-select"]').last().click();
    cy.get('li[role="option"]').contains('4').click();
    cy.get('[data-testid="plasmid-select"]').last().click();
    cy.get('li[role="option"]').first().click();
    // cy.get('[data-testid="plasmid-select"]').last().click();
    // cy.get('li[role="option"]').eq(1).click();

    cy.get('[data-testid="category-select"]').last().click();
    cy.get('li[role="option"]').contains('5').click();
    cy.get('[data-testid="plasmid-select"]').last().click();
    cy.get('li[role="option"]').first().click();
    // cy.get('[data-testid="plasmid-select"]').last().click();
    // cy.get('li[role="option"]').eq(1).click();

    cy.get('[data-testid="category-select"]').last().click();
    cy.get('li[role="option"]').contains('6').click();
    cy.get('[data-testid="plasmid-select"]').last().click();
    cy.get('li[role="option"]').first().click();
    // cy.get('[data-testid="plasmid-select"]').last().click();
    // cy.get('li[role="option"]').eq(1).click();

    cy.get('[data-testid="category-select"]').last().click();
    cy.get('li[role="option"]').contains('8').click();
    cy.get('[data-testid="plasmid-select"]').last().click();
    cy.get('li[role="option"]').first().click();
    // cy.get('[data-testid="plasmid-select"]').last().click();
    // cy.get('li[role="option"]').eq(1).click();

    cy.get('[data-testid="assembler-submit-button"]').should('not.exist');

    // Select option 6 which is missing
    cy.get('[data-testid="plasmid-select"]').eq(5).click();
    cy.get('li[role="option"]').first().click();
    cy.get('[data-testid="plasmid-select"]').eq(5).click();
    cy.get('li[role="option"]').eq(1).click();

    cy.get('[data-testid="assembler-submit-button"]').click();

    cy.get('[data-testid="assembler-product-table"]').should('be.visible');
    cy.get('[data-testid="assembler-product-table"] tr').should('have.length', 4 + 1);

    // cy.get('[data-testid="category-select"]').last().click();
    cy.get('[data-testid="assembler-product-table-view-button"]').first().click();

    // Should be in cloning tab
    cy.get('button.MuiTab-root.Mui-selected').contains('Cloning').should('exist');
    cy.get('li#sequence-9').contains('5459 bps');

    changeTab('Assembler');

    // Removing plasmids should not give an error and instead should clear all assemblies
    cy.get('button').contains('Remove uploaded plasmids').click();
    cy.get('[data-testid="assembler-submit-button"]').should('not.exist');
    cy.get('[data-testid="assembler-product-table"]').should('not.exist');

    // Should show the default first two categories now that there is no uploaded plasmids
    cy.get('[data-testid="category-select"]').contains('Assembly connector').should('be.visible');
    cy.get('[data-testid="category-select"]').contains('Promoter').should('be.visible');

  });
  it('Correctly applies constraints and auto-fills', () => {
    changeTab('Assembler');
    // Load MoClo syntax
    cy.get('button').contains('Load Syntax').click();
    cy.get('div[role="dialog"]').contains('Load an existing syntax').should('be.visible');
    cy.get('div[role="dialog"] li').contains('MoClo', { matchCase: false }).click();
    cy.get('div[role="dialog"]').should('not.exist');

    // Remove plasmids
    cy.get('button').contains('Remove uploaded plasmids').click();
    
    // Select N-term
    cy.get('[data-testid="category-select"]').last().click();
    cy.get('li[role="option"]').contains('N-term').click();

    // Category 3b should have been auto-filled
    cy.get('[data-testid="category-select"]').contains('3b').should('be.visible');

    // Select 4 (Terminator)
    cy.get('[data-testid="category-select"]').last().click();
    cy.get('li[role="option"]').contains('4 (Terminator)').click();

    // Category 7 should have been auto-filled
    cy.get('[data-testid="category-select"]').contains('Yeast plasmid').should('exist');

    // Can only remove the ones with multiple options
    cy.get('[data-testid="category-select"] input').eq(0).should('be.disabled');
    cy.get('[data-testid="category-select"] input').eq(1).should('be.disabled');

    // Removing it removes previous options
    cy.get('[data-testid="category-select"] [data-testid="ClearIcon"]').first().click( { force: true } );
    cy.get('[data-testid="category-select"]').should('have.length', 3);
  })

});
