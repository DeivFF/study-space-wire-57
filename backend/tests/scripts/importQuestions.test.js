import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import QuestionImporter from '../../src/scripts/importQuestions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock the Question model
const mockQuestion = {
  titleExists: jest.fn(),
  create: jest.fn()
};

jest.unstable_mockModule('../../src/models/Question.js', () => ({
  default: mockQuestion
}));

// Mock console methods to avoid cluttering test output
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {})
};

describe('QuestionImporter', () => {
  let importer;
  let testCsvPath;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.log.mockClear();
    consoleSpy.error.mockClear();
    consoleSpy.warn.mockClear();
    
    importer = new QuestionImporter();
    testCsvPath = path.join(__dirname, 'test-questions.csv');
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testCsvPath)) {
      fs.unlinkSync(testCsvPath);
    }
  });

  afterAll(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
    consoleSpy.warn.mockRestore();
  });

  describe('importFromCSV', () => {
    it('should successfully import questions from CSV', async () => {
      // Create test CSV file
      const csvContent = `category,subcategory,title,content,type,year,difficulty,subject_area,legal_branch,exam_phase,institution,position,education_level,metadata,option_a,option_b,option_c,option_d,option_e,correct_option,explanation_a,explanation_b,explanation_c,explanation_d,explanation_e
ENEM,,Test Question 1,Test content 1,OBJETIVA,2023,MEDIO,Matemática,,,INEP,,MEDIO,"{}",Option A,Option B,Option C,Option D,Option E,C,Wrong,Wrong,Correct,Wrong,Wrong
OAB,,Test Question 2,Test content 2,OBJETIVA,2023,FACIL,Direito Civil,Civil,PRIMEIRA,OAB,,SUPERIOR,"{}",Alt A,Alt B,Alt C,Alt D,Alt E,B,Wrong,Correct,Wrong,Wrong,Wrong`;
      
      fs.writeFileSync(testCsvPath, csvContent);

      // Mock Question methods
      mockQuestion.titleExists.mockResolvedValue(false);
      mockQuestion.create
        .mockResolvedValueOnce({ id: '1', title: 'Test Question 1' })
        .mockResolvedValueOnce({ id: '2', title: 'Test Question 2' });

      const result = await importer.importFromCSV(testCsvPath);

      expect(result.imported).toBe(2);
      expect(result.skipped).toBe(0);
      expect(result.duplicates).toBe(0);
      expect(result.errors).toBe(0);

      expect(mockQuestion.create).toHaveBeenCalledTimes(2);
      
      // Check first question data
      expect(mockQuestion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'ENEM',
          title: 'Test Question 1',
          content: 'Test content 1',
          type: 'OBJETIVA',
          year: 2023,
          difficulty: 'MEDIO',
          subject_area: 'Matemática',
          options: expect.arrayContaining([
            expect.objectContaining({
              letter: 'A',
              content: 'Option A',
              correct: false
            }),
            expect.objectContaining({
              letter: 'C',
              content: 'Option C',
              correct: true
            })
          ])
        })
      );
    });

    it('should skip questions with missing required fields', async () => {
      const csvContent = `category,subcategory,title,content,type,year,difficulty,subject_area,legal_branch,exam_phase,institution,position,education_level,metadata,option_a,option_b,option_c,option_d,option_e,correct_option,explanation_a,explanation_b,explanation_c,explanation_d,explanation_e
ENEM,,Complete Question,Test content,OBJETIVA,2023,MEDIO,Matemática,,,INEP,,MEDIO,"{}",A,B,C,D,E,C,,,,,
,,Missing Title,Test content,OBJETIVA,2023,MEDIO,Matemática,,,INEP,,MEDIO,"{}",A,B,C,D,E,C,,,,,
ENEM,,Missing Content,,OBJETIVA,2023,MEDIO,Matemática,,,INEP,,MEDIO,"{}",A,B,C,D,E,C,,,,,`;
      
      fs.writeFileSync(testCsvPath, csvContent);

      mockQuestion.titleExists.mockResolvedValue(false);
      mockQuestion.create.mockResolvedValueOnce({ id: '1', title: 'Complete Question' });

      const result = await importer.importFromCSV(testCsvPath);

      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(2); // Two records with missing fields
      expect(mockQuestion.create).toHaveBeenCalledTimes(1);
    });

    it('should skip duplicate questions', async () => {
      const csvContent = `category,subcategory,title,content,type,year,difficulty,subject_area,legal_branch,exam_phase,institution,position,education_level,metadata,option_a,option_b,option_c,option_d,option_e,correct_option,explanation_a,explanation_b,explanation_c,explanation_d,explanation_e
ENEM,,New Question,Test content,OBJETIVA,2023,MEDIO,Matemática,,,INEP,,MEDIO,"{}",A,B,C,D,E,C,,,,,
ENEM,,Existing Question,Test content,OBJETIVA,2023,MEDIO,Matemática,,,INEP,,MEDIO,"{}",A,B,C,D,E,C,,,,,`;
      
      fs.writeFileSync(testCsvPath, csvContent);

      // Mock first question as new, second as duplicate
      mockQuestion.titleExists
        .mockResolvedValueOnce(false) // New question
        .mockResolvedValueOnce(true); // Existing question

      mockQuestion.create.mockResolvedValueOnce({ id: '1', title: 'New Question' });

      const result = await importer.importFromCSV(testCsvPath);

      expect(result.imported).toBe(1);
      expect(result.duplicates).toBe(1);
      expect(mockQuestion.create).toHaveBeenCalledTimes(1);
    });

    it('should skip questions with invalid categories', async () => {
      const csvContent = `category,subcategory,title,content,type,year,difficulty,subject_area,legal_branch,exam_phase,institution,position,education_level,metadata,option_a,option_b,option_c,option_d,option_e,correct_option,explanation_a,explanation_b,explanation_c,explanation_d,explanation_e
INVALID,,Invalid Category,Test content,OBJETIVA,2023,MEDIO,Matemática,,,INEP,,MEDIO,"{}",A,B,C,D,E,C,,,,,
ENEM,,Valid Question,Test content,OBJETIVA,2023,MEDIO,Matemática,,,INEP,,MEDIO,"{}",A,B,C,D,E,C,,,,,`;
      
      fs.writeFileSync(testCsvPath, csvContent);

      mockQuestion.titleExists.mockResolvedValue(false);
      mockQuestion.create.mockResolvedValueOnce({ id: '1', title: 'Valid Question' });

      const result = await importer.importFromCSV(testCsvPath);

      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(1); // Invalid category skipped
      expect(mockQuestion.create).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors gracefully', async () => {
      const csvContent = `category,subcategory,title,content,type,year,difficulty,subject_area,legal_branch,exam_phase,institution,position,education_level,metadata,option_a,option_b,option_c,option_d,option_e,correct_option,explanation_a,explanation_b,explanation_c,explanation_d,explanation_e
ENEM,,Error Question,Test content,OBJETIVA,2023,MEDIO,Matemática,,,INEP,,MEDIO,"{}",A,B,C,D,E,C,,,,,`;
      
      fs.writeFileSync(testCsvPath, csvContent);

      mockQuestion.titleExists.mockResolvedValue(false);
      mockQuestion.create.mockRejectedValueOnce(new Error('Database connection failed'));

      const result = await importer.importFromCSV(testCsvPath);

      expect(result.imported).toBe(0);
      expect(result.errors).toBe(1);
    });

    it('should throw error for non-existent file', async () => {
      await expect(importer.importFromCSV('non-existent-file.csv'))
        .rejects
        .toThrow('File not found: non-existent-file.csv');
    });
  });

  describe('parseOptions', () => {
    it('should parse options correctly', () => {
      const record = {
        option_a: 'Option A',
        option_b: 'Option B',
        option_c: 'Option C',
        option_d: '',
        option_e: 'Option E',
        correct_option: 'C'
      };

      const options = importer.parseOptions(record);

      expect(options).toHaveLength(4); // Only non-empty options
      expect(options.find(opt => opt.letter === 'C')).toMatchObject({
        letter: 'C',
        content: 'Option C',
        correct: true
      });
      expect(options.find(opt => opt.letter === 'A')).toMatchObject({
        letter: 'A',
        content: 'Option A',
        correct: false
      });
    });

    it('should handle missing correct option', () => {
      const record = {
        option_a: 'Option A',
        option_b: 'Option B',
        correct_option: '' // No correct option specified
      };

      const options = importer.parseOptions(record);

      expect(options.every(opt => opt.correct === false)).toBe(true);
    });
  });

  describe('parseMetadata', () => {
    it('should parse valid JSON metadata', () => {
      const metadata = importer.parseMetadata('{"theme": "Functions", "level": 5}');
      expect(metadata).toEqual({ theme: 'Functions', level: 5 });
    });

    it('should return empty object for invalid JSON', () => {
      const metadata = importer.parseMetadata('invalid json');
      expect(metadata).toEqual({});
    });

    it('should return empty object for empty string', () => {
      const metadata = importer.parseMetadata('');
      expect(metadata).toEqual({});
    });
  });
});