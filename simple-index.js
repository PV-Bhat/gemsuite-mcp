#!/usr/bin/env node

// Use CommonJS requires for better compatibility in Docker environments
const { Server } = require('@modelcontextprotocol/sdk/server');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio');
const { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } = require('@modelcontextprotocol/sdk/types');

// Initialize server
const server = new Server(
  {
    name: 'gemsuite-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define simple example tool
const TOOL_NAMES = {
  TEST: 'test_tool'
};

// Set up tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: TOOL_NAMES.TEST,
      description: 'A simple test tool that demonstrates GemSuite MCP is working',
      inputSchema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'A message to echo back'
          }
        },
        required: ['message'],
      },
    }
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (request.params.name === TOOL_NAMES.TEST) {
      const message = request.params.arguments?.message || 'No message provided';
      return {
        content: [
          {
            type: 'text',
            text: `Echo: ${message}`
          }
        ]
      };
    }
    
    throw new McpError(
      ErrorCode.MethodNotFound,
      `Unknown tool: ${request.params.name}`
    );
  } catch (error) {
    console.error(`Error in tool handler:`, error);
    
    if (error instanceof McpError) {
      throw error;
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message || 'Unknown error'}`
        }
      ],
      isError: true
    };
  }
});

// Error handling
server.onerror = (error) => console.error('[MCP Error]', error);
process.on('SIGINT', async () => {
  await server.close();
  process.exit(0);
});

// Start server
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('GemSuite MCP simple server running on stdio');
}

run().catch(error => {
  console.error('Fatal error starting server:', error);
  process.exit(1);
});
