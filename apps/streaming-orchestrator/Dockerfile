FROM node:18-alpine

# Install Docker CLI for container management
RUN apk add --no-cache docker-cli curl

WORKDIR /app

# Copy package files
COPY apps/streaming-orchestrator/package*.json ./
COPY apps/streaming-orchestrator/tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY apps/streaming-orchestrator/src/ ./src/

# Build the application
RUN npm run build

# Expose port
EXPOSE 7003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:7003/api/streaming/status || exit 1

# Start the application
CMD ["npm", "start"] 