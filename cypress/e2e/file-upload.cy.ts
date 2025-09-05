describe('File Upload System', () => {
  beforeEach(() => {
    // Visit the app
    cy.visit('/');
    
    // Wait for app to load
    cy.wait(1000);
    
    // Login with test credentials
    // Check if we need to login (if login form is visible)
    cy.get('body').then((body) => {
      if (body.find('input[type="email"]').length > 0) {
        cy.get('input[type="email"]').type('deividefelipe000@gmail.com');
        cy.get('input[type="password"]').type('Francilene123');
        cy.contains('button', /entrar|login|sign in/i).click();
        cy.wait(2000); // Wait for login to complete
      }
    });
  });

  it('should allow file upload via drag and drop', () => {
    // Navigate to a lesson that has file upload capability
    // Click on "Adicionar" dropdown first
    cy.contains('Adicionar').click();
    // Then click "Nova Aula"
    cy.contains('Nova Aula').click();
    
    // Create a test lesson first
    cy.get('[data-testid="lesson-title-input"]').type('Test Lesson for File Upload');
    cy.get('[data-testid="create-lesson-button"]').click();
    
    // Go to the lesson detail page
    cy.contains('Test Lesson for File Upload').click();
    
    // Navigate to Files tab
    cy.contains('Arquivos').click();
    
    // Test file upload area is visible
    cy.get('[data-testid="file-upload-area"]').should('be.visible');
    
    // Create a test file
    const fileName = 'test-document.pdf';
    const fileContent = 'Test PDF content';
    
    // Simulate file drop
    cy.get('[data-testid="file-upload-area"]').selectFile({
      contents: Cypress.Buffer.from(fileContent),
      fileName: fileName,
      mimeType: 'application/pdf'
    }, { action: 'drag-drop' });
    
    // Verify upload progress or success message
    cy.contains('Upload concluído').should('be.visible');
    
    // Verify file appears in the files list
    cy.contains(fileName).should('be.visible');
  });

  it('should allow file upload via file selector', () => {
    // Navigate to lesson files section
    cy.contains('Adicionar').click();
    cy.contains('Nova Aula').click();
    cy.get('[data-testid="lesson-title-input"]').type('Test Lesson for File Selector');
    cy.get('[data-testid="create-lesson-button"]').click();
    cy.contains('Test Lesson for File Selector').click();
    cy.contains('Arquivos').click();
    
    // Click on file selector button
    cy.contains('Selecionar arquivos').click();
    
    // Create and select a test file
    const fileName = 'test-image.png';
    const fileContent = 'fake-image-content';
    
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from(fileContent),
      fileName: fileName,
      mimeType: 'image/png'
    });
    
    // Verify upload success
    cy.contains('Upload concluído').should('be.visible');
    cy.contains(fileName).should('be.visible');
  });

  it('should display uploaded files in attached files section', () => {
    // Create lesson and upload file
    cy.contains('Adicionar').click();
    cy.contains('Nova Aula').click();
    cy.get('[data-testid="lesson-title-input"]').type('Test Files Display');
    cy.get('[data-testid="create-lesson-button"]').click();
    cy.contains('Test Files Display').click();
    cy.contains('Arquivos').click();
    
    // Upload a file
    const fileName = 'display-test.pdf';
    cy.get('[data-testid="file-upload-area"]').selectFile({
      contents: Cypress.Buffer.from('test content'),
      fileName: fileName,
      mimeType: 'application/pdf'
    }, { action: 'drag-drop' });
    
    // Verify file appears in "Arquivos anexados" section
    cy.contains('Arquivos anexados').should('be.visible');
    cy.contains(fileName).should('be.visible');
    
    // Test file actions (mark as primary, studied, delete)
    cy.get(`[data-testid="file-${fileName}-actions"]`).should('exist');
  });

  it('should not create automatic PDF files for new lessons', () => {
    // Create a new lesson
    cy.contains('Adicionar').click();
    cy.contains('Nova Aula').click();
    cy.get('[data-testid="lesson-title-input"]').type('No Auto PDF Test');
    cy.get('[data-testid="create-lesson-button"]').click();
    
    // Navigate to the lesson
    cy.contains('No Auto PDF Test').click();
    cy.contains('Arquivos').click();
    
    // Verify no automatic PDF was created
    cy.contains('No Auto PDF Test.pdf').should('not.exist');
    cy.contains('Nenhum arquivo anexado').should('be.visible');
  });

  it('should handle file upload errors gracefully', () => {
    // Navigate to files section
    cy.contains('Adicionar').click();
    cy.contains('Nova Aula').click();
    cy.get('[data-testid="lesson-title-input"]').type('Error Test Lesson');
    cy.get('[data-testid="create-lesson-button"]').click();
    cy.contains('Error Test Lesson').click();
    cy.contains('Arquivos').click();
    
    // Try to upload an unsupported file type
    cy.get('[data-testid="file-upload-area"]').selectFile({
      contents: Cypress.Buffer.from('test content'),
      fileName: 'test.exe',
      mimeType: 'application/x-msdownload'
    }, { action: 'drag-drop', force: true });
    
    // Verify error message
    cy.contains('Tipo de arquivo não suportado').should('be.visible');
  });

  it('should handle large file size limits', () => {
    // Navigate to files section
    cy.contains('Adicionar').click();
    cy.contains('Nova Aula').click();
    cy.get('[data-testid="lesson-title-input"]').type('Large File Test');
    cy.get('[data-testid="create-lesson-button"]').click();
    cy.contains('Large File Test').click();
    cy.contains('Arquivos').click();
    
    // Create a simulated large file (smaller for testing)
    const largeContent = 'x'.repeat(10 * 1024); // 10KB for testing
    
    cy.get('[data-testid="file-upload-area"]').selectFile({
      contents: Cypress.Buffer.from(largeContent),
      fileName: 'large-file.pdf',
      mimeType: 'application/pdf'
    }, { action: 'drag-drop', force: true });
    
    // Verify size limit error
    cy.contains('Arquivo muito grande').should('be.visible');
  });
});