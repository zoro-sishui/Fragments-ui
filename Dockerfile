# Multi-stage Dockerfile for Fragments UI
# 1) Build static assets with Node + Parcel
# 2) Serve static site from a minimal nginx image

# ---- Build stage ----
FROM node:22.19.0 AS build

# Set working directory
WORKDIR /app

# Install dependencies (leverage cached layers)
COPY package*.json ./
RUN npm ci

# Copy app sources
COPY src ./src
COPY README.md ./README.md

# Accept build-time configuration and expose to bundler
# These are embedded at build time by Parcel via process.env.*
ARG API_URL
ARG AWS_COGNITO_POOL_ID
ARG AWS_COGNITO_CLIENT_ID
ARG OAUTH_SIGN_IN_REDIRECT_URL

ENV API_URL=${API_URL}
# Also set NEXT_PUBLIC_API_URL so current frontend code can read it
ENV NEXT_PUBLIC_API_URL=${API_URL}
ENV AWS_COGNITO_POOL_ID=${AWS_COGNITO_POOL_ID}
ENV AWS_COGNITO_CLIENT_ID=${AWS_COGNITO_CLIENT_ID}
ENV OAUTH_SIGN_IN_REDIRECT_URL=${OAUTH_SIGN_IN_REDIRECT_URL}

# Build the static site (outputs to dist/)
RUN npm run build

# ---- Runtime stage (Node.js static server, no nginx) ----
FROM nginx:alpine AS runtime

# Copy built assets into the default nginx web root
COPY --from=build /app/dist/ /usr/share/nginx/html/

# Expose standard HTTP port
EXPOSE 80

# Run nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
