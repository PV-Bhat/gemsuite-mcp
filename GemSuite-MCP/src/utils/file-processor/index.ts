/**
 * File processing utilities
 */
import { FileInput } from '../../interfaces/common.js';
import { createFilePart, createFilePartsBatch } from '../file-handler.js';

/**
 * Process file inputs for Gemini API
 */
export async function processFileInputs(fileInput: FileInput): Promise<any[]> {
  const parts: any[] = [];
  
  if (fileInput.file_path) {
    if (Array.isArray(fileInput.file_path)) {
      const fileParts = await createFilePartsBatch(fileInput.file_path);
      parts.push(...fileParts);
    } else {
      const filePart = await createFilePart(fileInput.file_path);
      parts.push(filePart);
    }
  }
  
  return parts;
}
