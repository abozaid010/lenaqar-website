# Dockerfile for the GCP
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies
COPY package.json ./
RUN yarn install --frozen-lockfile

# Copy project files
COPY . .

# Build the project
RUN yarn build

# Expose port
EXPOSE 3000

# Start the app
CMD ["yarn", "start"]
