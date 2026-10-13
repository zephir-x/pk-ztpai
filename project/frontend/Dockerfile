# === Stage 1: Build the React TypeScript application with Vite ===
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency manifests first to leverage Docker layer caching
COPY package.json package-lock.json ./

# Deterministic dependency installation without mutating lockfile
RUN npm ci

# Copy application source code and configuration files
COPY . .

# Build-time environment arguments (defaults to relative endpoints for reverse proxy)
ARG VITE_API_URL=/api
ARG VITE_HUB_URL=/kanbanHub

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_HUB_URL=$VITE_HUB_URL

# Compile TypeScript and generate minified production bundles
RUN npm run build

# === Stage 2: Serve production assets via Nginx Reverse Proxy ===
FROM nginx:alpine AS final

# Remove default boilerplate configuration and static files
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*

# Copy custom root Nginx configuration with reverse proxy and WebSocket support
COPY nginx.conf /etc/nginx/nginx.conf

# Copy compiled SPA static files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose standard container HTTP port
EXPOSE 80

# Run Nginx in foreground to keep container running
CMD ["nginx", "-g", "daemon off;"]
