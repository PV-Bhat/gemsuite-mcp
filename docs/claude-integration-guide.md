# GemSuite MCP Integration Guide for Claude

This guide provides practical examples of how Claude can effectively use the GemSuite MCP tools in various scenarios, with a focus on token efficiency and optimal workflow patterns.

## Token Efficiency Principles

When working with large files or content, Claude should follow these principles:

1. **Never include large file contents in Claude's context window**
2. **Always use file paths when working with existing files**
3. **Use the most efficient tool for each task**
4. **Process files with Gemini before analyzing the results with Claude**

## Real-World Usage Scenarios

### Scenario 1: Analyzing a Large Document

When a user uploads a large document (e.g., a research paper, report, or book):

```javascript
// STEP 1: First get a high-level summary using the efficient Flash-Lite model
const summary = await gemini_process({
  file_path: "/path/to/large_document.pdf",
  operation: "summarize"
});

// STEP 2: Extract key information based on user's interests
const keyInfo = await gemini_process({
  file_path: "/path/to/large_document.pdf",
  operation: "extract",
  content: "Focus on extracting information about [specific topic]"
});

// STEP 3: Now Claude can analyze the much smaller summary and extracted information
// This uses far fewer tokens than trying to process the entire document in Claude
```

### Scenario 2: Code Analysis and Improvement

When a user wants Claude to help with their code:

```javascript
// STEP 1: Get a detailed analysis of the code using the reasoning-focused model
const codeAnalysis = await gemini_reason({
  problem: "Analyze this code for bugs, inefficiencies, and potential improvements.",
  file_path: "/path/to/code_file.js",
  show_steps: true
});

// STEP 2: If there are specific complex sections that need deeper analysis
const complexSectionAnalysis = await gemini_reason({
  problem: "Explain how this specific algorithm works and how it could be optimized.",
  file_path: "/path/to/complex_section.js",
  show_steps: true
});

// STEP 3: Now Claude can synthesize the analyses and provide comprehensive recommendations
// without having to process all the code directly
```

### Scenario 3: Data Analysis and Visualization

When a user wants to analyze data from a CSV or spreadsheet:

```javascript
// STEP 1: Get high-level insights from the data file
const dataInsights = await gemini_process({
  file_path: "/path/to/large_dataset.csv",
  operation: "analyze",
  content: "Identify key trends, patterns, and notable statistics in this data."
});

// STEP 2: For specific analytical questions
const specificAnalysis = await gemini_reason({
  problem: "Analyze if there's a correlation between variables X and Y in this dataset.",
  file_path: "/path/to/large_dataset.csv",
  show_steps: true
});

// STEP 3: Claude can now create visualization recommendations and insights
// based on the processed data without consuming tokens on the raw data
```

### Scenario 4: Research Assistant

When a user wants help with research on a specific topic:

```javascript
// STEP 1: Search for up-to-date information
const searchResults = await gemini_search({
  query: "Latest developments in quantum computing in 2025",
});

// STEP 2: Analyze a specific research paper the user has provided
const paperAnalysis = await gemini_analyze({
  file_path: "/path/to/research_paper.pdf",
  instruction: "Summarize the key findings, methodology, and limitations of this study."
});

// STEP 3: Claude can synthesize this information and help the user with their research
// without having to process the entire research paper
```

### Scenario 5: Image and Document Understanding

When a user shares images or wants information extracted from visual content:

```javascript
// STEP 1: Analyze an image with detailed instructions
const imageAnalysis = await gemini_analyze({
  file_path: "/path/to/image.jpg",
  instruction: "Describe everything you see in this image in detail, including text, objects, people, and context."
});

// STEP 2: For documents with tables or complex formatting
const tableExtraction = await gemini_process({
  file_path: "/path/to/document_with_tables.pdf",
  operation: "extract",
  content: "Extract all tables from this document into structured data."
});

// STEP 3: Claude can now work with the extracted information rather than
// trying to process complex visual information directly
```

## Tool Selection Decision Tree

Claude should use this decision tree to determine which Gemini tool to use:

1. **Is this a factual question requiring current information?**
   - Yes → Use `gemini_search`
   - No → Continue

2. **Does this involve complex reasoning, math, science, or step-by-step problem solving?**
   - Yes → Use `gemini_reason`
   - No → Continue

3. **Is this a large file that needs basic processing (summarization, extraction, etc.)?**
   - Yes → Use `gemini_process` (most token-efficient)
   - No → Continue

4. **Is this detailed analysis of a specific file?**
   - Yes → Use `gemini_analyze`
   - No → Use `gemini_search` as default fallback

## Error Handling

When a Gemini tool fails, Claude should:

1. Try a different model via the `model_id` parameter
2. Break down complex queries into simpler parts
3. Check file paths and formats
4. Fall back to alternative tools if necessary

## Best Practices

1. **Pre-Processing:** Always pre-process large files with Gemini before detailed analysis with Claude
2. **Chunking:** Break large tasks into smaller chunks that can be processed more efficiently
3. **Combine Strengths:** Use Gemini for raw data processing and Claude for synthesis and communication
4. **Model Selection:** Choose the appropriate model based on the specific task requirements
5. **Explain Tool Choice:** When working with users, briefly explain which tool is being used and why

By following these guidelines, Claude can effectively leverage the enhanced Gemini tools while maintaining a seamless user experience and minimizing token usage.
