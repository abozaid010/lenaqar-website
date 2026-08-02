# Dockerfile for the GCP
FROM node:20-bookworm-slim

# Create app directory
WORKDIR /app

# Install dependencies with native modules support
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts=false --include=optional

# Copy project files
COPY . .

# ---------------------------------------------------------------------------
# NEXT_PUBLIC_* env vars are INLINED into the client bundle at `next build`
# time, NOT read at `next start`. They must be present here, before the build.
# Pass them with: docker build --build-arg NEXT_PUBLIC_X_API_KEY=... .
# (Runtime `docker run -e` / compose env does NOT affect NEXT_PUBLIC_* values.)
# ---------------------------------------------------------------------------
ARG NEXT_PUBLIC_X_API_KEY
ARG NEXT_PUBLIC_API_BASE_URL=https://api.lenaai.net
ARG NEXT_PUBLIC_SITE_URL=https://www.lenaai.net
ARG NEXT_PUBLIC_IMAGE_BASE_URL
ARG NEXT_PUBLIC_META_PIXEL_ID
ENV NEXT_PUBLIC_X_API_KEY=$NEXT_PUBLIC_X_API_KEY
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_IMAGE_BASE_URL=$NEXT_PUBLIC_IMAGE_BASE_URL
ENV NEXT_PUBLIC_META_PIXEL_ID=$NEXT_PUBLIC_META_PIXEL_ID

# Fail the build early if the required public key is absent, instead of
# shipping an image that silently 401/403s on every send.
RUN test -n "$NEXT_PUBLIC_X_API_KEY" || (echo "ERROR: NEXT_PUBLIC_X_API_KEY build-arg is required (see README)" && exit 1)

# Cap Node heap for e2-medium (4Gi) shared with backend; package.json build must match
ENV NODE_OPTIONS="--max-old-space-size=1536"
ENV NEXT_TELEMETRY_DISABLED=1

# Build with verbose output to help debug issues
RUN npm run build || (echo "Build failed with exit code $?" && exit 1)

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
