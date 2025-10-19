# Base image for installing dependencies
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm

# Builder stage for building the Next.js application
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Runner stage for the final production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
# Set the port for the Next.js application
ENV PORT 3000
EXPOSE 3000
COPY --from=builder /app/node_modules/ /app/node_modules/
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
CMD ["node", "server.js"]