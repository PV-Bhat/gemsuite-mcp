FROM node:18-alpine

# Install build dependencies for potential native modules
RUN apk add --no-cache --virtual .build-deps \
    python3 \
    make \
    g++ \
    git

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with explicit production flag
RUN npm install --production=false && \
    npm cache clean --force && \
    apk del .build-deps

# Copy the rest of the application
COPY . .

# Run the simple JavaScript implementation
CMD ["node", "simple-index.js"]
