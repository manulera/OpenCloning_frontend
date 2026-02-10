/* eslint-disable camelcase */
import React from 'react';
import { ConfigProvider } from '@opencloning/ui/providers/ConfigProvider';
import { AssemblerComponent, UploadPlasmidsButton } from './Assembler';
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

describe('<UploadPlasmidsButton />', () => {
  beforeEach(() => {
    cy.window().then((win) => {
      win.localStorage.clear();
    });
  });

  it('calls addPlasmids with correctly formatted valid plasmid', () => {
    const addPlasmidsSpy = cy.spy().as('addPlasmidsSpy');

    cy.mount(
      <ConfigProvider config={testConfig}>
        <UploadPlasmidsButton addPlasmids={addPlasmidsSpy} syntax={mocloSyntax} />
      </ConfigProvider>,
    );

    cy.get('button').contains('Add Plasmids').siblings('input').selectFile([
      'cypress/test_files/syntax/pYTK002.gb',
      'cypress/test_files/syntax/moclo_ytk_multi_part.gb',
      'cypress/test_files/syntax/pYTK095.gb',
      'cypress/test_files/sequencing/locus.gb',
      // This one just to verify that it works with no features
      'cypress/test_files/syntax/pYTK002_no_features.gb'
    ],
    { force: true });

    // Wait for the dialog to appear (indicating plasmids were processed)
    cy.get('.MuiDialog-root', { timeout: 10000 }).should('be.visible');

    cy.get('@addPlasmidsSpy').should('not.have.been.called');

    cy.get('[data-testid="invalid-plasmids-box"]').contains('Invalid Plasmids').should('exist');
    cy.get('[data-testid="valid-plasmids-box"]').contains('Valid Plasmids').should('exist');

    cy.get('[data-testid="invalid-plasmids-box"]').contains('pYTK057')
    cy.get('[data-testid="invalid-plasmids-box"]').contains('moclo_ytk_multi_part.gb')
    cy.get('[data-testid="invalid-plasmids-box"] .MuiChip-label').contains('ATCC-TGGC')
    cy.get('[data-testid="invalid-plasmids-box"] .MuiChip-label').contains('CCCT-AACG (CCCT_overhang-AACG_overhang)')
    cy.get('[data-testid="invalid-plasmids-box"]').contains('Contains multiple parts')
    cy.get('[data-testid="invalid-plasmids-box"]').contains('locus.gb')

    cy.get('[data-testid="valid-plasmids-box"] tr').eq(1).find('td').eq(0).should('contain', 'pYTK002')
    cy.get('[data-testid="valid-plasmids-box"] tr').eq(1).find('td').eq(1).should('contain', 'pYTK002.gb')
    cy.get('[data-testid="valid-plasmids-box"] tr').eq(1).find('td').eq(2).should('contain', 'CCCT-AACG (CCCT_overhang-AACG_overhang)')
    cy.get('[data-testid="valid-plasmids-box"] tr').eq(1).find('td').eq(3).should('contain', '1')
    cy.get('[data-testid="valid-plasmids-box"] tr').eq(1).find('td').eq(4).should('contain', 'ConS')
    cy.get('[data-testid="valid-plasmids-box"] tr').eq(1).then(($el) => {
      const bgColor = window.getComputedStyle($el[0]).backgroundColor;
      cy.wrap(bgColor).should('equal', 'rgb(132, 197, 222)');
    });

    cy.get('[data-testid="valid-plasmids-box"] tr').eq(2).find('td').eq(0).should('contain', 'pYTK095')
    cy.get('[data-testid="valid-plasmids-box"] tr').eq(2).find('td').eq(1).should('contain', 'pYTK095.gb')
    cy.get('[data-testid="valid-plasmids-box"] tr').eq(2).find('td').eq(2).should('contain', 'TACA-CCCT (TACA-CCCT_overhang)')
    cy.get('[data-testid="valid-plasmids-box"] tr').eq(2).find('td').eq(3).should('contain', 'Spans multiple parts')
    cy.get('[data-testid="valid-plasmids-box"] tr').eq(2).find('td').eq(4).should('contain', 'AmpR')

    // No features
    cy.get('[data-testid="valid-plasmids-box"] tr').eq(3).find('td').eq(4).should('contain', '-');

    // Click the import button
    cy.contains('button', 'Import valid plasmids').click();

    // Verify addPlasmids was called
    cy.get('@addPlasmidsSpy').should('have.been.called');

    // Verify it was called with an array and check structure
    cy.get('@addPlasmidsSpy').then((spy) => {
      const firstCall = spy.getCall(0);
      cy.wrap(firstCall.args[0]).should('be.an', 'array');
      cy.wrap(firstCall.args[0]).should('have.length', 3);

      const firstPlasmid = firstCall.args[0][0];

      cy.wrap(firstPlasmid.file_name).should('equal', 'pYTK002.gb');
      cy.wrap(firstPlasmid.plasmid_name).should('equal', 'pYTK002.gb (ConS)');
      cy.wrap(firstPlasmid.left_overhang).should('equal', 'CCCT');
      cy.wrap(firstPlasmid.right_overhang).should('equal', 'AACG');
      cy.wrap(firstPlasmid.key).should('equal', 'CCCT-AACG');

      const {appData} = firstPlasmid.sequenceData;

      cy.wrap(appData.fileName).should('equal', 'pYTK002.gb');
      cy.wrap(appData.correspondingParts).should('deep.equal', ['CCCT-AACG']);
      cy.wrap(appData.correspondingPartsNames).should('deep.equal', ["CCCT_overhang-AACG_overhang"]);

    });
  });


  it('does not allow to submit when all plasmids are invalid', () => {
    cy.mount(
      <ConfigProvider config={testConfig}>
        <UploadPlasmidsButton addPlasmids={() => {}} syntax={mocloSyntax} />
      </ConfigProvider>,
    );
    cy.get('button').contains('Add Plasmids').siblings('input').selectFile([
      'cypress/test_files/sequencing/locus.gb'],
    { force: true });

    // Wait for the dialog to appear (indicating plasmids were processed)
    cy.get('.MuiDialog-root', { timeout: 10000 }).should('be.visible');

    cy.get('[data-testid="invalid-plasmids-box"]').contains('Invalid Plasmids').should('exist');
    cy.get('[data-testid="valid-plasmids-box"]').should('not.exist');

    cy.get('button').contains('Import valid plasmids').should('be.disabled');

  });

  it('cancelling does not call addPlasmids', () => {
    const addPlasmidsSpy = cy.spy().as('addPlasmidsSpy');
    cy.mount(
      <ConfigProvider config={testConfig}>
        <UploadPlasmidsButton addPlasmids={addPlasmidsSpy} syntax={mocloSyntax} />
      </ConfigProvider>,
    );
    
    cy.get('button').contains('Add Plasmids').siblings('input').selectFile([
      'cypress/test_files/syntax/pYTK002.gb',
      'cypress/test_files/syntax/moclo_ytk_multi_part.gb',
      'cypress/test_files/syntax/pYTK095.gb',
      'cypress/test_files/sequencing/locus.gb'],
    { force: true });
    
    cy.get('.MuiDialog-root', { timeout: 10000 }).should('be.visible');

    cy.get('button').contains('Cancel').click();

    cy.get('@addPlasmidsSpy').should('not.have.been.called');

  });

});
