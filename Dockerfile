# Frontend for OpenCloning
# https://github.com/manulera/OpenCloning_frontend

# Stage 1: Build the application
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json /app/package.json
COPY yarn.lock /app/yarn.lock
COPY .yarnrc.yml /app/.yarnrc.yml
RUN corepack enable
RUN yarn install
# Add build argument for base URL with a default value
ARG BASE_URL="/"
# Build argument for git tag (will be shown as app version in the version dialog)
ARG VITE_GIT_TAG="unknown"

COPY . /app
RUN yarn build --base "$BASE_URL"

# Stage 2: Create a lightweight production image
FROM node:22-alpine
WORKDIR /build
COPY --from=builder /app/build .

# Install envsubst (to create config.json from config.env.json)
RUN apk add --no-cache envsubst
# Update npm to latest version and remove cache
RUN npm update -g npm && npm cache clean --force
COPY ./docker_entrypoint.sh /build/docker_entrypoint.sh
ENV BACKEND_URL=http://127.0.0.1:8000
ENV DATABASE=""
ENV SHOW_APP_BAR="true"
ENV NO_EXTERNAL_REQUESTS="false"
CMD ["sh", "docker_entrypoint.sh"]
