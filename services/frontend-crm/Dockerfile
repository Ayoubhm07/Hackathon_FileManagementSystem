FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
COPY node_modules ./node_modules
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

FROM nginx:1.25-alpine AS production
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD wget -qO- http://localhost:80/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
