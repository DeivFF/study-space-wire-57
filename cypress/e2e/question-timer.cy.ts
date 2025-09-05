describe('Question Timer Functionality', () => {
  it('should login and test timer functionality', () => {
    // Visit the application
    cy.visit('/')
    
    // Login with provided credentials
    cy.get('input[type="email"]').type('deividefelipe000@gmail.com')
    cy.get('input[type="password"]').type('@Francilene123')
    cy.get('button[type="submit"]').click()
    
    // Wait for login to complete and navigate to questions page
    cy.url().should('not.include', '/login')
    cy.visit('/questoes')
    cy.wait(3000) // Wait for questions to load
    
    // Test 1: Start timer
    cy.get('[data-testid="question-card"]').first().within(() => {
      // Click the "Iniciar" button
      cy.contains('button', 'Iniciar').click()
      
      // Wait and verify timer is running
      cy.wait(3000)
      
      // Check that timer shows more than 00:00
      cy.get('[data-testid="question-timer"]').should('not.contain', '00:00')
      
      // Select an answer option and submit
      cy.get('label').first().click()
      cy.contains('button', 'Responder').click()
    })
    
    // Test 2: Verify next timer starts automatically
    cy.wait(2000)
    cy.get('[data-testid="question-card"]').eq(1).within(() => {
      // Second question timer should be running now
      cy.get('[data-testid="question-timer"]').should('not.contain', '00:00')
    })
    
    // Test passed if we get to this point
    cy.log('Timer functionality is working correctly!')
  })
})