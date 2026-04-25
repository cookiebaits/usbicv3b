# Use a multi-stage build to handle both frontend and backend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Final image
FROM node:20-alpine
WORKDIR /app

# Install production dependencies for the backend
COPY package*.json ./
RUN npm ci --only=production

# Copy built frontend assets
COPY --from=builder /app/dist ./dist

# Copy backend source code
COPY src ./src
COPY config ./config
COPY nginx.conf ./nginx.conf

# Install Nginx to serve the frontend
RUN apk add --no-cache nginx

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/http.d/default.conf

# Expose ports
EXPOSE 80 3000

# Start both Nginx and the Node backend
CMD ["sh", "-c", "node src/server.js & nginx -g 'daemon off;'"]
