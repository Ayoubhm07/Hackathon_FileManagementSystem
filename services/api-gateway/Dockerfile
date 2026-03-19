FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig*.json nest-cli.json ./
COPY src/ ./src/
RUN npm run build

FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig*.json nest-cli.json ./
COPY src/ ./src/
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
USER nestjs
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/main"]
