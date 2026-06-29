/**
 * Resume Parser
 * Extracts text from PDF and DOCX files using their buffer contents.
 */

const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extract text from a file buffer based on its MIME type.
 * @param {Buffer} buffer - The file buffer
 * @param {string} mimetype - The MIME type of the file
 * @returns {Promise<string>} Extracted plain text
 */
async function extractTextFromFile(buffer, mimetype) {
  if (mimetype === 'application/pdf') {
    return extractFromPDF(buffer);
  }

  if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return extractFromDOCX(buffer);
  }

  throw new Error(`Unsupported file type: ${mimetype}`);
}

/**
 * Extract text from a PDF buffer
 */
async function extractFromPDF(buffer) {
  const data = await pdfParse(buffer);
  return data.text || '';
}

/**
 * Extract text from a DOCX buffer
 */
async function extractFromDOCX(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value || '';
}

module.exports = { extractTextFromFile };
