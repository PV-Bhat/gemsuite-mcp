/**
 * Test script for enhanced Gemini tools
 */
import fs from 'fs/promises';
import path from 'path';

// Import handlers for testing
import { 
  handleSearch, 
  handleReason, 
  handleProcess, 
  handleAnalyze 
} from '../src/handlers/unified-gemini.js';

// Test directory for sample files
const TEST_DIR = path.join(process.cwd(), 'test');
const SAMPLE_DIR = path.join(TEST_DIR, 'samples');

// Create sample directory if it doesn't exist
async function ensureSampleDirectory() {
  try {
    await fs.mkdir(SAMPLE_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating sample directory:', error);
  }
}

// Create sample text file
async function createSampleTextFile() {
  const filePath = path.join(SAMPLE_DIR, 'sample.txt');
  const content = `
# Sample Document

This is a sample text file for testing the enhanced Gemini tools.

## Key Points

1. The Gemini 2.0 Flash model is a powerful AI model for general tasks.
2. The Gemini 2.0 Flash-Lite model is optimized for efficiency.
3. The Gemini 2.0 Flash Thinking model excels at complex reasoning.

## Statistics

- Flash Model: 1M token context window
- Flash-Lite Model: Optimized for speed
- Flash Thinking Model: Enhanced reasoning capabilities

This document will be used to test file handling capabilities.
`;

  try {
    await fs.writeFile(filePath, content);
    console.log('Created sample text file:', filePath);
    return filePath;
  } catch (error) {
    console.error('Error creating sample text file:', error);
    return null;
  }
}

// Test gemini_search with text
async function testGeminiSearch() {
  console.log('\n=== Testing gemini_search ===\n');
  
  const request = {
    params: {
      name: 'gemini_search',
      arguments: {
        query: 'What are the key features of Gemini 2.0 models?'
      }
    }
  };
  
  try {
    const response = await handleSearch(request);
    console.log('Success! Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

// Test gemini_search with file
async function testGeminiSearchWithFile(filePath) {
  console.log('\n=== Testing gemini_search with file ===\n');
  
  const request = {
    params: {
      name: 'gemini_search',
      arguments: {
        query: 'What are the key points mentioned in this document?',
        file_path: filePath
      }
    }
  };
  
  try {
    const response = await handleSearch(request);
    console.log('Success! Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

// Test gemini_reason
async function testGeminiReason() {
  console.log('\n=== Testing gemini_reason ===\n');
  
  const request = {
    params: {
      name: 'gemini_reason',
      arguments: {
        problem: 'If a rectangle has a perimeter of 30 units and its length is twice its width, what are the dimensions of the rectangle?'
      }
    }
  };
  
  try {
    const response = await handleReason(request);
    console.log('Success! Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

// Test gemini_process with text
async function testGeminiProcess() {
  console.log('\n=== Testing gemini_process ===\n');
  
  const request = {
    params: {
      name: 'gemini_process',
      arguments: {
        content: `
        The Gemini 2.0 family includes Flash, Flash-Lite, and Flash Thinking models.
        Flash has a 1M token context window and supports search integration.
        Flash-Lite is optimized for efficiency and cost-effectiveness.
        Flash Thinking provides step-by-step reasoning for complex problems.
        `,
        operation: 'summarize'
      }
    }
  };
  
  try {
    const response = await handleProcess(request);
    console.log('Success! Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

// Test gemini_process with file
async function testGeminiProcessWithFile(filePath) {
  console.log('\n=== Testing gemini_process with file ===\n');
  
  const request = {
    params: {
      name: 'gemini_process',
      arguments: {
        file_path: filePath,
        operation: 'extract'
      }
    }
  };
  
  try {
    const response = await handleProcess(request);
    console.log('Success! Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

// Test gemini_analyze with file
async function testGeminiAnalyze(filePath) {
  console.log('\n=== Testing gemini_analyze ===\n');
  
  const request = {
    params: {
      name: 'gemini_analyze',
      arguments: {
        file_path: filePath,
        instruction: 'Analyze this document and extract the key information about Gemini models.'
      }
    }
  };
  
  try {
    const response = await handleAnalyze(request);
    console.log('Success! Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run all tests
async function runTests() {
  console.log('Starting tests for enhanced Gemini tools...\n');
  
  // Setup
  await ensureSampleDirectory();
  const sampleFilePath = await createSampleTextFile();
  
  if (!sampleFilePath) {
    console.error('Failed to create sample file. Aborting tests.');
    return;
  }
  
  // Run tests
  // Note: Uncomment tests as needed to avoid rate limiting
  // await testGeminiSearch();
  // await testGeminiSearchWithFile(sampleFilePath);
  // await testGeminiReason();
  // await testGeminiProcess();
  // await testGeminiProcessWithFile(sampleFilePath);
  // await testGeminiAnalyze(sampleFilePath);
  
  // Run just one test for demonstration
  await testGeminiProcess();
  
  console.log('\nTests completed!');
}

// Execute tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
});
