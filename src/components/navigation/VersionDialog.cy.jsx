import React from 'react';
import VersionDialog from './VersionDialog';
import store from '../../store';
import { cloningActions } from '../../store/cloning';

const { setConfig } = cloningActions;

describe('VersionDialog Component', () => {
  beforeEach(() => {
    store.dispatch(setConfig({ backendUrl: '/mock' }));
  });

  it('renders dialog with correct versions when open', () => {
    cy.intercept('GET', '/version', {
      body: {
        backend_version: '1.2.3',
        schema_version: '4.5.6',
      },
    });
    cy.mount(<VersionDialog open setOpen={cy.stub()} />);

    // Check dialog is visible
    cy.get('.version-dialog').should('be.visible');

    // Check frontend version
    cy.contains('Frontend').parent().find('p:last-child').should('have.text', process.env.GIT_TAG);

    // Check backend version
    cy.contains('Backend').parent().find('p:last-child').should('have.text', '1.2.3');

    // Check schema version
    cy.contains('Schema').parent().find('p:last-child').should('have.text', '4.5.6');
  });

  it('shows N.A. when backend versions missing', () => {
    cy.intercept('GET', '/version', {
      body: {
      },
    });
    cy.mount(<VersionDialog open setOpen={cy.stub()} />);
    cy.contains('Backend').parent().find('p:last-child').should('have.text', 'N.A.');
    cy.contains('Schema').parent().find('p:last-child').should('have.text', 'N.A.');
  });

  it('does not render dialog when closed', () => {
    cy.mount(<VersionDialog open={false} setOpen={cy.stub()} />);

    cy.get('.version-dialog').should('not.exist');
  });

  it('calls setOpen when dialog is closed', () => {
    cy.intercept('GET', '/version', {
      body: {
        backend_version: '1.2.3',
        schema_version: '4.5.6',
      },
    });
    const setOpenStub = cy.stub();
    cy.mount(<VersionDialog open setOpen={setOpenStub} />);

    // Simulate closing the dialog
    cy.get('.version-dialog').type('{esc}');

    cy.wrap(setOpenStub).should('have.been.calledWith', false);
  });
});
