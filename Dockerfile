# syntax = docker/dockerfile:1

# Use Node.js LTS version
ARG NODE_VERSION=20.9.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

# Node.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"
ENV PORT=3000

# Add tini for better process handling
RUN apt-get update && apt-get install -y tini && rm -rf /var/lib/apt/lists/*
ENTRYPOINT ["/usr/bin/tini", "--"]


# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Install node modules
COPY package-lock.json package.json ./
RUN npm ci

# Copy application code
COPY . .


# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app /app

# Install production dependencies only
RUN npm ci --only=production

# Ensure proper handling of Node.js processes
ENV NODE_OPTIONS="--max-old-space-size=512"

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
