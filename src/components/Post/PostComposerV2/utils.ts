/**
 * Utility functions for PostComposerV2
 */

/**
 * Escapes HTML characters to prevent XSS
 */
export function escapeHTML(str: string): string {
  return String(str || '').replace(/[&<>"']/g, (match) => {
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return escapeMap[match];
  });
}

/**
 * Formats text content with line breaks
 */
export function formatContent(content: string): string {
  return escapeHTML(content).replace(/\n/g, '<br>');
}

/**
 * Validates poll options
 */
export function validatePollOptions(options: Array<{ text: string }>): boolean {
  const filledOptions = options.filter(opt => opt.text.trim().length > 0);
  return filledOptions.length >= 2 && filledOptions.length <= 8;
}

/**
 * Validates exercise options for multiple choice
 */
export function validateExerciseOptions(options: Array<{ text: string; isCorrect: boolean }>): boolean {
  const filledOptions = options.filter(opt => opt.text.trim().length > 0);
  const hasCorrect = options.some(opt => opt.isCorrect && opt.text.trim().length > 0);
  return filledOptions.length >= 2 && filledOptions.length <= 6 && hasCorrect;
}

/**
 * Generates letter sequence for exercise options
 */
export function generateLetters(count: number): string[] {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return Array.from({ length: count }, (_, i) => letters[i] || '?');
}