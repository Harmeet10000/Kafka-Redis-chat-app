# Use Node.js LTS version
FROM node:22-alpine

# Install required dependencies for node-rdkafka
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    linux-headers \
    librdkafka-dev

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY server/package.json server/pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy the rest of the application
COPY server/ .
COPY server/certs/ ./certs/

# Build typescript
RUN pnpm build

# Expose port 8000
EXPOSE 8000

# Start the application
CMD ["pnpm", "start"]
