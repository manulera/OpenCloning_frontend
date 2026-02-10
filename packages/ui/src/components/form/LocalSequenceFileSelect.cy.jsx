import React from 'react';
import { ConfigProvider } from '../../providers/ConfigProvider';
import { localFilesHttpClient } from '../../hooks/useLocalFiles';
import LocalSequenceFileSelect from './LocalSequenceFileSelect';

// A common intercept does not work here, because we are requesting
// static files, and cypress intercepts don't work.

const config = {
  backendUrl: 'http://localhost:8000',
  localFilesPath: 'collection',
  showAppBar: false,
  noExternalRequests: false,
  enableAssembler: true,
  enablePlannotate: false,
};

const dummyIndex = {
  sequences: [
    {
      name: 'Example sequence 1',
      path: 'example.fa',
      categories: ['Test category'],
    },
    {
      name: 'Example sequence 2',
      path: 'example2.fa',
      categories: ['Test category2'],
    },
    {
      name: 'Example sequence 3',
      path: 'example3.fa',
      categories: ['Test category'],
    },
  ],
};

describe('<LocalSequenceFileSelect />', () => {
  it('loads index, fetches file and calls onFileSelected', () => {
    const httpGet = cy.stub(localFilesHttpClient, 'get').callsFake((url) => {
      if (url.endsWith('/index.json')) {
        return Promise.resolve({
          data: dummyIndex,
        });
      }
      if (url.endsWith('/example.fa')) {
        return Promise.resolve({ data: 'ATGC' });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    cy.wrap(httpGet).as('httpGet');

    const onFileSelected = cy.spy().as('onFileSelected');

    cy.mount(
      <ConfigProvider config={config}>
        <LocalSequenceFileSelect
          onFileSelected={onFileSelected}
        />
      </ConfigProvider>,
    );

    cy.get('@httpGet').should('have.been.calledWithMatch', 'index.json');

    // Button is disabled
    cy.contains('button', 'Submit').should('be.disabled');

    // Select sequence
    cy.get('#sequence-select').click();
    cy.contains('Example sequence 1').click();

    // Submit form
    cy.contains('button', 'Submit').click();

    cy.get('@httpGet').should('have.been.calledWithMatch', 'example.fa');

    cy.get('@onFileSelected').should('have.been.calledOnce');
    cy.get('@onFileSelected').should((spy) => {
      const [file] = spy.lastCall.args;
      expect(file.name).to.equal('example.fa');
      expect(file.type).to.equal('text/plain');
      expect(file.size).to.equal(4);
    });
  });

  it('handles index load failure and allows retry', () => {
    let firstCall = true;
    const httpGet = cy.stub(localFilesHttpClient, 'get').callsFake((url) => {
      if (!url.endsWith('/index.json')) {
        throw new Error(`Unexpected URL: ${url}`);
      }
      if (firstCall) {
        firstCall = false;
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({
        data: dummyIndex,
      });
    });
    cy.wrap(httpGet).as('httpGet');

    cy.mount(
      <ConfigProvider config={config}>
        <LocalSequenceFileSelect
          onFileSelected={cy.spy()}
        />
      </ConfigProvider>,
    );

    cy.get('@httpGet').should('have.been.calledWithMatch', 'index.json');

    // First request failed, should show retry alert
    cy.get('.MuiAlert-colorError').should('exist');
    cy.contains('Retry').click();

    // Second request succeeds
    cy.get('@httpGet').should('have.been.calledTwice');

    // Error alert should disappear and form should be visible
    cy.get('.MuiAlert-colorError').should('not.exist');
    cy.get('#sequence-select').should('exist');
  });

  it('handles invalid sequence and file request failure', () => {
    const httpGet = cy.stub(localFilesHttpClient, 'get').callsFake((url) => {
      if (url.endsWith('/index.json')) {
        return Promise.resolve({
          data: {
            sequences: [
              {
                name: 'No path sequence',
                categories: ['Test category'],
              },
              {
                name: 'Valid path sequence',
                path: 'valid.fa',
                categories: ['Test category'],
              },
            ],
          },
        });
      }
      if (url.endsWith('/valid.fa')) {
        return Promise.reject(new Error('Server error'));
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    cy.wrap(httpGet).as('httpGet');

    const onFileSelected = cy.spy().as('onFileSelected');

    cy.mount(
      <ConfigProvider config={config}>
        <LocalSequenceFileSelect
          onFileSelected={onFileSelected}
        />
      </ConfigProvider>,
    );

    cy.get('@httpGet').should('have.been.calledWithMatch', 'index.json');

    // Select category
    cy.get('#category-select').click();
    cy.contains('Test category').click();

    // First: select malformed sequence (no path)
    cy.get('#sequence-select').click();
    cy.contains('No path sequence').click();
    cy.contains('button', 'Submit').click();

    cy.get('.MuiAlert-colorError')
      .contains('Malformatted sequence, must have a path')
      .should('exist');
    cy.get('@onFileSelected').should('not.have.been.called');

    // Then: select valid sequence but make file request fail
    cy.get('#sequence-select').click();
    cy.contains('Valid path sequence').click();
    cy.contains('button', 'Submit').click();

    cy.get('.MuiAlert-colorError')
      .contains('Error requesting file')
      .should('exist');
    cy.get('@onFileSelected').should('not.have.been.called');
  });
  it('handles filtering by categories', () => {
    const httpGet = cy.stub(localFilesHttpClient, 'get').callsFake((url) => {
      if (url.endsWith('/index.json')) {
        return Promise.resolve({
          data: dummyIndex,
        });
      }
    });
    cy.wrap(httpGet).as('httpGet');

    cy.mount(
      <ConfigProvider config={config}>
        <LocalSequenceFileSelect
          onFileSelected={cy.spy()}
        />
      </ConfigProvider>,
    );

    cy.get('@httpGet').should('have.been.calledWithMatch', 'index.json');

    // Select category
    cy.get('#category-select').click();
    cy.contains('Test category').click();

    // Only one sequence should be shown
    cy.get('#sequence-select').click();
    cy.contains('Example sequence 1').should('exist');
    cy.contains('Example sequence 2').should('not.exist');
    cy.contains('Example sequence 3').should('exist');
    // Select sequence
    cy.contains('Example sequence 1').click();

    // Select All
    cy.get('#category-select').click();
    cy.contains('All').click();

    // Nothing should be selected
    cy.get('#sequence-select').should('have.value', '');
  });
});
