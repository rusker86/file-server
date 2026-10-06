FROM node:22-alpine AS frontend-build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY frontend ./frontend
COPY public ./public
COPY vite.config.js ./

RUN npm run build

FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY src ./src
COPY --from=frontend-build /app/dist ./dist

EXPOSE 3000

ENTRYPOINT ["node", "src/index.js"]
