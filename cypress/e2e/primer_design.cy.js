import { addSource, changeTab, checkInputValue, clearAutocompleteValue, clearInputValue, clickMultiSelectOption, deleteSourceByContent, loadExample, manuallyTypeSequence, setAutocompleteValue, setInputValue, skipGoogleSheetErrors, skipNcbiCheck } from './common_functions';

describe('Test primer designer functionality', () => {
  beforeEach(() => {
    cy.visit('/');
    // Intercepts must be in this order
    skipGoogleSheetErrors();
    skipNcbiCheck();
  });

  it('Homologous recombination primer design', () => {
    loadExample('Integration of cassette by homologous recombination');

    // Delete the source that says "PCR with primers"
    deleteSourceByContent('PCR with primers');
    addSource('PCRSource');

    // Click on design primers
    cy.get('button').contains('Design primers').click();

    clickMultiSelectOption('Purpose of primers', 'Homologous Recombination', 'li');
    clickMultiSelectOption('Target sequence', '6', 'li');
    cy.get('button').contains('Design primers').click();

    // We should be now on the Sequence tab
    cy.get('button.MuiTab-root.Mui-selected').contains('Sequence').should('exist');

    // Go back to the cloning tab and check that the button is displayed
    cy.get('button.MuiTab-root').contains('Cloning').click();
    cy.get('button').filter(':contains("Design primers")').should('have.length', 1);

    // Click it, should bring us back to the Sequence tab
    cy.get('button').contains('Design primers').click();
    cy.get('button.MuiTab-root.Mui-selected').contains('Sequence').should('exist');

    // Moving between tabs displays the right sequence
    cy.contains('span', 'pFA6a-5FLAG-hphMX6').should('be.visible');

    cy.get('button.MuiTab-root').contains('Replaced region').click();
    cy.contains('span', 'pFA6a-5FLAG-hphMX6').should('exist');
    cy.contains('span', 'CU329670').should('be.visible');

    cy.get('button.MuiTab-root').contains('Other settings').click();
    cy.contains('span', 'pFA6a-5FLAG-hphMX6').should('exist');
    cy.contains('span', 'CU329670').should('exist');

    // It should not be possible to submit without settings the regions
    cy.contains('button', 'Design primers').should('exist');

    // Back to the first tab
    cy.get('button.MuiTab-root').contains('Amplified region').click();

    // Click before having selected anything, should show an error
    cy.get('button').contains('Set from selection').click();
    cy.get('.main-sequence-editor div.MuiAlert-standardError').contains('You have to select a region in the sequence editor');

    // We should not be able to select a single position in the sequence
    // Click on the name, that should set a single position selection
    cy.contains('span', 'pFA6a-5FLAG-hphMX6').click({ force: true });
    cy.get('button').contains('Set from selection').click();
    cy.get('.main-sequence-editor div.MuiAlert-standardError').contains('Select a region (not a single position) to amplify');

    // Click on the hphMX6 feature
    cy.contains('svg', 'hphMX6').click();
    cy.get('button').contains('Set from selection').click();

    // We still should not be able to submit
    cy.get('button.MuiTab-root').contains('Other settings').click();
    cy.contains('.primer-design button', 'Design primers').should('not.exist');

    // Go to replaced region tab, and select a single position
    cy.get('button.MuiTab-root').contains('Replaced region').click();
    cy.contains('span', 'CU329670').click({ force: true });
    cy.get('button').contains('Set from selection').click();

    // There should be no error message, but there is an info one, so we need that class
    cy.get('.main-sequence-editor div.MuiAlert-standardError').should('not.exist');

    // Go to "Other settings" tab
    cy.get('button.MuiTab-root').contains('Other settings').click();
    // They will turn into 80, 50, 20 when written, since it's a number input and they write on top of the zero
    const newValues = [8, 5, 2];
    ['Homology length', 'Target hybridization Tm', 'Min. hybridization length'].forEach((label, index) => {
      setInputValue(label, '0', '.primer-design');
      cy.get('button').contains('Design primers').should('exist');
      setInputValue(label, newValues[index], '.primer-design');
      cy.get('button').contains('Design primers').should('be.visible');
    });

    // Get an error for very high hyb. length
    setInputValue('Min. hybridization length', '100000', '.primer-design');
    cy.get('button').contains('Design primers').click();
    cy.get('.main-sequence-editor div.MuiAlert-standardError').should('exist');
    clearInputValue('Min. hybridization length', '.primer-design');
    setInputValue('Min. hybridization length', '2', '.primer-design');

    // Change values
    setInputValue('Homology length', '2', '.primer-design');
    setInputValue('Target hybridization Tm', '3', '.primer-design');
    setInputValue('Min. hybridization length', '1', '.primer-design');

    // Verify that the right values are being submitted
    cy.intercept({ method: 'POST', url: 'http://127.0.0.1:8000/primer_design/homologous_recombination*', times: 2 }, (req) => {
      req.reply({
        forceNetworkError: true,
      });
    }).as('primerDesign');
    cy.get('button').contains('Design primers').click();
    cy.wait('@primerDesign').then((interception) => {
      expect(interception.request.query.homology_length).to.equal('20');
      expect(interception.request.query.target_tm).to.equal('30');
      expect(interception.request.query.minimal_hybridization_length).to.equal('10');
    });

    // Back to default values
    setInputValue('Homology length', '8', '.primer-design');
    setInputValue('Min. hybridization length', '2', '.primer-design');
    setInputValue('Target hybridization Tm', '6', '.primer-design');

    // Design the primers
    cy.get('button').contains('Design primers').click();

    // We should be now in the Results tab
    cy.get('button.MuiTab-root.Mui-selected').contains('Results').should('exist');

    // These should be two primers: forward and reverse
    cy.get('.primer-design-form input').first().should('have.value', 'forward');
    cy.get('.primer-design-form input').eq(2).should('have.value', 'reverse');
    cy.contains('button', 'Save primers').click();

    // This should have sent us to the Cloning tab
    cy.get('button.MuiTab-root.Mui-selected').contains('Cloning').should('exist');

    // They should be present in the primers tab
    cy.get('button.MuiTab-root').contains('Primers').click();
    cy.contains('td', 'forward').should('exist');
    cy.contains('td', 'reverse').should('exist');

    // Do the PCR
    cy.get('button.MuiTab-root').contains('Cloning').click();
    cy.get('button').contains('Perform PCR').click();

    // Do the recombination
    cy.get('button').contains('Recombine').click();

    // There should be no errors shown
    cy.get('.main-sequence-editor div.MuiAlert-standardError').should('not.exist');

    cy.contains('li', 'PCR with primers forward and reverse').should('exist');
    cy.contains('li', 'Homologous recombination').should('exist');
  });

  it('Gibson assembly primer design', () => {
    loadExample('Gibson assembly');

    // Delete both sources that say "PCR with primers"
    deleteSourceByContent('PCR with primers');
    deleteSourceByContent('PCR with primers');
    addSource('PCRSource');

    // Click on design primers
    cy.get('button').contains('Design primers').click();
    clickMultiSelectOption('Purpose of primers', 'Gibson Assembly', 'li');
    clickMultiSelectOption('Input sequences', '4', 'li');

    cy.get('button').contains('Design primers').click();

    // We should be now in the Sequence tab
    cy.get('button.MuiTab-root.Mui-selected').contains('Sequence').should('exist');

    // There should be three tabs: Seq 2, Seq 4 and Other settings
    cy.get('.main-sequence-editor button.MuiTab-root').should('have.length', 3);
    cy.get('.main-sequence-editor button.MuiTab-root.Mui-selected').contains('Seq 2').should('exist');
    cy.get('.main-sequence-editor button.MuiTab-root').contains('Seq 4').should('exist');
    cy.get('.main-sequence-editor button.MuiTab-root').contains('Other settings').should('exist');

    // We cannot submit without setting the regions
    cy.get('button.MuiTab-root').contains('Other settings').click();
    cy.contains('.main-sequence-editor button', 'Design primers').should('not.exist');

    // The current tab should be "Seq 2" and it displays the sequence pREP42-MCS+
    cy.get('.main-sequence-editor button.MuiTab-root').first().click();
    cy.get('.main-sequence-editor').should('contain', 'pREP42-MCS+');
    // Error if setting without selection
    cy.get('button').contains('Set from selection').click();
    cy.get('.main-sequence-editor div.MuiAlert-standardError').should('exist');
    // Error if setting with single position selection
    cy.get('.main-sequence-editor').contains('pREP42-MCS+').click({ force: true });
    cy.get('button').contains('Set from selection').click();
    cy.get('.main-sequence-editor div.MuiAlert-standardError').should('exist');
    // Select ars1 feature
    cy.contains('svg', 'ars1').click();
    cy.get('button').contains('Set from selection').click();
    cy.get('.main-sequence-editor div.MuiAlert-standardError').should('not.exist');

    // Go to next tab
    cy.get('.main-sequence-editor button.MuiTab-root').contains('Seq 4').click();
    cy.get('.main-sequence-editor').should('contain', 'NC_003424');
    // select ase1 region
    cy.contains('svg', 'ase1').first().click();
    cy.get('button').contains('Set from selection').click();
    cy.get('.main-sequence-editor div.MuiAlert-standardError').should('not.exist');

    // Go to Other settings tab
    cy.get('.main-sequence-editor button.MuiTab-root').contains('Other settings').click();

    // Initially ars1 is not reversed
    cy.contains('svg g', 'ars1').should('not.have.class', 'ann-reverse');

    // Click on the Reverse radio button
    cy.get('table span').contains('Reverse').first().click({ force: true });
    cy.contains('svg g', 'ars1').should('have.class', 'ann-reverse');
    cy.get('table span').contains('Reverse').first().click({ force: true });

    // Click on the Circular assembly button
    cy.get('span').contains('Circular assembly').click({ force: true });

    // Submit a high hybridization to get an error
    setInputValue('Min. hybridization length', '100000', '.primer-design');
    cy.get('button').contains('Design primers').click();
    cy.get('.main-sequence-editor div.MuiAlert-standardError').should('exist');
    clearInputValue('Min. hybridization length', '.primer-design');
    setInputValue('Min. hybridization length', '2', '.primer-design');

    // Add spacers
    cy.get('label').contains('Spacer sequences').siblings('button').click({ force: true });
    cy.get('.primer-spacer-form input').first().type('AAAAAAAAA');
    cy.get('.primer-spacer-form input').last().type('CCCCCCCCC');

    // Verify that the right values are being submitted
    setInputValue('Homology length', '2', '.primer-design');
    setInputValue('Min. hybridization length', '3', '.primer-design');
    setInputValue('Target hybridization Tm', '3', '.primer-design');
    // For some reason, we need to intercept twice
    cy.intercept({ method: 'POST', url: 'http://127.0.0.1:8000/primer_design/gibson_assembly*', times: 2 }, (req) => {
      req.reply({
        forceNetworkError: true,
      });
    }).as('primerDesign');
    cy.get('.main-sequence-editor button').contains('Design primers').click();
    cy.wait('@primerDesign').then((interception) => {
      expect(interception.request.query.homology_length).to.equal('20');
      expect(interception.request.query.minimal_hybridization_length).to.equal('30');
      expect(interception.request.query.target_tm).to.equal('30');
    });

    // Back to sensible values
    setInputValue('Homology length', '3', '.primer-design');
    setInputValue('Min. hybridization length', '2', '.primer-design');
    setInputValue('Target hybridization Tm', '6', '.primer-design');

    // Design the primers
    cy.get('.main-sequence-editor button').contains('Design primers').click();

    // There should be the correct names of the primers
    cy.get('.primer-design-form input').first().should('have.value', 'pREP42-MCS+_fwd');
    cy.get('.primer-design-form input').eq(2).should('have.value', 'pREP42-MCS+_rvs');
    cy.get('.primer-design-form input').eq(4).should('have.value', 'NC_003424_fwd');
    cy.get('.primer-design-form input').eq(6).should('have.value', 'NC_003424_rvs');

    // Check that the primers are correct
    cy.get('.primer-design-form input').eq(1).invoke('val').should('match', /CCCCCCCCC/);
    cy.get('.primer-design-form input').eq(3).invoke('val').should('match', /TTTTTTTTT/);
    cy.get('.primer-design-form input').eq(5).invoke('val').should('match', /AAAAAAAAA/);
    cy.get('.primer-design-form input').eq(7).invoke('val').should('match', /GGGGGGGGG/);

    // Save the primers
    cy.get('button').contains('Save primers').click();

    // This should have sent us to the Cloning tab
    cy.get('button.MuiTab-root.Mui-selected').contains('Cloning').should('exist');

    // Do the PCRs
    cy.get('button').contains('Perform PCR').first().click();
    cy.get('button').contains('Perform PCR').last().click();

    // Do the Gibson assembly
    cy.get('button').contains('Submit').first().click();

    // There should be no errors shown
    cy.get('.main-sequence-editor div.MuiAlert-standardError').should('not.exist');

    cy.contains('li', 'PCR with primers pREP42-MCS+_fwd and pREP42-MCS+_rvs').should('exist');
    cy.contains('li', 'PCR with primers NC_003424_fwd and NC_003424_rvs').should('exist');
    cy.contains('li', 'Gibson assembly').should('exist');
  });

  it('In-Fusion primer design', () => {
    loadExample('Gibson assembly');

    // Delete both sources that say "PCR with primers"
    deleteSourceByContent('PCR with primers');
    deleteSourceByContent('PCR with primers');
    addSource('PCRSource');

    // Click on design primers
    cy.get('button').contains('Design primers').click();
    clickMultiSelectOption('Purpose of primers', 'In-Fusion', 'li');
    clickMultiSelectOption('Input sequences', '4', 'li');

    cy.get('button').contains('Design primers').click();

    // We should be now in the Sequence tab
    cy.get('button.MuiTab-root.Mui-selected').contains('Sequence').should('exist');

    // There should be three tabs: Seq 2, Seq 4 and Other settings (if we get here, the rest is the same as Gibson assembly)
    cy.get('.main-sequence-editor button.MuiTab-root').should('have.length', 3);

    // Double-check that the right source was created
    changeTab('Cloning');
    cy.get('.share-your-cloning li').contains('In-Fusion').should('exist');
  });

  it('Restriction ligation primer design', () => {
    const sequence = 'ATCTAACTTTACTTGGAAAGCGTTTCACGT';
    manuallyTypeSequence(sequence);
    addSource('PCRSource');

    // Click on design primers
    cy.get('button').contains('Design primers').click();
    clickMultiSelectOption('Purpose of primers', 'Restriction and Ligation', 'li');

    // We should be on the Sequence tab
    cy.get('button.MuiTab-root.Mui-selected').contains('Sequence').should('exist');

    // Error if setting without selection
    cy.get('button').contains('Set from selection').click();
    cy.get('.main-sequence-editor div.MuiAlert-standardError').should('exist');

    // Click on axis tick 1
    cy.get('.veAxisTick[data-test="1"]').first().click();

    // Click on axis tick 30 while holding shift
    cy.get('.veAxisTick[data-test="30"]').first().click({ shiftKey: true });

    // Set selection
    cy.get('button').contains('Set from selection').click();

    // Go to other settings tab
    cy.get('button.MuiTab-root').contains('Other settings').click();

    // Set the other settings (Impossible to remove the zero)
    setInputValue('Min. hybridization length', '1', '.primer-design');
    setInputValue('Target hybridization Tm', '4', '.primer-design');
    // Cannot submit without setting enzymes
    cy.contains('.primer-design button', 'Design primers').should('not.exist');

    // One enzyme is enough to submit, either one
    setAutocompleteValue('Left enzyme', 'EcoRI', '.primer-design');
    cy.contains('.primer-design button', 'Design primers').should('exist');
    cy.get('.veCutsiteLabel').filter(':contains("EcoRI")').should('exist');
    clearAutocompleteValue('Left enzyme', '.primer-design');
    cy.get('.veCutsiteLabel').should('not.exist');

    cy.contains('.primer-design button', 'Design primers').should('not.exist');
    setAutocompleteValue('Right enzyme', 'BamHI', '.primer-design');
    cy.contains('.primer-design button', 'Design primers').should('exist');
    cy.get('.veCutsiteLabel').filter(':contains("BamHI")').should('exist');

    // There should be a single primer tail feature displayed
    cy.get('.veLabelText').filter(':contains("primer tail")').should('have.length', 1);
    setAutocompleteValue('Left enzyme', 'EcoRI', '.primer-design');

    // There should be two now
    cy.get('.veCutsiteLabel').filter(':contains("BamHI")').should('exist');
    cy.get('.veCutsiteLabel').filter(':contains("EcoRI")').should('exist');
    cy.get('.veLabelText').filter(':contains("primer tail")').should('have.length', 2);
    // Go to sequence tab
    cy.get('.veTabSequenceMap').contains('Sequence Map').click();
    // Check that the right sequence is displayed
    const selectedSequence = sequence.slice(1).toLowerCase();
    cy.get('svg.rowViewTextContainer text').contains(`TTTgaattc${selectedSequence}ggatccAAA`);

    // Add spacers
    cy.get('label').contains('Spacer sequences').siblings('button').click({ force: true });
    setInputValue('Before', 'AAA', '.primer-spacer-form');
    setInputValue('After', 'CCC', '.primer-spacer-form');
    cy.get('svg.rowViewTextContainer text').contains(`TTTgaattcAAA${selectedSequence}CCCggatccAAA`);

    // Create primers and check that the right values are being submitted
    cy.intercept({ method: 'POST', url: 'http://127.0.0.1:8000/primer_design/simple_pair*', times: 2 }).as('primerDesign');
    cy.get('button').contains('Design primers').click();
    cy.wait('@primerDesign').then((interception) => {
      expect(interception.request.query.minimal_hybridization_length).to.equal('10');
      expect(interception.request.query.target_tm).to.equal('40');
      expect(interception.request.query.left_enzyme_inverted).to.equal('false');
      expect(interception.request.query.right_enzyme_inverted).to.equal('false');
    });

    // We should be on the Results tab
    cy.get('button.MuiTab-root.Mui-selected').contains('Results').should('exist');

    // Check that the primers are correct
    cy.get('.primer-design-form input').first().should('have.value', 'seq_2_EcoRI_fwd');
    cy.get('.primer-design-form input').eq(1).invoke('val').should('match', /^TTTGAATTCAAA/);
    cy.get('.primer-design-form input').eq(2).should('have.value', 'seq_2_BamHI_rvs');
    cy.get('.primer-design-form input').eq(3).invoke('val').should('match', /^TTTGGATCCGGG/);

    // Save the primers
    cy.get('button').contains('Save primers').click();

    // This should have sent us to the Cloning tab
    cy.get('button.MuiTab-root.Mui-selected').contains('Cloning').should('exist');

    // Do the PCR
    // Set minimal annealing to 10
    setInputValue('Minimal annealing', '10', '.share-your-cloning');
    cy.get('button').contains('Perform PCR').click();

    // Check that the PCR was successful
    cy.get('li').contains('PCR with primers seq_2_EcoRI_fwd and seq_2_BamHI_rvs').should('exist');
  });

  it('Restriction ligation primer design - invert site', () => {
    const sequence = 'ATCTAACTTTACTTGGAAAGCGTTTCACGT'.toLowerCase();
    manuallyTypeSequence(sequence);
    addSource('PCRSource');
    const ampSequence = sequence.slice(1, 30);

    // Click on design primers
    cy.get('button').contains('Design primers').click();
    clickMultiSelectOption('Purpose of primers', 'Restriction and Ligation', 'li');

    // Click on axis tick 1
    cy.get('.veAxisTick[data-test="1"]').first().click({ force: true });

    // Click on axis tick 30 while holding shift
    cy.get('.veAxisTick[data-test="30"]').first().click({ shiftKey: true });

    // Set selection
    cy.get('button').contains('Set from selection').click();

    // Go to other settings tab
    cy.get('button.MuiTab-root').contains('Other settings').click();

    // Select EcoRI, should not be possible to select inverted
    setAutocompleteValue('Left enzyme', 'EcoRI', '.primer-design');
    cy.get('.primer-design').contains('Invert site').should('not.exist');

    // Should be possible to select when BsaI is selected
    setAutocompleteValue('Left enzyme', 'BsaI', '.primer-design');
    cy.get('.primer-design').contains('Invert site').should('exist');

    // Go to sequence tab
    cy.get('.veTabSequenceMap').contains('Sequence Map').click();

    // THere should be the forward sequence displayed:
    cy.get('svg.rowViewTextContainer text').contains(`TTTggtctc${ampSequence}`);

    // Invert the site, should show the reverse sequence
    cy.get('.primer-design').contains('Invert site').click();
    cy.get('svg.rowViewTextContainer text').contains(`TTTgagacc${ampSequence}`);

    // Select EcoRI, should not be possible to select inverted
    setAutocompleteValue('Right enzyme', 'EcoRI', '.primer-design');
    cy.get('.primer-design span').filter(':contains("Invert site")').should('have.length', 1);

    // Should be possible to select when BsaI is selected
    setAutocompleteValue('Right enzyme', 'BsaI', '.primer-design');
    cy.get('.primer-design span').filter(':contains("Invert site")').should('have.length', 2);
    cy.get('svg.rowViewTextContainer text').contains(`TTTgagacc${ampSequence}gagaccAAA`);
    cy.get('.primer-design span').filter(':contains("Invert site")').eq(1).click();
    cy.get('svg.rowViewTextContainer text').contains(`TTTgagacc${ampSequence}ggtctcAAA`);

    // Change PCR settings
    setInputValue('Min. hybridization length', '1', '.primer-design');
    setInputValue('Target hybridization Tm', '4', '.primer-design');

    // Submit and check that the right values are being submitted
    cy.intercept({ method: 'POST', url: 'http://127.0.0.1:8000/primer_design/simple_pair*', times: 2 }).as('primerDesign');
    cy.get('button').contains('Design primers').click();
    cy.wait('@primerDesign').then((interception) => {
      expect(interception.request.query.left_enzyme_inverted).to.equal('true');
      expect(interception.request.query.right_enzyme_inverted).to.equal('true');
    });

    // We should be on the Results tab
    cy.get('button.MuiTab-root.Mui-selected').contains('Results').should('exist');

    // Check that the primers are correct
    cy.get('.primer-design-form input').eq(1).invoke('val').should('match', /^TTTGAGACC/);
    cy.get('.primer-design-form input').eq(3).invoke('val').should('match', /^TTTGAGACC/);
  });

  it('Simple pair primer design', () => {
    const sequence = 'ATCTAACTTTACTTGGAAAGCGTTTCACGT';
    manuallyTypeSequence(sequence);
    addSource('PCRSource');

    // Click on design primers
    cy.get('button').contains('Design primers').click();
    clickMultiSelectOption('Purpose of primers', 'Normal PCR', 'li');

    // We should be on the Sequence tab
    cy.get('button.MuiTab-root.Mui-selected').contains('Sequence').should('exist');

    // Error if setting without selection
    cy.get('button').contains('Set from selection').click();
    cy.get('.main-sequence-editor div.MuiAlert-standardError').should('exist');

    // Click on axis tick 1
    cy.get('.veAxisTick[data-test="1"]').first().click();

    // Click on axis tick 30 while holding shift
    cy.get('.veAxisTick[data-test="30"]').first().click({ shiftKey: true });

    // Set selection
    cy.get('button').contains('Set from selection').click();

    // Go to other settings tab
    cy.get('button.MuiTab-root').contains('Other settings').click();

    // Set the other settings (Impossible to remove the zero)
    setInputValue('Min. hybridization length', '1', '.primer-design');
    setInputValue('Target hybridization Tm', '4', '.primer-design');
    cy.get('table span').contains('Reverse').first().click({ force: true });
    // Submit and check that the right values are being submitted
    cy.intercept({ method: 'POST', url: 'http://127.0.0.1:8000/primer_design/simple_pair*', times: 2 }).as('primerDesign');
    cy.get('button').contains('Design primers').click();
    cy.wait('@primerDesign').then((interception) => {
      expect(interception.request.query.minimal_hybridization_length).to.equal('10');
      expect(interception.request.query.target_tm).to.equal('40');
      expect(interception.request.body.pcr_template.forward_orientation).to.equal(false);
    });

    // We should be on the Results tab
    cy.get('button.MuiTab-root.Mui-selected').contains('Results').should('exist');

    // Check that the primers are correct
    cy.get('.primer-design-form input').first().should('have.value', 'seq_2_fwd');
    cy.get('.primer-design-form input').eq(2).should('have.value', 'seq_2_rvs');

    // Save the primers
    cy.get('button').contains('Save primers').click();

    // This should have sent us to the Cloning tab
    cy.get('button.MuiTab-root.Mui-selected').contains('Cloning').should('exist');

    // Do the PCR
    // Set minimal annealing to 10
    setInputValue('Minimal annealing', '10', '.share-your-cloning');
    cy.get('button').contains('Perform PCR').click();

    // Check that the PCR was successful
    cy.get('li').contains('PCR with primers seq_2_fwd and seq_2_rvs').should('exist');
  });
  it('Gateway BP primer design', () => {
    loadExample('Gateway');
    deleteSourceByContent('PCR with primers');
    addSource('PCRSource');
    cy.get('button').contains('Design primers').click();
    clickMultiSelectOption('Purpose of primers', 'Gateway BP reaction', 'li');
    // No alert is visible (Request is not sent)
    cy.get('.share-your-cloning div.MuiAlert-standardError').should('not.exist');
    // Select the wrong donor vector
    clickMultiSelectOption('Donor vector', '6', 'li');
    cy.get('.share-your-cloning div.MuiAlert-standardError').contains('At least two').should('exist');
    // Also shows the att sites present in the wrong donor vector
    cy.get('.share-your-cloning div.MuiAlert-standardError').contains('attR1').should('exist');
    // Select the correct donor vector
    clickMultiSelectOption('Donor vector', '4', 'li');
    cy.get('button').contains('Design primers').click();

    // We should be on the Sequence tab
    cy.get('button.MuiTab-root.Mui-selected').contains('Sequence').should('exist');
    // Go back to the Cloning tab
    changeTab('Cloning');
    // Check that the right source was created
    cy.get('.share-your-cloning li').contains('Gateway').should('exist');
    // Go back to design primers
    cy.get('.share-your-cloning button').contains('Design primers').click();
    // We should be on the Sequence tab
    cy.get('button.MuiTab-root.Mui-selected').contains('Sequence').should('exist');

    // Click before having selected anything, should show an error
    cy.get('button').contains('Set from selection').click();
    cy.get('.main-sequence-editor div.MuiAlert-standardError').contains('You have to select a region in the sequence editor');

    // We should not be able to select a single position in the sequence
    // Click on the name, that should set a single position selection
    cy.contains('span', 'NC_000913').click({ force: true });
    cy.get('button').contains('Set from selection').click();
    cy.get('.main-sequence-editor div.MuiAlert-standardError').contains('Select a region (not a single position) to amplify');

    cy.get('svg.veRowViewAnnotationPosition title').filter(':contains("Feature (CDS) - lacZ")').first().click({ force: true });
    cy.get('button').contains('Set from selection').click();
    cy.get('.main-sequence-editor div.MuiAlert-standardError').should('not.exist');

    // We still should not be able to submit
    cy.get('button.MuiTab-root').contains('Other settings').click();
    cy.contains('.primer-design button', 'Design primers').should('not.exist');

    // Select the att sites
    cy.get('button.MuiTab-root').contains('Replaced region').click();
    clickMultiSelectOption('Left attP site', 'attP2', '.primer-design');
    // The other site should have been set to attP1
    checkInputValue('Right attP site', 'attP1-[569:801](+)', '.primer-design');
    // There should be an error
    cy.contains('.primer-design div.MuiAlert-standardError', 'No recommended primer tails found').should('exist');

    // Invert the selection
    clickMultiSelectOption('Right attP site', 'attP2', '.primer-design');
    checkInputValue('Left attP site', 'attP1-[569:801](+)', '.primer-design');

    // There should be an info message
    cy.contains('.primer-design div.MuiAlert-standardInfo', 'Primers tails designed based on pDONR™ 221').should('exist');

    // We still should not be able to submit (there should be Ns in the nucleotide sequences)
    cy.get('button.MuiTab-root').contains('Other settings').click();
    cy.contains('.primer-design button', 'Design primers').should('not.exist');

    // Check that spacers contain right values
    cy.get('.primer-spacer-form input').first().should('have.value', 'GGGGACAAGTTTGTACAAAAAAGCAGGCTNN');
    cy.get('.primer-spacer-form input').eq(1).should('have.value', 'NACCCAGCTTTCTTGTACAAAGTGGTCCCC');

    // Because there are Ns, there should be an error
    cy.get('.primer-design p').filter(':contains("Invalid DNA sequence")').should('have.length', 2);

    // Replace the Ns with valid sequences
    setInputValue('Before', 'GGGGACAAGTTTGTACAAAAAAGCAGGCTAA', '.primer-spacer-form');
    setInputValue('After', 'TACCCAGCTTTCTTGTACAAAGTGGTCCCC', '.primer-spacer-form');

    // We should be able to submit now
    cy.get('button').contains('Design primers').should('exist');

    // There should be two primer tails and two translation frames features
    cy.get('.veLabelText').filter(':contains("primer tail")').should('have.length', 2);
    cy.get('.veLabelText').filter(':contains("translation frame")').should('have.length', 2);

    // Check that their coordinates are correct
    cy.get('.veLabel[title*="primer tail - Start: 1 End: 31"]').should('exist');
    cy.get('.veLabel[title*="translation frame - Start: 5 End: 31"]').should('exist');
    cy.get('.veLabel[title*="primer tail - Start: 3107 End: 3136"]').should('exist');
    cy.get('.veLabel[title*="translation frame - Start: 3107 End: 3130"]').should('exist');

    // Adding an out of frame spacer in the before spacer gives an X incomplete aminoacid
    cy.get('div.veTabSequenceMap').contains('Sequence Map').click();
    cy.get('div.mainEditor path.X').should('not.exist');
    setInputValue('Before', 'GGGGACAAGTTTGTACAAAAAAGCAGGCTAAaa', '.primer-spacer-form');
    cy.get('div.mainEditor path.X').should('exist');
    cy.get('div.veTabLinearMap').contains('Linear Map').click();
    cy.get('.veLabel[title*="translation frame - Start: 5 End: 33"]').should('exist');
    setInputValue('Before', 'GGGGACAAGTTTGTACAAAAAAGCAGGCTAA', '.primer-spacer-form');

    // Adding an out of frame spacer in the after spacer sequence makes a gap

    // Click on the second primer tail to focus sequence map there
    cy.get('.veLabelText').filter(':contains("primer tail")').eq(1).click({ force: true });

    cy.get('div.veTabSequenceMap').contains('Sequence Map').click();
    cy.get('.tg-editor-container').contains('path.X').should('not.exist');
    setInputValue('After', 'aaTACCCAGCTTTCTTGTACAAAGTGGTCCCC', '.primer-spacer-form');
    cy.get('.tg-editor-container').contains('path.X').should('not.exist');

    cy.get('div.veTabLinearMap').contains('Linear Map').click();
    cy.get('.veLabel[title*="translation frame - Start: 3109 End: 3132"]').should('exist');
    setInputValue('After', 'TACCCAGCTTTCTTGTACAAAGTGGTCCCC', '.primer-spacer-form');

    // Click on design primers
    cy.get('button').contains('Design primers').click();

    // We should be on the Results tab
    cy.get('button.MuiTab-root.Mui-selected').contains('Results').should('exist');

    // Check that the names are correct
    cy.get('.primer-design-form input').first().should('have.value', 'NC_000913_fwd');
    cy.get('.primer-design-form input').eq(2).should('have.value', 'NC_000913_rvs');

    // Save the primers
    cy.get('button').contains('Save primers').click();

    // This should have sent us to the Cloning tab
    cy.get('button.MuiTab-root.Mui-selected').contains('Cloning').should('exist');

    // Do the PCR
    cy.get('button').contains('Perform PCR').click();

    // Check that the PCR was successful
    cy.get('li').contains('PCR with primers NC_000913_fwd and NC_000913_rvs').should('exist');

    // Do the BP reaction
    cy.get('.share-your-cloning li button').contains('Submit').click();

    // Check that the BP reaction was successful
    cy.get('li#source-9').contains('Gateway BP reaction').should('exist');
  });
});
