# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy source code
COPY tsconfig.json ./
COPY src/ ./src/

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package.json and install production dependencies
COPY package.json ./
RUN npm install --only=production

# Copy built application from build stage
COPY --from=build /app/build ./build

# Run the application
CMD ["node", "build/index.js"]
