# Dockerfile for the GCP
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy project files
COPY . .

# Build the project
RUN npm run build

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
