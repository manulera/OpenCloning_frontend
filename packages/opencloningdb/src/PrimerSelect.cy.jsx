import React from 'react';
import { http, HttpResponse } from 'msw';
import PrimerSelect from './PrimerSelect';
import { baseUrl } from './common';

const primersResponse = {
  items: [
    { id: 1, name: 'fwd-1' },
    { id: 2, name: 'rev-1' },
    { id: 3, name: 'seq-1' },
  ],
  total: 3,
  page: 1,
  size: 100,
};

describe('<PrimerSelect />', () => {
  it('loads primers and reports selection', () => {
    cy.mswUse(
      http.get(`${baseUrl}/primers`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('page')).to.eq('1');
        expect(url.searchParams.get('size')).to.eq('100');
        return HttpResponse.json(primersResponse);
      }),
    );
    const setPrimer = cy.spy().as('setPrimer');

    cy.mount(<PrimerSelect setPrimer={setPrimer} />);

    cy.get('.MuiInputBase-root').click();
    cy.get('div[role="presentation"]').contains('1 - fwd-1');
    cy.get('div[role="presentation"]').contains('2 - rev-1').click();
    cy.get('@setPrimer').should('have.been.calledWith', { id: 2, name: 'rev-1' });
  });

  it('excludes primers listed in filterDatabaseIds', () => {
    cy.mswUse(http.get(`${baseUrl}/primers`, () => HttpResponse.json(primersResponse)));

    cy.mount(<PrimerSelect setPrimer={() => {}} filterDatabaseIds={[1, 3]} />);

    cy.get('.MuiInputBase-root').click();
    cy.get('div[role="presentation"]').contains('1 - fwd-1').should('not.exist');
    cy.get('div[role="presentation"]').contains('3 - seq-1').should('not.exist');
    cy.get('div[role="presentation"]').contains('2 - rev-1').should('exist');
  });

  it('shows the retry alert on server error', () => {
    cy.mswUse(
      http.get(`${baseUrl}/primers`, () => HttpResponse.json({ detail: 'boom' }, { status: 500 })),
    );

    cy.mount(<PrimerSelect setPrimer={() => {}} />);
    cy.get('.MuiAlert-message').contains('Could not retrieve primers from OpenCloningDB');
    cy.get('button').contains('Retry').should('exist');
  });
});
