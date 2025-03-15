/**
 * File handling utilities for Gemini API
 */
import fs from 'fs/promises';
import path from 'path';

/**
 * Supported mime types
 */
const MIME_TYPES = {
  // Images
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  
  // Documents
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  
  // Text
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.csv': 'text/csv',
  '.json': 'application/json',
  
  // Code
  '.js': 'text/javascript',
  '.ts': 'text/typescript',
  '.py': 'text/x-python',
  '.html': 'text/html',
  '.css': 'text/css',
  '.java': 'text/x-java',
  '.cpp': 'text/x-c++',
  '.c': 'text/x-c',
  '.cs': 'text/x-csharp',
  
  // Default
  'default': 'application/octet-stream'
};

/**
 * Get the mime type for a file
 * @param {string} filePath - Path to the file
 * @returns {string} - Mime type
 */
export function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || MIME_TYPES.default;
}

/**
 * Get the file type category
 * @param {string} filePath - Path to the file
 * @returns {string} - File type category: 'image', 'document', 'text', 'code', or 'binary'
 */
export function getFileTypeCategory(filePath) {
  const mimeType = getMimeType(filePath);
  
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf' || mimeType.includes('document')) return 'document';
  if (mimeType.startsWith('text/')) {
    // Further categorize text files
    if (mimeType.includes('javascript') || mimeType.includes('python') || 
        mimeType.includes('java') || mimeType.includes('c')) {
      return 'code';
    }
    return 'text';
  }
  
  return 'binary';
}

/**
 * Read a file and convert it to the format needed for Gemini API
 * @param {string} filePath - Path to the file
 * @returns {Promise<{mimeType: string, data: string, category: string}>} - File data in base64 format, mime type, and category
 */
export async function readFileForGemini(filePath) {
  try {
    const fileData = await fs.readFile(filePath);
    const mimeType = getMimeType(filePath);
    const category = getFileTypeCategory(filePath);
    
    // Convert to base64
    const base64Data = fileData.toString('base64');
    
    return {
      mimeType,
      data: base64Data,
      category
    };
  } catch (error) {
    throw new Error(`Error reading file ${filePath}: ${error.message}`);
  }
}

/**
 * Create a Gemini API part for a file
 * @param {string} filePath - Path to the file
 * @returns {Promise<Object>} - Gemini API part
 */
export async function createFilePart(filePath) {
  const { mimeType, data } = await readFileForGemini(filePath);
  
  return {
    inline_data: {
      mime_type: mimeType,
      data
    }
  };
}

/**
 * Create Gemini API parts for multiple files
 * @param {string[]} filePaths - Array of file paths
 * @returns {Promise<Object[]>} - Array of Gemini API parts
 */
export async function createFilePartsBatch(filePaths) {
  return Promise.all(filePaths.map(filePath => createFilePart(filePath)));
}

/**
 * Prepare Gemini API request with file(s) and optional text
 * @param {string|string[]} filePath - File path or array of file paths
 * @param {string} text - Optional text to include with the file
 * @returns {Promise<Object[]>} - Array of parts for Gemini API request
 */
export async function preparePartsWithFiles(filePath, text) {
  const parts = [];
  
  // Handle single file or multiple files
  if (Array.isArray(filePath)) {
    const fileParts = await createFilePartsBatch(filePath);
    parts.push(...fileParts);
  } else if (filePath) {
    const filePart = await createFilePart(filePath);
    parts.push(filePart);
  }
  
  // Add text if provided
  if (text) {
    parts.push({ text });
  }
  
  return parts;
}
