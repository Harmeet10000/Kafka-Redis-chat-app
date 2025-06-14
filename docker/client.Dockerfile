# Use Node.js LTS version
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY client/package.json client/pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy the rest of the application
COPY client/ .

# Build the application
RUN pnpm build

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]
