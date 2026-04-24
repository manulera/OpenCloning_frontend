import React from 'react';
import LoadHistoryComponent from './LoadHistoryComponent';

const DB_URL = 'http://localhost:8001';
const DATABASE_ID = 10;
const ENDPOINT = `/sequence/${DATABASE_ID}/cloning_strategy`;

describe('<LoadHistoryComponent />', () => {
  beforeEach(() => {
    cy.loginToOpenCloningDB('bootstrap@example.com', 'password', 1);
  });

  it('calls loadDatabaseFile with the file returned by the API', () => {
    const loadDatabaseFileSpy = cy.spy().as('loadDatabaseFileSpy');

    cy.intercept('GET', `${DB_URL}${ENDPOINT}`).as('getCloningStrategy');

    cy.mount(
      <LoadHistoryComponent
        databaseId={DATABASE_ID}
        loadDatabaseFile={loadDatabaseFileSpy}
      />,
    );

    cy.wait('@getCloningStrategy').then(({ response }) => {
      const expectedContent = JSON.stringify(response.body);
      cy.get('@loadDatabaseFileSpy').should('have.been.calledOnce');

      cy.get('@loadDatabaseFileSpy').then((spy) => {
        const [file, id, flag] = spy.lastCall.args;
        expect(id).to.equal(DATABASE_ID);
        expect(flag).to.equal(true);

        return cy.readFileAsText(file).then((content) => {
          expect(content).to.equal(expectedContent);
        });
      });
    });
  });

  it('shows a loading spinner while the request is pending', () => {
    cy.intercept('GET', `${DB_URL}${ENDPOINT}`, (req) => {
      req.reply((res) => {
        res.setDelay(1000);
      });
    }).as('getCloningStrategy');

    cy.mount(
      <LoadHistoryComponent
        databaseId={DATABASE_ID}
        loadDatabaseFile={cy.stub()}
      />,
    );

    cy.get('.MuiCircularProgress-svg', { timeout: 500 }).should('exist');
    cy.wait('@getCloningStrategy');
  });

  it('shows a retry button when the request fails, and retries on click', () => {
    let callCount = 0;
    cy.intercept('GET', `${DB_URL}${ENDPOINT}`, (req) => {
      callCount += 1;
      if (callCount === 1) {
        req.reply({ statusCode: 500 });
      } else {
        req.reply({ statusCode: 200, body: {} });
      }
    }).as('getCloningStrategy');

    cy.mount(
      <LoadHistoryComponent
        databaseId={DATABASE_ID}
        loadDatabaseFile={cy.stub()}
      />,
    );

    cy.wait('@getCloningStrategy');
    cy.contains('Failed to load history file.').should('exist');
    cy.contains('button', 'Retry').should('exist').click();
    cy.wait('@getCloningStrategy');
    cy.contains('Failed to load history file.').should('not.exist');
  });
});
