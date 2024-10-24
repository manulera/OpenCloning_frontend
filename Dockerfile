# Frontend for ShareYourCloning
# https://github.com/manulera/ShareYourCloning_frontend

# Stage 1: Build the application
FROM node:18-alpine AS builder
WORKDIR /app
COPY . /app
RUN corepack enable
RUN yarn install
# Add build argument for base URL with a default value
ARG BASE_URL="/"
# Build arguments to set version and commit SHA
ARG VERSION
ARG COMMIT_SHA
RUN yarn build --base "$BASE_URL"

# Stage 2: Create a lightweight production image
FROM node:18-alpine
WORKDIR /build
COPY --from=builder /app/build .
RUN npm install http-server -g

# Install curl (get mime.types) and envsubst (to to create config.json from config.env.json)
RUN apk add --no-cache curl envsubst
RUN curl https://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types > mime.types
COPY ./docker_entrypoint.sh /build/docker_entrypoint.sh
ENV BACKEND_URL=http://127.0.0.1:8000
CMD ["sh", "docker_entrypoint.sh"]