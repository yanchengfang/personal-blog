FROM node:22-alpine AS builder

ARG BASE_PATH=""
ENV BASE_PATH=$BASE_PATH
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runner

ENV NODE_ENV=production
ENV PORT=3000
ARG BASE_PATH=""
ENV BASE_PATH=$BASE_PATH
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/i18n ./i18n

EXPOSE 3000
CMD ["npm", "run", "serve"]

