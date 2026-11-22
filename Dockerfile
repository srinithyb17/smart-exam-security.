# Multi-stage production build for 100% Free Hosting
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Build Frontend
COPY client/package*.json ./client/
RUN cd client && npm install

COPY client/ ./client/
RUN cd client && npm run build

# 2. Production Runtime
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Install server dependencies
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

# Copy server code
COPY server/ ./server/

# Copy built frontend assets from builder stage
COPY --from=builder /app/client/dist ./client/dist

# Ensure storage directories exist
RUN mkdir -p server/storage/papers server/storage/uploads

EXPOSE 5000

# Seed database if not seeded and start server
CMD ["sh", "-c", "node server/seed.js && node server/server.js"]
