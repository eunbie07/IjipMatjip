# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create .env file from build args
ARG VITE_LOCAL_API_BASE
ARG VITE_CLOUD_API_BASE
ARG VITE_AI_INTERIOR_API_BASE
ARG VITE_GEMINI_API_KEY

RUN echo "VITE_LOCAL_API_BASE=$VITE_LOCAL_API_BASE" > .env && \
    echo "VITE_CLOUD_API_BASE=$VITE_CLOUD_API_BASE" >> .env && \
    echo "VITE_AI_INTERIOR_API_BASE=$VITE_AI_INTERIOR_API_BASE" >> .env && \
    echo "VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY" >> .env

# Debug: Check if files exist
RUN ls -la src/hooks/ && echo "=== Checking useKeyboardControls ===" && cat src/hooks/useKeyboardControls.js

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
