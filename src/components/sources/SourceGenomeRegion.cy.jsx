import React from 'react';
import { AssemblyIdSelector } from './SourceGenomeRegion';

describe('<AssemblyIdSelector />', () => {
  it('can propose a paired accession if the assembly has no annotation', () => {
    const setAssemblyId = cy.spy().as('setAssemblyId');
    const setHasAnnotation = cy.spy().as('setHasAnnotation');
    const onAssemblyIdChange = cy.spy().as('onAssemblyIdChange');

    cy.intercept('GET', 'https://api.ncbi.nlm.nih.gov/datasets/v2alpha/genome/accession/GCA_000002945.3/dataset_report*', {
      statusCode: 200,
      body: {
        reports: [{
          accession: 'GCA_000002945.3',
          organism: {
            tax_id: 559292,
            organism_name: 'Saccharomyces cerevisiae'
          },
          annotation_info: undefined,
          paired_accession: 'GCF_000002945.3',
          assembly_info: {
            assembly_status: 'current'
          }
        }]
      }
    }).as('getAssemblyInfo');

    cy.intercept('GET', 'https://api.ncbi.nlm.nih.gov/datasets/v2alpha/genome/accession/GCF_000002945.3/dataset_report*', {
      statusCode: 200, 
      body: {
        reports: [{
          accession: 'GCF_000002945.3',
          organism: {
            tax_id: 559292,
            organism_name: 'Saccharomyces cerevisiae'
          },
          annotation_info: {},
          assembly_info: {
            assembly_status: 'current'
          }
        }]
      }
    }).as('getPairedAssemblyInfo');

    cy.mount(
      <AssemblyIdSelector 
        setAssemblyId={setAssemblyId}
        setHasAnnotation={setHasAnnotation}
        onAssemblyIdChange={onAssemblyIdChange}
      />
    );
    cy.get('input').type('GCA_000002945.3');
    cy.wait('@getAssemblyInfo');

    cy.wait('@getPairedAssemblyInfo');
    cy.contains('Equivalent assembly GCF_000002945.3 has annotation').should('exist');
  });
});
