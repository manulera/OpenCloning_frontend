import React from 'react';
import LoadHistoryComponent from './LoadHistoryComponent';
import { eLabFTWHttpClient } from './common';
import * as utils from './utils';

let uniqueId = 1;
const newUniqueId = () => {
  const id = uniqueId;
  uniqueId += 1;
  return id;
};
const DATABASE_ID = newUniqueId();
const HISTORY_FILE_ID = newUniqueId();
const OTHER_FILE_ID = newUniqueId();
const TEST_FILE_CONTENT = JSON.stringify({ test: 'content' });

describe('<LoadHistoryComponent />', () => {
  it('loads history file successfully when one file exists', () => {
    const handleCloseSpy = cy.spy().as('handleCloseSpy');
    const loadDatabaseFileSpy = cy.spy().as('loadDatabaseFileSpy');

    // Stub API calls
    cy.stub(eLabFTWHttpClient, 'get').callsFake(async (url) => {
      if (url === `/api/v2/items/${DATABASE_ID}`) {
        return Promise.resolve({
          data: {
            uploads: [
              {
                id: HISTORY_FILE_ID,
                real_name: 'history.json',
                comment: 'OpenCloning history',
              },
            ],
          },
        });
      }
      if (url === `/api/v2/items/${DATABASE_ID}/uploads/${HISTORY_FILE_ID}?format=binary`) {
        return Promise.resolve({ data: new Blob([TEST_FILE_CONTENT], { type: 'application/json' }) });
      }
      return Promise.resolve({ data: [] });
    });

    cy.mount(
      <LoadHistoryComponent
        handleClose={handleCloseSpy}
        databaseId={DATABASE_ID}
        loadDatabaseFile={loadDatabaseFileSpy}
      />,
    );

    // Should show loading initially
    cy.get('.MuiCircularProgress-root').should('exist');

    // Should call loadDatabaseFile with the correct arguments
    cy.get('@loadDatabaseFileSpy').should((spy) => {
      const [file, id, isHistory] = spy.lastCall.args;
      expect(file).to.be.instanceOf(File);
      expect(file.name).to.equal('history.json');
      expect(id).to.equal(DATABASE_ID);
      expect(isHistory).to.be.true;

      // Verify file content
      const reader = new FileReader();
      reader.onload = (e) => {
        const actualContent = e.target.result;
        expect(actualContent).to.equal(TEST_FILE_CONTENT);
      };
      reader.readAsText(file);
      return undefined; // Satisfy linter
    });

    // Loading indicator should be gone
    cy.get('.MuiCircularProgress-root').should('not.exist');
  });

  it('shows error when multiple history files found', () => {
    const handleCloseSpy = cy.spy().as('handleCloseSpy');
    const loadDatabaseFileSpy = cy.spy().as('loadDatabaseFileSpy');

    cy.stub(eLabFTWHttpClient, 'get').callsFake(async (url) => {
      if (url === `/api/v2/items/${DATABASE_ID}`) {
        return Promise.resolve({
          data: {
            uploads: [
              {
                id: HISTORY_FILE_ID,
                real_name: 'history1.json',
                comment: 'OpenCloning history',
              },
              {
                id: OTHER_FILE_ID,
                real_name: 'history2.json',
                comment: 'OpenCloning history',
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: [] });
    });

    cy.mount(
      <LoadHistoryComponent
        handleClose={handleCloseSpy}
        databaseId={DATABASE_ID}
        loadDatabaseFile={loadDatabaseFileSpy}
      />,
    );

    // Should show error message
    cy.get('.MuiAlert-message').should('contain', 'Multiple history files found for this ancestor sequence');
    cy.get('@loadDatabaseFileSpy').should('not.have.been.called');
  });

  it('shows error when no history files found', () => {
    const handleCloseSpy = cy.spy().as('handleCloseSpy');
    const loadDatabaseFileSpy = cy.spy().as('loadDatabaseFileSpy');

    cy.stub(eLabFTWHttpClient, 'get').callsFake(async (url) => {
      if (url === `/api/v2/items/${DATABASE_ID}`) {
        return Promise.resolve({
          data: {
            uploads: [
              {
                id: OTHER_FILE_ID,
                real_name: 'other.txt',
                comment: 'Not a history file',
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: [] });
    });

    cy.mount(
      <LoadHistoryComponent
        handleClose={handleCloseSpy}
        databaseId={DATABASE_ID}
        loadDatabaseFile={loadDatabaseFileSpy}
      />,
    );

    // Should show error message
    cy.get('.MuiAlert-message').should('contain', 'No history files found for this ancestor sequence');
    cy.get('@loadDatabaseFileSpy').should('not.have.been.called');
  });

  it('handles API error and allows retry', () => {
    const handleCloseSpy = cy.spy().as('handleCloseSpy');
    const loadDatabaseFileSpy = cy.spy().as('loadDatabaseFileSpy');

    let firstCall = true;
    cy.stub(eLabFTWHttpClient, 'get').callsFake(async (url) => {
      if (url === `/api/v2/items/${DATABASE_ID}`) {
        if (firstCall) {
          firstCall = false;
          throw new Error('Access denied');
        }
        return Promise.resolve({
          data: {
            uploads: [
              {
                id: HISTORY_FILE_ID,
                real_name: 'history.json',
                comment: 'OpenCloning history',
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: [] });
    });

    cy.mount(
      <LoadHistoryComponent
        handleClose={handleCloseSpy}
        databaseId={DATABASE_ID}
        loadDatabaseFile={loadDatabaseFileSpy}
      />,
    );

    // Should show error message
    cy.get('.MuiAlert-message').should('contain', 'Ancestor sequence might have been deleted or you can no longer access it');

    // Click retry
    cy.get('button').contains('Retry').click();

    // Should load successfully after retry
    cy.get('@loadDatabaseFileSpy').should((spy) => {
      const [file, id, isHistory] = spy.lastCall.args;
      expect(file).to.be.instanceOf(File);
      expect(file.name).to.equal('history.json');
      expect(id).to.equal(DATABASE_ID);
      expect(isHistory).to.be.true;
      return undefined; // Satisfy linter
    });
  });

  it('close button works', () => {
    const handleCloseSpy = cy.spy().as('handleCloseSpy');
    const loadDatabaseFileSpy = cy.spy().as('loadDatabaseFileSpy');

    cy.stub(eLabFTWHttpClient, 'get')
      .withArgs(`/api/v2/items/${DATABASE_ID}`, { headers: { Authorization: 'test-read-key' } })
      .resolves({
        data: {
          uploads: [],
        },
      });

    cy.mount(
      <LoadHistoryComponent
        handleClose={handleCloseSpy}
        databaseId={DATABASE_ID}
        loadDatabaseFile={loadDatabaseFileSpy}
      />,
    );

    cy.get('button').contains('Close').click();
    cy.get('@handleCloseSpy').should('have.been.called');
  });
});
