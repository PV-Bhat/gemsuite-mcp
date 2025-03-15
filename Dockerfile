FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the TypeScript code
RUN npm run build

# Command to run the application
CMD ["node", "build/index.js"]
