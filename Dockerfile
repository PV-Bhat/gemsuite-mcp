FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json* ./

# Install dependencies with error output
RUN npm install --no-optional && npm cache clean --force

# Copy the rest of the application
COPY . .

# Build the TypeScript code
RUN npm run build

# Command to run the application
CMD ["node", "build/index.js"]
