// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add('readFileAsText', (file) => {
  return new Cypress.Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
});

Cypress.Commands.add('addSource', (sourceType, isFirst = false, index = 0) => {
  if (!isFirst) {
    cy.get('svg[data-testid="AddCircleIcon"]').eq(index).click();
  }
  cy.get('#tab-panel-0 .select-source h2.empty-source-title').siblings('div').children('.MuiInputBase-root')
    .click();
  cy.get(`li[data-value="${sourceType}"]`).click();
});

Cypress.Commands.add('addLane', () => {
  cy.get('svg[data-testid="AddCircleIcon"]').last().click();
});

Cypress.Commands.add('clearPrimers', () => {
  cy.get('button.MuiTab-root').contains('Primers').click();
  cy.get('.primer-table-container [data-testid="DeleteIcon"]').each(() => {
    cy.get('.primer-table-container [data-testid="DeleteIcon"]').first().click();
  });
  cy.get('button.MuiTab-root').contains('Cloning').click();
});

Cypress.Commands.add('addPrimer', (name, seq) => {
  cy.changeTab('Primers', '#opencloning-app-tabs');
  cy.get('.primer-form-container').contains('Add Primer').click();
  cy.get('form.primer-row input#name').type(name, { delay: 0 });
  cy.get('form.primer-row input#sequence').type(seq, { delay: 0 });
  cy.get('form.primer-row [data-testid="CheckCircleIcon"]').click();
  cy.get('button.MuiTab-root').contains('Cloning').click();
});

Cypress.Commands.add('clickMultiSelectOption', (label, option, parentSelector = 'div.App', containsSettings = {}) => {
  cy.get(parentSelector).contains(label).siblings('div').first()
    .click();
  cy.get('div[role="presentation"]').contains(option, containsSettings).click();
  cy.get('body').click(0, 0);
});

Cypress.Commands.add('selectOptionShould', (label, option, shouldWhat = 'exist', parentSelector = 'div.App') => {
  cy.get(parentSelector).contains(label).siblings('div').first()
    .click();
  cy.get('div[role="presentation"]').contains(option).should(shouldWhat);
  cy.get('body').click(0, 0);
});

Cypress.Commands.add('setInputValue', (label, value, parentSelector = 'body') => {
  cy.get(parentSelector).contains(label).siblings('div').first()
    .children('input')
    .clear('');
  cy.get(parentSelector).contains(label).siblings('div').first()
    .children('input')
    .type(value, { delay: 0 });
});

Cypress.Commands.add('setAutocompleteValue', (label, value, parentSelector = 'body') => {
  cy.setInputValue(label, value, parentSelector);
  cy.get('div[role="presentation"]').contains(new RegExp(`^${value}$`)).click();
});

Cypress.Commands.add('clearAutocompleteValue', (label, parentSelector = 'body') => {
  cy.get(parentSelector).contains(label).siblings('div').click();
  cy.get(parentSelector).contains(label).siblings('div').find('button.MuiAutocomplete-clearIndicator')
    .first()
    .click();
});

Cypress.Commands.add('clearInputValue', (label, parentSelector = 'body') => {
  cy.get(parentSelector).contains(label).siblings('div').first()
    .children('input')
    .clear('');
});

Cypress.Commands.add('checkInputValue', (label, value, parentSelector = 'body') => {
  cy.get(parentSelector).contains(label).siblings('div').first()
    .children('input')
    .should('have.value', value);
});

Cypress.Commands.add('clickSequenceOutputArrow', (parentSelector, isRight = true) => {
  cy.get(`${parentSelector} .multiple-output-selector [data-testid="${isRight ? 'ArrowForwardIcon' : 'ArrowBackIcon'}"]`).click();
});

Cypress.Commands.add('loadHistory', (filePath) => {
  cy.intercept('POST', '**/validate').as('validateHistory');
  cy.get('.MuiToolbar-root .MuiButtonBase-root').contains('File').siblings('input').selectFile(filePath, { force: true });
  cy.wait('@validateHistory');
});

Cypress.Commands.add('deleteSourceById', (id) => {
  cy.get(`#source-${id} [data-testid="DeleteIcon"]`).first().click();
  cy.get('body').then(($body) => {
    if ($body.find('.verify-delete-dialog').length > 0) {
      cy.get('.verify-delete-dialog .MuiButtonBase-root').contains('Delete').click();
    }
  });
});

Cypress.Commands.add('deleteSourceByContent', (content) => {
  cy.get('.open-cloning').contains(content).closest('div.select-source').find('[data-testid="DeleteIcon"]')
    .click();
  cy.get('body').then(($body) => {
    if ($body.find('.verify-delete-dialog').length > 0) {
      cy.get('.verify-delete-dialog .MuiButtonBase-root').contains('Delete').click();
    }
  });
});

Cypress.Commands.add('manuallyTypeSequence', (seq, circular = false, overhangs = []) => {
  cy.get('#tab-panel-0 .select-source h2').last().closest('.source-node').invoke('attr', 'id')
    .then((sourceId) => {
      cy.get('#tab-panel-0 .select-source h2.empty-source-title').last().siblings('div')
        .children('.MuiInputBase-root')
        .click();
      cy.get('li[data-value="ManuallyTypedSource"]').click();
      cy.get('#tab-panel-0 #sequence').clear('');
      cy.get('#tab-panel-0 #sequence').type(seq, { delay: 0 });
      if (circular) {
        cy.get('#tab-panel-0 span').contains('Circular DNA').click();
      }
      if (overhangs.length > 0) {
        const [left, right] = overhangs;
        cy.setInputValue('Overhang crick 3\'', `${left}`, '#tab-panel-0');
        cy.setInputValue('Overhang watson 3\'', `${right}`, '#tab-panel-0');
      }
      cy.get('.select-source > form > .MuiButtonBase-root').click();

      cy.get(`.sequence-node #${sourceId}`, { timeout: 20000 }).should('exist');
    });
});

Cypress.Commands.add('waitForEnzymes', (parentSelector = 'body') => {
  cy.get(`${parentSelector} .enzyme-multi-select`, { timeout: 20000 }).should('exist');
});

Cypress.Commands.add('loadExample', (name) => {
  cy.intercept('POST', '**/validate').as('validateHistory');
  cy.get('.MuiToolbar-root button.MuiButtonBase-root').contains('Examples').click();
  cy.get('.load-example-dialog .load-example-item').contains(name).click();
  cy.wait('@validateHistory');
});

Cypress.Commands.add('changeTab', (tabName, extraSelector = '') => {
  if (extraSelector) {
    cy.get(`${extraSelector} button.MuiTab-root`).contains(tabName).click();
  } else {
    cy.get('button.MuiTab-root').contains(tabName).click();
  }
});

Cypress.Commands.add('closeAlerts', () => {
  cy.get('div#global-error-message-wrapper .MuiAlert-root button').each(() => {
    cy.get('div#global-error-message-wrapper .MuiAlert-root button').first().click();
  });
});

Cypress.Commands.add('disableCache', () => {
  if (Cypress.browser.family === 'chromium') {
    Cypress.automation('remote:debugger:protocol', {
      command: 'Network.enable',
      params: {}
    });
    Cypress.automation('remote:debugger:protocol', {
      command: 'Network.setCacheDisabled',
      params: { cacheDisabled: true }
    });
  }
});
