import React from 'react';
import { ConfigProvider } from '@opencloning/ui/providers/ConfigProvider';
import { localFilesHttpClient } from '@opencloning/ui/hooks/useLocalFiles';
import UploadPlasmidsButton from './UploadPlasmidsButton';
import mocloSyntax from '../../../../../cypress/test_files/syntax/moclo_syntax.json';
import { dummyIndex } from '../form/LocalFileSelect.cy.jsx';

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

    cy.get('button').contains('Load Plasmids from Local Server').should('not.exist');
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

  it('loads plasmids from local server', () => {
    const httpGet = cy.stub(localFilesHttpClient, 'get').callsFake((url) => {
      if (url.endsWith('/index.json')) {
        return Promise.resolve({
          data: dummyIndex,
        });
      }
      if (url.endsWith('/example.fa')) {
        return Promise.resolve({ data: '>example\nATGC' });
      }
      if (url.endsWith('/example2.gb')) {
        return cy.readFile('cypress/test_files/syntax/pYTK002.gb').then((fileContent) => ({ data: fileContent }));
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    cy.wrap(httpGet).as('httpGet');
    const addPlasmidsSpy = cy.spy().as('addPlasmidsSpy');
    cy.mount(
      <ConfigProvider config={{...testConfig, localFilesPath: 'collection'}}>
        <UploadPlasmidsButton addPlasmids={addPlasmidsSpy} syntax={mocloSyntax} />
      </ConfigProvider>,
    );
    cy.get('button').contains('Load Plasmids from Local Server').click();

    cy.get('button').contains('Submit').should('be.disabled');
    cy.get('#option-select').click();
    cy.contains('Example sequence 1').click();
    cy.contains('Example sequence 2').click();
    // Click outside to close select element
    cy.get('.MuiDialog-container h2').click({force: true});
    cy.contains('button', 'Submit').click();

    cy.get('[data-testid="invalid-plasmids-box"]').contains('Invalid Plasmids').should('exist');
    cy.get('[data-testid="valid-plasmids-box"]').contains('Valid Plasmids').should('exist');
    cy.get('[data-testid="valid-plasmids-box"]').should('contain', 'pYTK002');
    cy.get('[data-testid="invalid-plasmids-box"]').should('contain', 'example.fa');
    cy.get('button').contains('Import valid plasmids').click();
    cy.get('@addPlasmidsSpy').should('have.been.called');
    cy.get('@addPlasmidsSpy').then((spy) => {
      const firstCall = spy.getCall(0);
      cy.wrap(firstCall.args[0]).should('be.an', 'array');
      cy.wrap(firstCall.args[0]).should('have.length', 1);
      cy.wrap(firstCall.args[0][0].file_name).should('equal', 'example2.gb');
    });
  });
  it('handles error loading plasmids from local server', () => {
    const httpGet = cy.stub(localFilesHttpClient, 'get').callsFake((url) => {
      if (url.endsWith('/index.json')) {
        return Promise.resolve({
          data: dummyIndex,
        });
      } 
      if (url.endsWith('/example2.gb')) {
        return Promise.resolve({ data: 'wrong_format' });
      }
    });
    cy.wrap(httpGet).as('httpGet');
    const addPlasmidsSpy = cy.spy().as('addPlasmidsSpy');
    cy.mount(
      <ConfigProvider config={{...testConfig, localFilesPath: 'collection'}}>
        <UploadPlasmidsButton addPlasmids={addPlasmidsSpy} syntax={mocloSyntax} />
      </ConfigProvider>,
    );
    cy.get('button').contains('Load Plasmids from Local Server').click();
    cy.get('button').contains('Submit').should('be.disabled');
    cy.get('#option-select').click();
    cy.contains('Example sequence 1').click();
    cy.get('.MuiDialog-container h2').click({force: true});
    cy.contains('button', 'Submit').click();
    cy.get('.MuiAlert-colorError').contains('Error requesting file').should('exist');

    cy.get('#option-select').click();
    cy.get('ul').contains('Example sequence 1').click();
    cy.contains('Example sequence 2').click();
    cy.get('.MuiDialog-container h2').click({force: true});
    cy.contains('button', 'Submit').click();
    cy.get('.MuiAlert-colorError').contains('Error uploading plasmid from file example2.gb').should('exist');
    cy.get('.MuiAlert-colorError').contains('Error requesting file').should('not.exist');

    cy.get('@addPlasmidsSpy').should('not.have.been.called');
  });

});
