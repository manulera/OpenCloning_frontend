import React from 'react';
import { mount } from '@cypress/react';
import PrimerInfoIcon, { PrimerInfoDialog } from './PrimerInfoIcon';

const mockPrimer = {
  id: 1,
  name: 'Test Primer',
  sequence: 'ACGTACGT',
};

const mockPrimerDetails = {
  status: 'success',
  length: 8,
  melting_temperature: 60,
  gc_content: 0.5,
  homodimer: {
    melting_temperature: 60,
    deltaG: -100,
    figure: 'dummy_figure',
  },
  hairpin: {
    melting_temperature: 60,
    deltaG: -100,
    figure: 'dummy_figure',
  },
};

const emptyPCRDetails = [];

const mockPCRDetails = [
  {
    sourceId: 3,
    sourceType: 'PCRSource',
    fwdPrimer: {
      melting_temperature: 56.7425140341704,
      gc_content: 0.47619047619047616,
      homodimer: {
        melting_temperature: 21.849123266654033,
        deltaG: -8134.146144614118,
        figure: 'SEQ\t ACGGATC      TTAATTAA\nSEQ\t        CCCGGG\nSTR\t        GGGCCC\nSTR\tAATTAATT      CTAGGCA-',
      },
      hairpin: {
        melting_temperature: 58.96121263750837,
        deltaG: -1864.755457846266,
        figure: 'SEQ\t-///----\\\\\\----------\nSTR\tACGGATCCCCGGGTTAATTAA',
      },
      length: 21,
      id: 1,
      name: 'fwd',
      sequence: 'AGTTTTCATATCTTCCTTTATATTCTATTAATTGAATTTCAAACATCGTTTTATTGAGCTCATTTACATCAACCGGTTCACGGATCCCCGGGTTAATTAA',
    },
    rvsPrimer: {
      melting_temperature: 50.92217978039041,
      gc_content: 0.4,
      homodimer: {
        melting_temperature: 33.33183994389532,
        deltaG: -10262.988602457277,
        figure: 'SEQ\t  GAATT        TTTAAAC\nSEQ\t       CGAGCTCG\nSTR\t       GCTCGAGC\nSTR\tCAAATTT        TTAAG--',
      },
      hairpin: {
        melting_temperature: 40.798505202616354,
        deltaG: -290.37922892468487,
        figure: 'SEQ\t-----//----\\\\-------\nSTR\tGAATTCGAGCTCGTTTAAAC',
      },
      length: 20,
      id: 2,
      name: 'rvs',
      sequence: 'CTTTTATGAATTATCTATATGCTGTATTCATATGCAAAAATATGTATATTTAAATTTGATCGATTAGGTAAATAAGAAGCGAATTCGAGCTCGTTTAAAC',
    },
    heterodimer: {
      melting_temperature: 20.513993258320113,
      deltaG: -5276.181975992979,
      figure: 'SEQ\tAAACATCGTTTTATT      --   TACATCAAC  G   ACGGATCCCCGGGTTAATTAA--------------\nSEQ\t               GAGCTC  ATT         CG TTC\nSTR\t               CTCGAG  TAA         GC AAG\nSTR\t       CAAATTTG      CT   ---------  G   AATAAATGGATTAGCTAGTTTAAATTTATATGTAT',
    },
  },
];

describe('PrimerInfoIcon Component', () => {
  it('renders the info icon when no warnings', () => {
    mount(
      <PrimerInfoIcon
        primer={mockPrimer}
        primerDetails={mockPrimerDetails}
        pcrDetails={emptyPCRDetails}
      />,
    );

    cy.get('svg[data-testid="InfoIcon"]').should('exist');
    // Mouseover shows tooltip
    cy.get('svg[data-testid="InfoIcon"]').trigger('mouseover');
    cy.get('div[role="tooltip"]').should('exist');
    cy.get('div[role="tooltip"]').should('contain', 'Primer details');
    cy.get('svg[data-testid="InfoIcon"]').click();
    cy.get('div[role="dialog"]').should('exist');
  });
  it('renders the warning icon when warnings', () => {
    mount(
      <PrimerInfoIcon
        primer={mockPrimer}
        primerDetails={{ ...mockPrimerDetails, gc_content: 0.0 }}
        pcrDetails={emptyPCRDetails}
      />,
    );

    cy.get('svg[data-testid="WarningIcon"]').should('exist');
    // Mouseover shows tooltip
    cy.get('svg[data-testid="WarningIcon"]').trigger('mouseover');
    cy.get('div[role="tooltip"]').should('exist');
    cy.get('div[role="tooltip"]').should('contain', 'GC content');
    cy.get('svg[data-testid="WarningIcon"]').click();
    cy.get('div[role="dialog"]').should('exist');
  });
  it('handles connection errors', () => {
    mount(
      <PrimerInfoIcon
        primer={mockPrimer}
        primerDetails={{ ...mockPrimerDetails, status: 'error' }}
        pcrDetails={emptyPCRDetails}
      />,
    );
    cy.get('span').trigger('mouseover');
    cy.get('div[role="tooltip"]').should('exist');
    cy.get('div[role="tooltip"]').should('contain', 'Primer details not available');
  });
});

describe('PrimerInfoDialog Component', () => {
  it('Without PCR details', () => {
    mount(
      <PrimerInfoDialog
        primer={mockPrimer}
        primerDetails={mockPrimerDetails}
        pcrDetails={emptyPCRDetails}
        open
        onClose={() => {}}
      />,
    );
    cy.get('div[role="dialog"]').should('exist');
    cy.get('tr').eq(0).should('contain', 'Full sequence');
    cy.get('tr').eq(1).find('td').eq(0)
      .should('contain', 'Name');
    cy.get('tr').eq(1).find('td').eq(1)
      .should('contain', mockPrimer.name);

    // Full sequence section
    cy.get('tr').eq(2).find('td').eq(0)
      .should('contain', 'Length');
    cy.get('tr').eq(2).find('td').eq(1)
      .should('contain', '8');
    cy.get('tr').eq(3).find('td').eq(0)
      .should('contain', 'Tm (full sequence)');
    cy.get('tr').eq(3).find('td').eq(1)
      .should('contain', '60 °C');
    cy.get('tr').eq(4).find('td').eq(0)
      .should('contain', 'GC% (full sequence)');
    cy.get('tr').eq(4).find('td').eq(1)
      .should('contain', '50%');

    // Homodimer section
    cy.get('tr').eq(5).should('contain', 'Homodimer');
    cy.get('tr').eq(6).find('td').eq(0)
      .should('contain', 'Tm (homodimer)');
    cy.get('tr').eq(6).find('td').eq(1)
      .should('contain', '60 °C');
    cy.get('tr').eq(7).find('td').eq(0)
      .should('contain', 'ΔG (homodimer)');
    cy.get('tr').eq(7).find('td').eq(1)
      .should('contain', '-100 kcal/mol');

    // Hairpin section
    cy.get('tr').eq(9).should('contain', 'Hairpin');
    cy.get('tr').eq(10).find('td').eq(0)
      .should('contain', 'Tm (hairpin)');
    cy.get('tr').eq(10).find('td').eq(1)
      .should('contain', '60 °C');
    cy.get('tr').eq(11).find('td').eq(0)
      .should('contain', 'ΔG (hairpin)');
    cy.get('tr').eq(11).find('td').eq(1)
      .should('contain', '-100 kcal/mol');
  });

  it('renders PCR details correctly', () => {
    mount(
      <PrimerInfoDialog
        primer={mockPrimer}
        primerDetails={mockPrimerDetails}
        pcrDetails={mockPCRDetails}
        open
        onClose={() => {}}
      />,
    );

    // PCR 3 Section Header
    cy.get('.pcr-table tr').eq(0).should('contain', 'PCR 3');

    // Primer Names Row
    cy.contains('.pcr-table tr', 'Primer names').within(() => {
      cy.get('td').eq(1).should('contain', 'fwd');
      cy.get('td').eq(2).should('contain', 'rvs');
    });

    // Binding Information
    cy.contains('.pcr-table tr', 'Binding length').within(() => {
      cy.get('td').eq(1).should('contain', '21');
      cy.get('td').eq(2).should('contain', '20');
    });

    cy.contains('.pcr-table tr', 'Tm (binding)').within(() => {
      cy.get('td').eq(1).should('contain', '56.7 °C');
      cy.get('td').eq(2).should('contain', '50.9 °C');
    });

    cy.contains('.pcr-table tr', 'GC% (binding)').within(() => {
      cy.get('td').eq(1).should('contain', '48%');
      cy.get('td').eq(2).should('contain', '40%');
    });

    // Temperature Difference
    cy.contains('.pcr-table tr', 'Tm difference').within(() => {
      cy.get('td').should('contain', '5.8 °C');
    });

    // Heterodimer Information
    cy.contains('.pcr-table tr', 'Tm (heterodimer)').within(() => {
      cy.get('td').should('contain', '20.5 °C');
    });

    cy.contains('.pcr-table tr', 'ΔG (heterodimer)').within(() => {
      cy.get('td').should('contain', '-5276 kcal/mol');
    });

    // Verify heterodimer figure exists
    cy.contains('SEQ').should('exist');
  });
});
