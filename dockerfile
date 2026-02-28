FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install   # install ALL deps including dev

COPY . .
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --prod

COPY --from=builder /app/dist ./dist

CMD ["node", "dist/index.mjs"]