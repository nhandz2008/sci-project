# Stage 0, "build-stage", based on Node.js, to build and compile the frontend
FROM node:20-alpine AS build-stage

WORKDIR /app

# Copy package files
COPY package*.json /app/

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY ./ /app/

# Build arguments for environment variables
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Build the application
RUN npm run build

# Stage 1, based on Nginx, to have only the compiled app, ready for production
FROM nginx:alpine

# Copy built application from build stage
COPY --from=build-stage /app/dist/ /usr/share/nginx/html

# Copy nginx configuration
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Create nginx user if it doesn't exist
RUN addgroup -g 1001 -S nginx && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Switch to nginx user
USER nginx

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 