# Dockerfile for the GCP
FROM node:18-alpine

# Increase tmp size to avoid ENOSPC
ENV TMPDIR=/tmp

# Create app directory
WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./

# Clean yarn cache and install dependencies with increased memory limit
# Prefer offline and frozen lockfile for stability
RUN yarn cache clean && \
    yarn install --frozen-lockfile --prefer-offline --network-timeout 1000000 --max-old-space-size=4096 && \
    rm -rf /root/.cache /usr/local/share/.cache /tmp/* /var/cache/* /var/tmp/*

# Copy all remaining project files
COPY . .

# Build the project
RUN yarn build && \
    rm -rf node_modules/.cache

# Expose port
EXPOSE 3000

# Start the app
CMD ["yarn", "start"]