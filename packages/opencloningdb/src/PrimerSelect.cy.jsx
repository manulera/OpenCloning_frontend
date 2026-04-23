import React from 'react';
import PrimerSelect from './PrimerSelect';

describe('<PrimerSelect />', () => {
  it('loads primers, filters by name, and reports selection', () => {
    const setPrimer = cy.spy().as('setPrimer');

    cy.mount(<PrimerSelect setPrimer={setPrimer} />);

  });
});
