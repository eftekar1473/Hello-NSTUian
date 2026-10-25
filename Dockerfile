# Multi-stage Dockerfile for Hello NSTUian
# Stage 1: Build Frontend Client
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Production Server Environment
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy server package definitions and install production dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install --omit=dev

# Copy server source code and prisma schema
COPY server/ ./

# Generate Prisma Client for PostgreSQL
RUN npx prisma generate --schema=./prisma/schema.postgresql.prisma

# Copy built frontend assets into client/dist so server can serve them directly
COPY --from=client-builder /app/client/dist /app/client/dist

# Expose port
EXPOSE 5000

# Start command
CMD ["node", "src/server.js"]
