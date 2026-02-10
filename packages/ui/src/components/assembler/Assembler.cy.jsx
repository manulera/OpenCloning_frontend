/* eslint-disable camelcase */
import React from 'react';
import { ConfigProvider } from '@opencloning/ui/providers/ConfigProvider';
import { AssemblerComponent } from './Assembler';
import mocloSyntax from '../../../../../cypress/test_files/syntax/moclo_syntax.json';

mocloSyntax.overhangNames = {
  ...mocloSyntax.overhangNames,
  CCCT: 'CCCT_overhang',
  AACG: 'AACG_overhang',
};

// Test config
const testConfig = {
  backendUrl: 'http://localhost:8000',
  showAppBar: false,
  noExternalRequests: false,
  enableAssembler: true,
  enablePlannotate: false,
};

const dummyResponse = {
  sources: [
    {
      id: 1,
      type: "ManuallyTypedSource",
      output_name: null,
      database_id: null,
      input: []
    }
  ],
  sequences: [
    {
      id: 1,
      type: "TextFileSequence",
      sequence_file_format: "genbank",
      overhang_crick_3prime: 0,
      overhang_watson_3prime: 0,
      file_content: "LOCUS       name                       5 bp    DNA     linear   UNK 01-JAN-1980\nDEFINITION  description.\nACCESSION   id\nVERSION     id\nKEYWORDS    .\nSOURCE      .\n  ORGANISM  .\n            .\nFEATURES             Location/Qualifiers\nORIGIN\n        1 aaaaa\n//"
    }
  ]
}

// Test data
const mockPlasmids = [
  {
    id: 1,
    plasmid_name: 'Test Plasmid 1',
    left_overhang: 'CCCT',
    right_overhang: 'AACG',
    key: 'CCCT-AACG',
    type: 'AddgeneIdSource',
    source: {
      id: 1,
      type: 'AddgeneIdSource',
      input: [],
      repository_id: '12345',
    },
  },
  {
    id: 2,
    plasmid_name: 'Test Plasmid 2',
    left_overhang: 'AACG',
    right_overhang: 'CCCT',
    key: 'AACG-CCCT',
    type: 'AddgeneIdSource',
    source: {
      id: 2,
      type: 'AddgeneIdSource',
      input: [],
      repository_id: '67890',
    },
  },
];

const mockCategories = [
  {
    id: 1,
    displayName: 'Category 1',
    left_overhang: 'CCCT',
    right_overhang: 'AACG',
    key: 'CCCT-AACG',
  },
  {
    id: 2,
    displayName: 'Category 2',
    left_overhang: 'AACG',
    right_overhang: 'CCCT',
    key: 'AACG-CCCT',
  },
];

describe('<AssemblerComponent />', () => {
  beforeEach(() => {
    // Set up a complete assembly for testing
    cy.window().then((win) => {
      // Ensure we have a clean state
      win.localStorage.clear();
    });

    cy.mount(
      <ConfigProvider config={testConfig}>
        <AssemblerComponent
          plasmids={mockPlasmids}
          categories={mockCategories}
        />
      </ConfigProvider>,
    );
    // Select first plasmid
    cy.get('[data-testid="plasmid-select"]').first().within(() => {
      cy.get('input').click();
    });
    cy.get('li').contains('Test Plasmid 1').click();
  
    // Select second plasmid
    cy.get('[data-testid="plasmid-select"]').eq(1).within(() => {
      cy.get('input').click();
    });
    cy.get('li').contains('Test Plasmid 2').click();
  });

  it('displays error when fetching sequence for a plasmid fails', () => {
    // Intercept the requestSources call (POST to addgene endpoint)
    cy.intercept('POST', 'http://localhost:8000/repository_id*', {
      statusCode: 500,
      body: {
        detail: 'Failed to fetch plasmid sequence',
      },
    }).as('fetchPlasmidError');

    // Click submit button
    cy.get('[data-testid="assembler-submit-button"]').should('be.visible').click();

    // Wait for the error request
    cy.wait('@fetchPlasmidError');

    // Check that error message is displayed
    cy.get('.MuiAlert-colorError').should('exist');
    cy.contains('Error fetching sequence for').should('exist');
    cy.contains('Test Plasmid 1').should('exist');
  });

  it('displays error when assembling sequences fails', () => {
    // Mock successful source fetching
    cy.intercept('POST', 'http://localhost:8000/repository_id*', {
      statusCode: 200,
      body: dummyResponse,
    }).as('fetchSourceSuccess');

    // Mock failed assembly request
    cy.intercept('POST', 'http://localhost:8000/restriction_and_ligation*', {
      statusCode: 500,
      body: {
        detail: 'Failed to assemble sequences',
      },
    }).as('assemblyError');

    // Click submit button
    cy.get('[data-testid="assembler-submit-button"]').should('be.visible').click();

    // Wait for both requests
    cy.wait('@fetchSourceSuccess');
    cy.wait('@assemblyError');

    // Check that error message is displayed
    cy.get('.MuiAlert-colorError').should('exist');
    cy.contains('Error assembling').should('exist');
    cy.contains('Test Plasmid 1').should('exist');
    cy.contains('Test Plasmid 2').should('exist');
  });

  it('displays network error message correctly', () => {
    // Intercept with network error
    cy.intercept('POST', 'http://localhost:8000/repository_id*', {
      forceNetworkError: true,
    }).as('networkError');

    // Click submit button
    cy.get('[data-testid="assembler-submit-button"]').should('be.visible').click();

    // Wait for the error request
    cy.wait('@networkError');

    // Check that error message is displayed
    cy.get('.MuiAlert-colorError').should('exist');
    cy.contains('Error fetching sequence for').should('exist');
  });

  it('clears error message when assembly selection is cleared', () => {
    // Intercept with error
    cy.intercept('POST', 'http://localhost:8000/repository_id*', {
      statusCode: 500,
      body: {
        detail: 'Failed to fetch plasmid sequence',
      },
    }).as('fetchPlasmidError');


    // Click submit button to trigger error
    cy.get('[data-testid="assembler-submit-button"]').should('be.visible').click();
    cy.wait('@fetchPlasmidError');

    // Verify error is displayed
    cy.get('.MuiAlert-colorError').should('exist');

    // Clear the assembly by clicking the clear button in the first category select
    cy.get('[data-testid="CancelIcon"]').first().click({ force: true });

    // Error should be cleared
    cy.get('.MuiAlert-colorError').should('not.exist');
  });
  it('works in normal case', () => {
    // Mock successful source fetching
    cy.intercept('POST', 'http://localhost:8000/repository_id*', {
      statusCode: 200,
      body: dummyResponse,
    }).as('fetchSourceSuccess');
    // Mock assembly request
    cy.intercept('POST', 'http://localhost:8000/restriction_and_ligation*', {
      statusCode: 200,
      body: dummyResponse,
    }).as('assemblySuccess');

    // Click submit button
    cy.get('[data-testid="assembler-submit-button"]').should('be.visible').click();
    cy.wait('@fetchSourceSuccess');

    // Check that the table displays the name
    cy.get('[data-testid="assembler-product-table"]').contains('Category 1').should('exist');
    cy.get('[data-testid="assembler-product-table"]').contains('Category 2').should('exist');
    cy.get('[data-testid="assembler-product-table"]').contains('Test Plasmid 1').should('exist');
    cy.get('[data-testid="assembler-product-table"]').contains('Test Plasmid 2').should('exist');
  });
});

