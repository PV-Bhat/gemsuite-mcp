# Contributing to GemSuite MCP

Thank you for considering contributing to GemSuite MCP! This document provides guidelines and instructions for contributing to the project.

## Development Environment Setup

1. **Fork and Clone the Repository**
   ```bash
   git clone https://github.com/your-username/gemsuite-mcp.git
   cd gemsuite-mcp
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env` file in the root directory with your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

## Development Workflow

### Working with Code

#### CommonJS Version (For Smithery)
The `simple-index.js` file uses CommonJS and is the primary entry point for the Smithery deployment. This version must be kept compatible with Docker builds.

#### TypeScript Version (For Development)
The TypeScript code in the `src` directory is used for development and provides type safety and better organization.

### Testing Your Changes

1. **Local Testing**
   ```bash
   # Run the simple CommonJS version
   node simple-index.js
   
   # Build and run the TypeScript version
   npm run build
   npm start
   ```

2. **Testing with MCP Inspector**
   Use the MCP Inspector tool to test your MCP server:
   ```bash
   npx @modelcontextprotocol/inspector
   ```

3. **Docker Testing**
   ```bash
   docker build -t gemsuite-mcp .
   docker run -p 8000:8000 gemsuite-mcp
   ```

## Smithery Deployment

### Required Files

1. **Dockerfile**
   - Must be in the root directory
   - Should build a Docker image that runs the STDIO server

2. **smithery.yaml**
   - Defines how to start your MCP server
   - Must be correctly formatted with:
     - `startCommand.type`: "stdio"
     - `startCommand.configSchema`: JSON Schema for configuration
     - `startCommand.commandFunction`: Function that returns command details

### Deployment Tips

1. **CommonJS Compatibility**
   - Use CommonJS (`require()`) instead of ES modules for better compatibility
   - Avoid features that might not work in all Node.js environments

2. **Dependencies**
   - Keep dependencies minimal and well-maintained
   - Include build tools in the development dependencies

3. **Error Handling**
   - Add comprehensive error logging for easier debugging
   - Handle rate limits and API errors gracefully

## Pull Request Process

1. Create a branch for your feature or fix: `git checkout -b feature/your-feature-name`
2. Make your changes and test thoroughly
3. Update documentation as needed
4. Commit your changes with clear messages
5. Push your branch to your fork
6. Submit a pull request to the main repository

## Code Style Guidelines

1. Use consistent indentation (2 spaces)
2. Follow existing naming conventions
3. Add JSDoc comments for functions and classes
4. Keep functions small and focused on a single task

## License

By contributing to GemSuite MCP, you agree that your contributions will be licensed under the project's MIT License.
