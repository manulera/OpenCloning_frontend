import React from 'react';
import ELabFTWCategorySelect from './ELabFTWCategorySelect';
import { eLabFTWHttpClient } from './common';

describe('<ELabFTWCategorySelect />', () => {
  it('shows the right options', () => {
    const setCategorySpy = cy.spy().as('setCategorySpy');
    cy.stub(eLabFTWHttpClient, 'get').withArgs('/api/v2/items_types', { headers: { Authorization: 'test-read-key' } }).resolves({
      data: [
        { id: 1, title: 'Category 1' },
        { id: 2, title: 'Category 2' },
      ],
    });
    cy.mount(<ELabFTWCategorySelect fullWidth setCategory={setCategorySpy} />);
    cy.get('.MuiAutocomplete-root').click();
    cy.get('li').contains('Category 1').should('exist');
    cy.get('li').contains('Category 2').should('exist');
    cy.get('li').contains('Category 1').click();
    cy.get('@setCategorySpy').should('have.been.calledWith', { id: 1, title: 'Category 1' });
  });

  it('shows empty options if no categories are found', () => {
    cy.mount(<ELabFTWCategorySelect fullWidth />);
    cy.stub(eLabFTWHttpClient, 'get').withArgs('/api/v2/items_types', { headers: { Authorization: 'test-read-key' } }).resolves({
      data: [],
    });
    cy.get('.MuiAutocomplete-root').click();
    cy.get('li').should('not.exist');
  });

  it('shows an error message if the request fails and can retry', () => {
    cy.mount(<ELabFTWCategorySelect fullWidth />);
    cy.get('.MuiAlert-message').should('contain', 'Could not retrieve categories');
    // Clicking the retry button makes the request again
    cy.spy(eLabFTWHttpClient, 'get').as('eLabFTWHttpClientSpy');
    cy.get('button').contains('Retry').click();
    cy.get('@eLabFTWHttpClientSpy').should('have.been.calledWith', '/api/v2/items_types', { headers: { Authorization: 'test-read-key' } });
  });
});
