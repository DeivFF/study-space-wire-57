#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import Question from '../models/Question.js';

/**
 * CSV Question Import Script
 * 
 * CSV Format:
 * category,subcategory,title,content,type,year,difficulty,subject_area,legal_branch,exam_phase,institution,position,education_level,metadata,option_a,option_b,option_c,option_d,option_e,correct_option,explanation_a,explanation_b,explanation_c,explanation_d,explanation_e
 * 
 * Example:
 * ENEM,,Função Linear,Uma função f(x) = ax + b...,OBJETIVA,2023,MEDIO,Matemática,,,INEP,,MEDIO,'{"tema":"Funções"}',x = 1,x = 2,x = 3,x = 4,x = 5,C,Incorreto,Incorreto,Correto,Incorreto,Incorreto
 */

class QuestionImporter {
  constructor() {
    this.imported = 0;
    this.skipped = 0;
    this.errors = 0;
    this.duplicates = 0;
  }

  /**
   * Parse CSV file and import questions
   * @param {string} filePath - Path to CSV file
   */
  async importFromCSV(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    console.log(`Starting import from: ${filePath}`);
    console.log('Expected CSV columns: category,subcategory,title,content,type,year,difficulty,subject_area,legal_branch,exam_phase,institution,position,education_level,metadata,option_a,option_b,option_c,option_d,option_e,correct_option,explanation_a,explanation_b,explanation_c,explanation_d,explanation_e');
    console.log('---');

    const records = [];
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(parse({ 
          columns: true, 
          skip_empty_lines: true,
          trim: true
        }))
        .on('data', (data) => {
          records.push(data);
        })
        .on('error', (err) => {
          reject(err);
        })
        .on('end', async () => {
          console.log(`Found ${records.length} records to process`);
          
          for (let i = 0; i < records.length; i++) {
            const record = records[i];
            console.log(`\nProcessing record ${i + 1}/${records.length}: "${record.title}"`);
            
            try {
              await this.processRecord(record);
            } catch (error) {
              console.error(`❌ Error processing record ${i + 1}:`, error.message);
              this.errors++;
            }
          }

          this.printSummary();
          resolve({
            imported: this.imported,
            skipped: this.skipped,
            duplicates: this.duplicates,
            errors: this.errors
          });
        });
    });
  }

  /**
   * Process a single CSV record
   * @param {Object} record - CSV record object
   */
  async processRecord(record) {
    // Validate required fields
    if (!record.title || !record.category || !record.content || !record.type || !record.year) {
      console.log(`⏭️  Skipping record - missing required fields`);
      this.skipped++;
      return;
    }

    // Check for duplicate title
    const titleExists = await Question.titleExists(record.title.trim());
    if (titleExists) {
      console.log(`🔄 Duplicate title found, skipping: "${record.title}"`);
      this.duplicates++;
      return;
    }

    // Prepare question data
    const questionData = {
      category: record.category?.toUpperCase(),
      subcategory: record.subcategory || null,
      title: record.title.trim(),
      content: record.content.trim(),
      type: record.type?.toUpperCase(),
      year: parseInt(record.year),
      difficulty: record.difficulty?.toUpperCase() || null,
      subject_area: record.subject_area || null,
      legal_branch: record.legal_branch || null,
      exam_phase: record.exam_phase?.toUpperCase() || null,
      institution: record.institution || null,
      position: record.position || null,
      education_level: record.education_level?.toUpperCase() || null,
      metadata: this.parseMetadata(record.metadata)
    };

    // Add options if it's an objective question
    if (questionData.type === 'OBJETIVA') {
      const options = this.parseOptions(record);
      if (options.length > 0) {
        questionData.options = options;
      }
    }

    // Validate category
    if (!['ENEM', 'OAB', 'CONCURSO'].includes(questionData.category)) {
      console.log(`⏭️  Skipping record - invalid category: ${questionData.category}`);
      this.skipped++;
      return;
    }

    // Validate type
    if (!['OBJETIVA', 'DISCURSIVA', 'PECA_PRATICA'].includes(questionData.type)) {
      console.log(`⏭️  Skipping record - invalid type: ${questionData.type}`);
      this.skipped++;
      return;
    }

    try {
      const question = await Question.create(questionData);
      console.log(`✅ Successfully imported: "${question.title}" (ID: ${question.id})`);
      this.imported++;
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`🔄 Duplicate found during creation: "${questionData.title}"`);
        this.duplicates++;
      } else {
        throw error;
      }
    }
  }

  /**
   * Parse options from CSV record
   * @param {Object} record - CSV record
   * @returns {Array} Array of option objects
   */
  parseOptions(record) {
    const options = [];
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const correctLetter = record.correct_option?.toUpperCase();

    for (const letter of letters) {
      const content = record[`option_${letter.toLowerCase()}`];
      const explanation = record[`explanation_${letter.toLowerCase()}`];
      
      if (content && content.trim()) {
        options.push({
          letter,
          content: content.trim(),
          correct: letter === correctLetter,
          explanation: explanation?.trim() || null
        });
      }
    }

    return options;
  }

  /**
   * Parse metadata JSON string
   * @param {string} metadataStr - JSON string
   * @returns {Object} Parsed metadata object
   */
  parseMetadata(metadataStr) {
    if (!metadataStr || metadataStr.trim() === '') {
      return {};
    }

    try {
      return JSON.parse(metadataStr);
    } catch (error) {
      console.warn(`⚠️  Invalid metadata JSON, using empty object: ${metadataStr}`);
      return {};
    }
  }

  /**
   * Print import summary
   */
  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successfully imported: ${this.imported} questions`);
    console.log(`🔄 Duplicates skipped: ${this.duplicates} questions`);
    console.log(`⏭️  Records skipped: ${this.skipped} questions`);
    console.log(`❌ Errors occurred: ${this.errors} questions`);
    console.log(`📝 Total processed: ${this.imported + this.duplicates + this.skipped + this.errors} records`);
    console.log('='.repeat(50));
  }
}

// CLI usage
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node importQuestions.js <csv-file-path>');
    console.log('');
    console.log('Example: node importQuestions.js data/questoes.csv');
    console.log('');
    console.log('CSV Format expected:');
    console.log('category,subcategory,title,content,type,year,difficulty,subject_area,legal_branch,exam_phase,institution,position,education_level,metadata,option_a,option_b,option_c,option_d,option_e,correct_option,explanation_a,explanation_b,explanation_c,explanation_d,explanation_e');
    process.exit(1);
  }

  const csvFile = args[0];
  const importer = new QuestionImporter();
  
  try {
    await importer.importFromCSV(csvFile);
    console.log('\n🎉 Import completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default QuestionImporter;