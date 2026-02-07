# Dockerfile for the GCP
FROM node:20-bookworm-slim

# Create app directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts=false --omit=optional

# Copy project files
COPY . .

# Build the project with increased memory limit
# Next.js builds can be memory-intensive, especially with large apps
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NEXT_TELEMETRY_DISABLED=1

# Build with verbose output to help debug issues
RUN npm run build || (echo "Build failed with exit code $?" && exit 1)

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
