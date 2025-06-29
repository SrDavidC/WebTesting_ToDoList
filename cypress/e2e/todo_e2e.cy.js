// E2E tests for ToDo List

describe('ToDo List E2E', () => {
  const username = `user${Date.now()}`;
  const password = 'test1234';

  beforeEach(() => {
    cy.visit('/');
  });

  it('User registration', () => {
    cy.get('#reg-username').type(username);
    cy.get('#reg-password').type(password);
    cy.get('#register').click();
    cy.contains('Login').should('exist');
  });

  it('User login', () => {
    cy.get('#login-username').type(username);
    cy.get('#login-password').type(password);
    cy.get('#login').click();
    cy.get('#app').should('be.visible');
  });

  it('Create a task', () => {
    // Login first
    cy.get('#login-username').type(username);
    cy.get('#login-password').type(password);
    cy.get('#login').click();
    cy.get('#app').should('be.visible');
    // Create task
    cy.get('#title').type('Cypress Task');
    cy.get('#description').type('Test description');
    cy.get('#dueDate').type('2025-12-31');
    cy.get('#priority').select('High');
    cy.get('#add').click();
    cy.get('#tasks').should('contain', 'Cypress Task');
  });

  it('Delete a task', () => {
    // Login and create task
    cy.get('#login-username').type(username);
    cy.get('#login-password').type(password);
    cy.get('#login').click();
    cy.get('#app').should('be.visible');
    cy.get('#title').type('Task to Delete');
    cy.get('#description').type('Description to delete');
    cy.get('#dueDate').type('2025-10-10');
    cy.get('#priority').select('Low');
    cy.get('#add').click();
    cy.get('#tasks').should('contain', 'Task to Delete');
    // Delete task (find button by text in .task-actions)
    cy.get('#tasks li').contains('Task to Delete').parents('li').first().find('.task-actions button.btn-danger').click();
    cy.get('#tasks').should('not.contain', 'Task to Delete');
  });

  it('Filter tasks by priority', () => {
    // Login and create multiple tasks
    cy.get('#login-username').type(username);
    cy.get('#login-password').type(password);
    cy.get('#login').click();
    cy.get('#app').should('be.visible');
    cy.get('#title').type('High Priority Task');
    cy.get('#description').type('High');
    cy.get('#dueDate').type('2025-12-01');
    cy.get('#priority').select('High');
    cy.get('#add').click();
    cy.get('#title').type('Low Priority Task');
    cy.get('#description').type('Low');
    cy.get('#dueDate').type('2025-12-02');
    cy.get('#priority').select('Low');
    cy.get('#add').click();
    // Filter by high priority
    cy.get('#filter-priority').select('High');
    cy.get('#refresh').click();
    cy.get('#tasks').should('contain', 'High Priority Task');
    cy.get('#tasks').should('not.contain', 'Low Priority Task');
  });

  it('Filter tasks by status', () => {
    // Login and create task
    cy.get('#login-username').type(username);
    cy.get('#login-password').type(password);
    cy.get('#login').click();
    cy.get('#app').should('be.visible');
    cy.get('#title').type('Pending Task');
    cy.get('#description').type('Pending');
    cy.get('#dueDate').type('2025-12-03');
    cy.get('#priority').select('Medium');
    cy.get('#add').click();
    // Mark as completed (find button by text 'Mark Done')
    cy.get('#tasks li').contains('Pending Task').parents('li').first().find('.task-actions button').contains('Mark Done').click();
    // Filter by completed
    cy.get('#filter-status').select('completed');
    cy.get('#refresh').click();
    cy.get('#tasks').should('contain', 'Pending Task');
    // Filter by pending
    cy.get('#filter-status').select('pending');
    cy.get('#refresh').click();
    cy.get('#tasks').should('not.contain', 'Pending Task');
  });
});
