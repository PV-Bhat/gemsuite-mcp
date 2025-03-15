FROM node:18-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install --only=production

# Copy the simple JS implementation
COPY simple-index.js ./

# Run the simple JavaScript implementation
CMD ["node", "simple-index.js"]
