import React from 'react';
import PrimerTableRow from './PrimerTableRow';
import { mockPrimerDetails, mockPCRDetails, mockPrimer } from '../../../tests/mockPrimerDetailsData';

describe('<PrimerTableRow />', () => {
  it('displays the right information with PCR details', () => {
    cy.mount(
      <PrimerTableRow
        primerDetails={mockPrimerDetails}
        pcrDetails={mockPCRDetails}
      />,
    );

    cy.get('.name').should('contain', 'Test Primer');
    cy.get('.melting-temperature').should('contain', '56.7 (60)');
    cy.get('.gc-content').should('contain', '48 (50)');
    cy.get('.length').should('contain', '21 (8)');
    cy.get('.sequence').should('contain', 'ACGTACGT');
  });
  it('displays the right information without PCR details', () => {
    cy.mount(
      <PrimerTableRow
        primerDetails={mockPrimerDetails}
        pcrDetails={[]}
      />,
    );
    cy.get('.melting-temperature').should('contain', '60');
    cy.get('.gc-content').should('contain', '50');
    cy.get('.length').should('contain', '8');
  });
  it('shows skeletons when info missing', () => {
    cy.mount(
      <PrimerTableRow
        primerDetails={mockPrimer}
        pcrDetails={[]}
      />,
    );
    cy.get('.melting-temperature .MuiSkeleton-root').should('exist');
    cy.get('.gc-content .MuiSkeleton-root').should('exist');
  });
});
