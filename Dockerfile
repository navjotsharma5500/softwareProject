# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY backend/package*.json ./
RUN npm ci

# Copy backend source code
COPY backend/ ./

# Expose the port (match your .env or index.js)
EXPOSE 3000

# Set environment variables (override in production as needed)
ENV NODE_ENV=production

# Start the app
CMD ["npm", "start"]
