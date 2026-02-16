# Stage 1: Install dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files để leverage Docker cache
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js yêu cầu biến môi trường build-time nếu bạn hardcode URL backend
ENV NEXT_PUBLIC_API_ENDPOINT=http://futurebetter.online/api
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Tạo user để bảo mật (không chạy bằng root)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy các tệp cần thiết từ builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy output build (Output standalone để tối ưu nhất cho Docker)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]