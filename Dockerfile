# Dockerfile for the GCP
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies
COPY package.json ./

# Clean yarn cache and install dependencies with increased memory limit
RUN yarn cache clean && \
    yarn install --network-timeout 1000000 --max-old-space-size=4096

# Copy project files
COPY . .

# Build the project
RUN yarn build

# Clean up unnecessary files to save space
RUN yarn cache clean && \
    rm -rf /root/.cache && \
    rm -rf /root/.npm

# Expose port
EXPOSE 3000

# Start the app
CMD ["yarn", "start"]
