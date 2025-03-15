# GemSuite MCP File Handling Guide

This guide explains how to effectively use the GemSuite MCP tools for file processing tasks. All GemSuite MCP tools now support file input, allowing Claude to offload token-intensive file processing to the appropriate Gemini model.

## File Processing Strategy

### When to Use File Path vs. Content

- **Use file_path when**:
  - The file already exists in the file system
  - The file is large (saves Claude's tokens)
  - The file needs multimodal processing (images, PDFs)

- **Use content when**:
  - The text is small and already part of the conversation
  - The content is generated during the conversation
  - You need to modify the content before processing

### Token Savings

Using `file_path` instead of sending the full content can result in **massive token savings** for Claude, as the file content is sent directly to the Gemini API without consuming Claude's context window.

## Tool-Specific File Handling

### gem_process (Most Token-Efficient)

Ideal for quickly processing large files with minimal token usage. Uses Flash-Lite for efficiency.

```javascript
// Summarize a large document
const response = await gem_process({
  file_path: "/path/to/large_document.txt",
  operation: "summarize"
});

// Extract key information from a CSV
const response = await gem_process({
  file_path: "/path/to/data.csv",
  operation: "extract"
});

// Restructure content
const response = await gem_process({
  file_path: "/path/to/unstructured_content.txt",
  operation: "restructure"
});
```

Available operations:
- `summarize` - Create a concise summary
- `extract` - Extract key information
- `restructure` - Organize into a better format
- `simplify` - Make content easier to understand
- `expand` - Add more detail and context
- `critique` - Provide critical analysis
- `feedback` - Give constructive feedback
- `analyze` - General analysis

### gem_analyze (Comprehensive Analysis)

Ideal for detailed analysis of any file type with automatic model selection.

```javascript
// Analyze an image
const response = await gem_analyze({
  file_path: "/path/to/image.jpg",
  instruction: "Describe what you see in this image in detail."
});

// Analyze a PDF document
const response = await gem_analyze({
  file_path: "/path/to/document.pdf",
  instruction: "Extract the main arguments from this paper."
});

// Analyze code
const response = await gem_analyze({
  file_path: "/path/to/code.py",
  instruction: "Explain what this code does and suggest improvements."
});
```

### gem_reason (Complex Problem Solving with Files)

Ideal for reasoning about file content with step-by-step explanation.

```javascript
// Solve a math problem from an image
const response = await gem_reason({
  problem: "Solve the math problem shown in this image.",
  file_path: "/path/to/math_problem.jpg",
  show_steps: true
});

// Analyze data from a CSV
const response = await gem_reason({
  problem: "Analyze this data and identify the key trends and outliers.",
  file_path: "/path/to/data.csv",
  show_steps: true
});

// Debug code
const response = await gem_reason({
  problem: "Find and fix the bugs in this code.",
  file_path: "/path/to/buggy_code.js",
  show_steps: true
});
```

### gem_search (Information Retrieval with Files)

Ideal for answering questions about files with search integration.

```javascript
// Answer questions about a document
const response = await gem_search({
  query: "What are the key recommendations in this report?",
  file_path: "/path/to/report.pdf"
});

// Find information in an image
const response = await gem_search({
  query: "What brand logos are visible in this image?",
  file_path: "/path/to/image.jpg"
});
```

## Model Selection for File Types

The system automatically selects the appropriate model based on file type:

1. **Images** → Gemini 2.0 Flash
   - Best for multimodal processing of visual content

2. **Documents (PDF, DOC)** → Gemini 2.0 Flash
   - Best for complex document understanding

3. **Text Files** → Gemini 2.0 Flash-Lite
   - Most efficient for plain text processing

4. **Code Files** → Gemini 2.0 Flash Thinking
   - Best for code analysis and reasoning

## Best Practices

1. **Save Claude's Tokens**: Always use `file_path` for large files
2. **Use gem_process for Efficiency**: When basic processing is sufficient
3. **Use gem_analyze for Details**: When comprehensive analysis is needed
4. **Use gem_reason for Problems**: When solving complex problems with files
5. **Combine Insights**: Process large files with Gemini, then have Claude analyze the results

## Examples of Token-Efficient Workflows

### Workflow 1: Large Document Analysis

1. Use `gem_process` to summarize a large document
2. Use `gem_process` to extract key information
3. Have Claude analyze the summarized results

### Workflow 2: Code Review

1. Use `gem_reason` to analyze the code file
2. Extract specific sections that need more attention
3. Have Claude provide detailed recommendations

### Workflow 3: Data Analysis

1. Use `gem_process` to extract insights from large CSV files
2. Use `gem_reason` to solve specific problems in the data
3. Have Claude synthesize the findings and create a report

By following these guidelines, Claude can effectively leverage GemSuite MCP's file processing capabilities while minimizing token usage.
