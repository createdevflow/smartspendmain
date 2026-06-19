FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (openssl is required for Prisma on Alpine)
RUN apk add --no-cache openssl

# Copy dependency files
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including dev) and generate Prisma client
RUN npm install
RUN npx prisma generate

# Copy source code and build
COPY . .
RUN npm run build

# --- Production Image ---
FROM node:20-alpine AS production

WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

# Copy dependency files again
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm install --omit=dev
RUN npx prisma generate

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start application using production build
CMD ["npm", "run", "start:prod"]
