FROM node:24-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /workspace

# Create non-root user (node user already exists in node:24-slim)
USER node

# Set npm to use the workspace directory
ENV NPM_CONFIG_PREFIX=/workspace/.npm-global
ENV PATH=$PATH:/workspace/.npm-global/bin

