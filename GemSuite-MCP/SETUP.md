# Setup Instructions for GemSuite MCP

## 1. Install Dependencies

First, install the necessary node packages:

```bash
npm install
```

## 2. Set Up Environment

Create a `.env` file in the project root and add your Gemini API key:

```
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_PAID_TIER=false
DEFAULT_MODEL_ID=gemini-2.0-flash-001
```

## 3. Build the Project

Compile the TypeScript code to JavaScript:

```bash
npm run build
```

## 4. Start the Server

Start the MCP server:

```bash
npm start
```

Alternatively, you can use the provided `run.bat` script which will build and start the server in one step.

## 5. Claude Integration

The tools have been registered in Claude's configuration file. After restarting Claude, you'll have access to the following tools:

- `gemini_search`: For general knowledge questions and search integration
- `gemini_reason`: For complex reasoning tasks with step-by-step analysis
- `gemini_process`: For fast, efficient content processing (most token-efficient)
- `gemini_analyze`: For intelligent file analysis with auto model selection

## 6. Troubleshooting

### API Key Issues
If you encounter authentication errors, verify your Gemini API key in the `.env` file.

### Rate Limiting
If you hit rate limits, the server will automatically retry with exponential backoff. If this persists, increase the delays or reduce the request frequency.

### File Handling
Ensure file paths are correct and accessible. The server can only access files in directories allowed by Claude's filesystem access.

## 7. Usage

Use these new tools directly from Claude. For example:

```javascript
// Process a large document efficiently
const summary = await gemini_process({
  file_path: "/path/to/large_document.pdf",
  operation: "summarize"
});

// Analyze complex reasoning problems
const solution = await gemini_reason({
  problem: "Solve this complex math problem...",
  show_steps: true
});

// Perform search with file context
const info = await gemini_search({
  query: "What concepts are discussed in this document?",
  file_path: "/path/to/document.pdf"
});

// Analyze files intelligently
const analysis = await gemini_analyze({
  file_path: "/path/to/image.jpg",
  instruction: "Describe what you see in this image"
});
```

## 8. Updating

To update the tools in the future:

1. Make your code changes
2. Run `npm run build` to compile
3. Restart Claude to pick up the changes
