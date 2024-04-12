describe('Tests primer functionality', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('button.MuiTab-root').contains('Primers').click();
  });
  it('Can delete primers', () => {
    cy.get('.primer-table-container [data-testid="DeleteIcon"]').should('have.length', 2);
    cy.get('.primer-table-container [data-testid="DeleteIcon"]').first().click();
    cy.get('.primer-table-container [data-testid="DeleteIcon"]').should('have.length', 1);
    cy.get('.primer-table-container [data-testid="DeleteIcon"]').first().click();
    cy.get('.primer-table-container [data-testid="DeleteIcon"]').should('not.exist');
  });
  it('Can add primers', () => {
    // Add two dummy primers
    cy.get('.primer-form-container').contains('Add Primer').click();
    cy.get('form.primer-row').should('exist');
    cy.get('form.primer-row input#name').type('fwd-2');
    cy.get('form.primer-row input#sequence').type('atg');
    cy.get('form.primer-row [data-testid="CheckCircleIcon"]').click();
    cy.get('form.primer-row').should('not.exist');
    cy.get('.primer-form-container').contains('Add Primer').should('exist');
    cy.get('.primer-table-container tr').contains('fwd-2').should('exist');
    cy.get('.primer-table-container tr').contains('atg').should('exist');
  });
  // it('removes spaces on paste', () => {
  //   cy.get('.primer-form-container').contains('Add Primer').click();
  //   cy.get('form.primer-row').should('exist');
  //   // TODO: Implement paste command
  // });
  it('Can close add form', () => {
    // Add two dummy primers
    cy.get('.primer-form-container').contains('Add Primer').click();
    cy.get('form.primer-row').should('exist');
    cy.get('.primer-form-container [data-testid="CancelIcon"').click();
    cy.get('form.primer-row').should('not.exist');
    cy.get('.primer-form-container').contains('Add Primer').click();
    // Type something and close
    cy.get('form.primer-row input#name').type('fwd-2');
    cy.get('form.primer-row input#sequence').type('atg');
    cy.get('.primer-form-container [data-testid="CancelIcon"').click();
    cy.get('form.primer-row').should('not.exist');
  });
  it('Can edit primers', () => {
    cy.get('.primer-table-container tr').contains('fwd').should('exist');
    cy.get('.primer-table-container [data-testid="EditIcon"]').first().click();
    // The edited primer is not shown in the table
    cy.get('.primer-table-container tr').contains('fwd').should('not.exist');
    cy.get('form.primer-row').should('exist');
    cy.get('form.primer-row input#name').should('have.value', 'fwd');
    cy.get('form.primer-row input#sequence').should('have.value', 'gatctcgccataaaagacag');
    cy.get('form.primer-row input#name').clear();
    cy.get('form.primer-row input#name').type('blah');
    cy.get('form.primer-row input#sequence').clear();
    cy.get('form.primer-row input#sequence').type('gggggggggggg');
    cy.get('form.primer-row [data-testid="CheckCircleIcon"]').click();
    cy.get('form.primer-row').should('not.exist');
    cy.get('.primer-form-container').contains('Add Primer').should('exist');
    cy.get('.primer-table-container tr').contains('blah').should('exist');
    cy.get('.primer-table-container tr').contains('gggggggggggg').should('exist');
    cy.get('.primer-table-container tr').contains('fwd').should('not.exist');
    cy.get('.primer-table-container tr').contains('gatctcgccataaaagacag').should('not.exist');
  });
  it('Applies contrains to edit used primer', () => {
    const formNotSubmittable = () => {
      cy.get('form.primer-row [data-testid="CheckCircleIcon"]').should('have.class', 'form-invalid');
      cy.get('form.primer-row [data-testid="CheckCircleIcon"]').click();
      cy.get('form.primer-row').should('exist');
    };
    cy.get('.MuiToolbar-root .MuiButtonBase-root').contains('Examples').click();
    cy.get('li span').contains('Integration of cassette by homologous recombination').click();
    cy.get('.primer-table-container [data-testid="EditIcon"]').first().click();

    // Sequence is not editable
    cy.get('form.primer-row .MuiFormHelperText-root').contains('Cannot edit sequence in use');
    cy.get('form.primer-row input#sequence[disabled]').should('exist');

    cy.get('.primer-table-container [data-testid="EditIcon"]').first().click();
    // The submit button is not shown until something is typed
    cy.get('form.primer-row [data-testid="CheckCircleIcon"]').should('not.exist');
    // Cannot be empty
    cy.get('form.primer-row input#name').clear();
    formNotSubmittable();
    cy.get('form.primer-row .MuiFormHelperText-root').contains('Field required');
    // Type existing name
    cy.get('form.primer-row input#name').type('fwd');
    cy.get('form.primer-row .MuiFormHelperText-root').contains('Name exists');
    formNotSubmittable();
    // Revert to original name
    cy.get('form.primer-row input#name').clear('');
    cy.get('form.primer-row input#name').type('rvs');
    cy.get('form.primer-row .MuiFormHelperText-root').contains('Name exists').should('not.exist');
  });
  it('Can change name of  used primer', () => {
    cy.get('.MuiToolbar-root .MuiButtonBase-root').contains('Examples').click();
    cy.get('li span').contains('Integration of cassette by homologous recombination').click();
    cy.get('.primer-table-container [data-testid="EditIcon"]').first().click();
    cy.get('form.primer-row input#name').clear();
    cy.get('form.primer-row input#name').type('blah');
    cy.get('form.primer-row [data-testid="CheckCircleIcon"]').click();
    cy.get('form.primer-row').should('not.exist');
    cy.get('.primer-table-container tr').contains('blah').should('exist');
    cy.get('.primer-table-container tr').contains('fwd').should('not.exist');
    cy.get('.primer-table-container tr').contains('AGTTTTCATATCTTCCTTTATATTCTATTAATTGAATTTCAAACATCGTTTTATTGAGCTCATTTACATCAACCGGTTCACGGATCCCCGGGTTAATTAA').should('exist');
  });
  it('Applies contrains to edit unused primer', () => {
    const formNotSubmittable = () => {
      cy.get('form.primer-row [data-testid="CheckCircleIcon"]').should('have.class', 'form-invalid');
      cy.get('form.primer-row [data-testid="CheckCircleIcon"]').click();
      cy.get('form.primer-row').should('exist');
    };
    cy.get('.primer-table-container [data-testid="EditIcon"]').first().click();
    // The submit button is not shown until something is typed
    cy.get('form.primer-row [data-testid="CheckCircleIcon"]').should('not.exist');
    // Cannot be empty
    cy.get('form.primer-row input#name').clear();
    formNotSubmittable();
    cy.get('form.primer-row .MuiFormHelperText-root').contains('Field required');
    // Type existing name
    cy.get('form.primer-row input#name').type('rvs');
    cy.get('form.primer-row .MuiFormHelperText-root').contains('Name exists');
    formNotSubmittable();
    // Revert to original name
    cy.get('form.primer-row input#name').clear('');
    cy.get('form.primer-row input#name').type('fwd');
    // Invalid sequences not accepted
    cy.get('form.primer-row input#sequence').clear();
    cy.get('form.primer-row input#sequence').type('ss');
    cy.get('form.primer-row .MuiFormHelperText-root').contains('Invalid DNA sequence');
    formNotSubmittable();
    cy.get('form.primer-row input#sequence').clear('');
    cy.get('form.primer-row input#sequence').type('ATGC');
    cy.get('form.primer-row .MuiFormHelperText-root').should('have.text', '');
  });
  it('Applies constrains to new primer', () => {
    // Useful to check the form is not submitted
    const formNotSubmittable = () => {
      cy.get('form.primer-row [data-testid="CheckCircleIcon"]').should('have.class', 'form-invalid');
      cy.get('form.primer-row [data-testid="CheckCircleIcon"]').click();
      cy.get('form.primer-row').should('exist');
    };

    cy.get('form.primer-row').should('not.exist');
    cy.get('.primer-form-container').contains('Add Primer').click();
    // The button is no longer shown after clicking
    cy.get('.primer-form-container').contains('Add Primer').should('not.exist');
    // The form is shown, but can't be submitted yet
    cy.get('form.primer-row').should('exist');
    // Should have empty helper text
    cy.get('form.primer-row .MuiFormHelperText-root').should('have.text', '');
    // The submit button is not shown until something is typed
    cy.get('form.primer-row [data-testid="CheckCircleIcon"]').should('not.exist');

    // Type existing name
    cy.get('form.primer-row input#name').type('fwd');
    cy.get('form.primer-row .MuiFormHelperText-root#name-helper-text').contains('Name exists');
    formNotSubmittable();
    cy.get('form.primer-row input#name').clear('');
    cy.get('form.primer-row .MuiFormHelperText-root#name-helper-text').should('have.text', 'Field required');
    cy.get('form.primer-row input#name').type('fwd-2');
    cy.get('form.primer-row .MuiFormHelperText-root#name-helper-text').should('have.text', '');
    formNotSubmittable();

    // Type non-DNA sequence
    cy.get('form.primer-row input#sequence').type('yy');
    cy.get('form.primer-row .MuiFormHelperText-root#sequence-helper-text').contains('Invalid DNA sequence');
    formNotSubmittable();
    cy.get('form.primer-row input#sequence').clear('');
    cy.get('form.primer-row .MuiFormHelperText-root#sequence-helper-text').should('have.text', 'Field required');
    cy.get('form.primer-row input#sequence').type('atg');
    cy.get('form.primer-row .MuiFormHelperText-root#sequence-helper-text').should('have.text', '');
    cy.get('form.primer-row [data-testid="CheckCircleIcon"]').should('not.have.class', 'form-invalid');
    cy.get('form.primer-row [data-testid="CheckCircleIcon"]').click();
    cy.get('form.primer-row').should('not.exist');
  });
  it('Edit overrides add', () => {
    cy.get('.primer-form-container').contains('Add Primer').click();
    cy.get('form.primer-row').should('exist');
    // Type something
    cy.get('form.primer-row input#name').type('fwd-2');
    cy.get('form.primer-row input#sequence').type('atg');
    // Click on edit
    cy.get('.primer-table-container [data-testid="EditIcon"]').first().click();
    cy.get('form.primer-row input#name').should('not.have.value', 'fwd-2');
    cy.get('.primer-form-container [data-testid="CancelIcon"').click();
    cy.get('form.primer-row').should('not.exist');
    cy.get('.primer-form-container').contains('Add Primer');
    cy.get('.primer-table-container tr').contains('fwd').should('exist');
    cy.get('.primer-table-container tr').contains('gatctcgccataaaagacag').should('exist');
  });
});
