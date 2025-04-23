export function addSource(sourceType, isFirst = false, index = 0) {
  if (!isFirst) {
    cy.get('svg[data-testid="AddCircleIcon"]').eq(index).click();
  }
  cy.get('#tab-panel-0 .select-source h2.empty-source-title').siblings('div').children('.MuiInputBase-root')
    .click();
  cy.get(`li[data-value="${sourceType}"]`).click();
}

export function addLane() {
  cy.get('svg[data-testid="AddCircleIcon"]').last().click();
}

export function clearPrimers() {
  // click on [data-testid="DeleteIcon"] until there are no more
  cy.get('button.MuiTab-root').contains('Primers').click();
  cy.get('.primer-table-container [data-testid="DeleteIcon"]').each((el) => {
    cy.get('.primer-table-container [data-testid="DeleteIcon"]').first().click();
  });
  cy.get('button.MuiTab-root').contains('Cloning').click();
}

export function addPrimer(name, seq) {
  cy.get('button.MuiTab-root').contains('Primers').click();
  cy.get('.primer-form-container').contains('Add Primer').click();
  cy.get('form.primer-row input#name').type(name, { delay: 0 });
  cy.get('form.primer-row input#sequence').type(seq, { delay: 0 });
  cy.get('form.primer-row [data-testid="CheckCircleIcon"]').click();
  cy.get('button.MuiTab-root').contains('Cloning').click();
}

export function clickMultiSelectOption(label, option, parentSelector = 'div.App', constainsSettings = {}) {
  cy.get(parentSelector).contains(label).siblings('div').first()
    .click();
  cy.get('div[role="presentation"]').contains(option, constainsSettings).click();
  // Click outside
  cy.get('body').click(0, 0);
}

export function setInputValue(label, value, parentSelector = '') {
  cy.get(parentSelector).contains(label).siblings('div').first()
    .children('input')
    .clear('');
  cy.get(parentSelector).contains(label).siblings('div').first()
    .children('input')
    .type(value);
}

export function setAutocompleteValue(label, value, parentSelector = '') {
  setInputValue(label, value, parentSelector);
  // We use the regex so that its the exact match
  cy.get('div[role="presentation"]').contains(new RegExp(`^${value}$`)).click();
}

export function clearAutocompleteValue(label, parentSelector = '') {
  cy.get(parentSelector).contains(label).siblings('div').click();
  cy.get(parentSelector).contains(label).siblings('div').find('button.MuiAutocomplete-clearIndicator')
    .first()
    .click();
}

export function clearInputValue(label, parentSelector = '') {
  cy.get(parentSelector).contains(label).siblings('div').first()
    .children('input')
    .clear('');
}

export function checkInputValue(label, value, parentSelector = '') {
  cy.get(parentSelector).contains(label).siblings('div').first()
    .children('input')
    .should('have.value', value);
}

export function clickSequenceOutputArrow(parentSelector, isRight = true) {
  cy.get(`${parentSelector} .multiple-output-selector [data-testid="${isRight ? 'ArrowForwardIcon' : 'ArrowReverseIcon'}"]`).click();
}

export function loadHistory(filePath) {
  cy.get('.MuiToolbar-root .MuiButtonBase-root').contains('File').siblings('input').selectFile(filePath, { force: true });
}

export function deleteSourceById(id) {
  cy.get(`#source-${id} [data-testid="DeleteIcon"]`).first().click();
  // If a dialog opens, click the delete button
  cy.get('body').then(($body) => {
    if ($body.find('.verify-delete-dialog').length > 0) {
      cy.get('.verify-delete-dialog .MuiButtonBase-root').contains('Delete').click();
    }
  });
}

export function deleteSourceByContent(content) {
  cy.get('.open-cloning').contains(content).closest('div.select-source').find('[data-testid="DeleteIcon"]')
    .click();
  // If a dialog opens, click the delete button
  // Check if the dialog exists before attempting to interact with it
  cy.get('body').then(($body) => {
    if ($body.find('.verify-delete-dialog').length > 0) {
      cy.get('.verify-delete-dialog .MuiButtonBase-root').contains('Delete').click();
    }
  });
}

export function manuallyTypeSequence(seq, circular = false, overhangs = []) {
  cy.get('#tab-panel-0 .select-source h2').last().closest('.source-node').invoke('attr', 'id')
    .then((sourceId) => {
      cy.get('#tab-panel-0 .select-source h2.empty-source-title').last().siblings('div')
        .children('.MuiInputBase-root')
        .click();
      cy.get('li[data-value="ManuallyTypedSource"]').click();
      cy.get('#tab-panel-0 #sequence').clear('');
      cy.get('#tab-panel-0 #sequence').type(seq);
      if (circular) {
        cy.get('#tab-panel-0 span').contains('Circular DNA').click();
      }
      if (overhangs.length > 0) {
        const [left, right] = overhangs;
        setInputValue('Overhang crick 3\'', `${left}`, '#tab-panel-0');
        setInputValue('Overhang watson 3\'', `${right}`, '#tab-panel-0');
      }
      cy.get('.select-source > form > .MuiButtonBase-root').click();

      cy.get(`.sequence-node #${sourceId}`, { timeout: 20000 }).should('exist');
    });
}

export function waitForEnzymes(parentSelector = '') {
  cy.get(`${parentSelector} .enzyme-multi-select`, { timeout: 20000 }).should('exist');
}

export function loadExample(name) {
  cy.get('.MuiToolbar-root button.MuiButtonBase-root').contains('Examples').click();
  cy.get('.load-example-dialog .load-example-item').contains(name).click();
  // This is not always the case, but it will work for several cases
  cy.get('.open-cloning li').contains('Import a sequence').should('not.exist');
}

export function changeTab(tabName) {
  cy.get('button.MuiTab-root').contains(tabName).click();
}

export function closeAlerts() {
  cy.get('div#global-error-message-wrapper .MuiAlert-root button').each((el) => {
    cy.get('div#global-error-message-wrapper .MuiAlert-root button').first().click();
  });
}
