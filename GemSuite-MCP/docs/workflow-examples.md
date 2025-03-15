# GemSuite MCP Workflow Examples

This document provides detailed workflow examples for common scenarios, showing how to effectively chain and combine the GemSuite MCP tools for maximum efficiency.

## Workflow 1: Comprehensive Document Analysis

### Scenario
A user has uploaded a large technical document (50+ pages) and wants key insights, summaries, and answers to specific questions.

### Workflow Steps

```javascript
// Step 1: Get a high-level executive summary (Flash-Lite for efficiency)
const executiveSummary = await gem_process({
  file_path: "/path/to/large_document.pdf",
  operation: "summarize",
  content: "Create a concise executive summary of the main points in 3-5 paragraphs."
});

// Step 2: Extract key information by section (Flash-Lite for efficiency)
const keyInfoBySections = await gemini_process({
  file_path: "/path/to/large_document.pdf",
  operation: "extract",
  content: "Extract the key information from each major section of the document, organized by section headings."
});

// Step 3: Answer specific questions about the document (Flash for search integration)
const specificQuestionAnswer = await gem_search({
  query: "Based on the document, what are the implications for [specific topic]?",
  file_path: "/path/to/large_document.pdf"
});

// Step 4: Analyze any complex concepts or methodologies (Flash Thinking for reasoning)
const complexConceptAnalysis = await gem_reason({
  problem: "Explain the [specific methodology] described in the document and analyze its strengths and limitations.",
  file_path: "/path/to/large_document.pdf",
  show_steps: true
});

// Step 5: Claude synthesizes all this processed information
// This approach is dramatically more token-efficient than having Claude process the entire document
```

## Workflow 2: Software Development Assistant

### Scenario
A user needs help understanding, debugging, and improving a complex codebase.

### Workflow Steps

```javascript
// Step 1: Get an overview of the codebase structure (Flash-Lite for efficiency)
const codebaseOverview = await gemini_process({
  file_path: "/path/to/main_file.js",
  operation: "analyze",
  content: "Provide an overview of this code's structure, purpose, and key components."
});

// Step 2: Identify potential bugs and issues (Flash Thinking for reasoning)
const bugAnalysis = await gemini_reason({
  problem: "Analyze this code for potential bugs, edge cases, and security vulnerabilities.",
  file_path: "/path/to/problematic_code.js",
  show_steps: true
});

// Step 3: Optimize performance bottlenecks (Flash Thinking for reasoning)
const performanceAnalysis = await gemini_reason({
  problem: "Identify performance bottlenecks in this code and suggest optimizations. Explain the reasoning behind each suggestion.",
  file_path: "/path/to/slow_code.js",
  show_steps: true
});

// Step 4: Generate implementation for new features (Flash for general coding)
const implementationSuggestion = await gemini_search({
  query: "How would you implement [specific feature] in this codebase? Provide code examples.",
  file_path: "/path/to/relevant_code.js"
});

// Step 5: Claude synthesizes all analyses and provides comprehensive recommendations
// with a consistent style and understanding of the user's specific needs
```

## Workflow 3: Data Analysis and Insights

### Scenario
A user has uploaded a large dataset in CSV format and wants to extract insights, visualize trends, and answer specific analytical questions.

### Workflow Steps

```javascript
// Step 1: Get an overview of the dataset (Flash-Lite for efficiency)
const datasetOverview = await gemini_process({
  file_path: "/path/to/large_dataset.csv",
  operation: "analyze",
  content: "Provide a high-level overview of this dataset: what it contains, key variables, data types, and basic statistics."
});

// Step 2: Extract key trends and patterns (Flash-Lite for efficiency)
const keyTrends = await gemini_process({
  file_path: "/path/to/large_dataset.csv",
  operation: "extract",
  content: "Identify and describe the top 5 most significant trends, patterns, or insights from this dataset."
});

// Step 3: Answer specific analytical questions (Flash Thinking for reasoning)
const analyticalAnswer = await gemini_reason({
  problem: "Based on this dataset, is there a statistically significant relationship between variables X and Y? Explain your analytical approach.",
  file_path: "/path/to/large_dataset.csv",
  show_steps: true
});

// Step 4: Get visualization recommendations (Flash for creative generation)
const visualizationRecs = await gemini_search({
  query: "What are the most appropriate data visualizations to represent the key trends in this dataset? Describe specific chart types and what they would show.",
  file_path: "/path/to/large_dataset.csv"
});

// Step 5: Claude synthesizes all analyses and creates a comprehensive data report
// including formatted tables, visualization recommendations, and key insights
```

## Workflow 4: Research Assistant

### Scenario
A user is researching a complex topic and needs help analyzing academic papers, finding relevant information, and synthesizing findings.

### Workflow Steps

```javascript
// Step 1: Analyze academic papers (Flash for document understanding)
const paperAnalysis = await gem_analyze({
  file_path: "/path/to/academic_paper.pdf",
  instruction: "Analyze this academic paper and extract: research question, methodology, key findings, limitations, and implications. Include important statistics and quotes."
});

// Step 2: Find up-to-date information online (Flash for search)
const currentResearch = await gemini_search({
  query: "What are the most recent developments in [research area] from 2024-2025? Focus on peer-reviewed findings."
});

// Step 3: Compare multiple sources (Flash Thinking for reasoning)
const sourceComparison = await gemini_reason({
  problem: "Compare and contrast the methodologies and findings from these different research papers. Identify agreements, contradictions, and gaps.",
  file_path: ["/path/to/paper1.pdf", "/path/to/paper2.pdf", "/path/to/paper3.pdf"],
  show_steps: true
});

// Step 4: Identify research gaps (Flash for synthesis)
const researchGaps = await gemini_search({
  query: "Based on the current literature, what are the most significant research gaps or unanswered questions in [research area]?",
  file_path: "/path/to/literature_review.pdf"
});

// Step 5: Claude synthesizes all research information into a comprehensive literature review
// with proper academic formatting, citations, and critical analysis
```

## Workflow 5: Content Creator Assistant

### Scenario
A user needs help creating various content types including blog posts, reports, presentations, and social media content on a specific topic.

### Workflow Steps

```javascript
// Step 1: Research the topic thoroughly (Flash for search)
const topicResearch = await gemini_search({
  query: "Provide comprehensive information about [topic], including recent developments, statistics, expert opinions, and key debates."
});

// Step 2: Analyze competitor content (Flash-Lite for efficiency)
const competitorAnalysis = await gemini_process({
  file_path: "/path/to/competitor_content.txt",
  operation: "analyze",
  content: "Analyze this competitor content and identify: main themes, tone, structure, strengths, and weaknesses."
});

// Step 3: Generate content outlines (Flash for creative content)
const contentOutlines = await gemini_search({
  query: "Create detailed outlines for: 1) a comprehensive blog post, 2) a professional report, and 3) a presentation on [topic]. Include key sections, main points, and supporting elements for each."
});

// Step 4: Create engaging hooks and headlines (Flash for creative content)
const engagingHooks = await gemini_search({
  query: "Generate 10 engaging headlines, hooks, and opening paragraphs for content about [topic], optimized for audience engagement."
});

// Step 5: Claude uses all these inputs to craft highly customized, engaging content
// in the user's preferred style and format, with appropriate citations and media suggestions
```

## Best Practices for Workflow Optimization

1. **Process Before Synthesis**: Always process raw data/files with Gemini before asking Claude to synthesize
2. **Model Matching**: Use the appropriate model for each step (Lite for efficiency, Thinking for reasoning, Flash for search)
3. **Parallelization**: Run independent Gemini tasks in parallel when possible
4. **Chunking**: Break large files into logical chunks for more focused analysis
5. **Progressive Refinement**: Start with broad analyses, then focus on specific aspects based on initial results
6. **Explicit Instructions**: Provide clear, specific instructions in each tool call
7. **Context Preservation**: Pass relevant context between steps without duplicating large content
8. **Tool Chaining**: Build logical chains where the output of one tool feeds into the next
9. **Error Recovery**: Implement fallback strategies when specific tools or approaches fail
10. **User Involvement**: At appropriate points, seek user clarification or additional input

By following these workflow patterns, Claude can effectively leverage the enhanced Gemini tools to provide comprehensive, token-efficient, and high-quality responses to complex user requests.
