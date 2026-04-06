# Multi-stage build to keep the image slim and secure
# Stage 1: Build production dependencies
FROM node:18-slim AS dependencies

# Set working directory
WORKDIR /app

# Copy package management files
COPY package*.json ./

# Use npm ci for faster, more reliable, and reproducible production installs
RUN npm ci --only=production

# Stage 2: Runtime image
FROM node:18-slim

# Labels for better image documentation
LABEL description="School Management System Backend API"
LABEL maintainer="SMS Development Team"

# Set working directory
WORKDIR /app

# Copy only production dependencies from stage 1
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/package*.json ./

# Copy application source code (manually to avoid copying dev files)
COPY src ./src
COPY server.js ./server.js

# Create uploads directory and ensure node user owns it
RUN mkdir -p /app/uploads/temp && chown -R node:node /app/uploads

# Use non-root user for security (the node user is built-in to node images)
USER node

# Expose the application port
EXPOSE 5001

# Use node directly as entrypoint for better signal handling (SIGTERM, SIGINT)
# npm start doesn't pass signals to the child process properly
CMD ["node", "server.js"]