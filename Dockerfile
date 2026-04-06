FROM node:22-alpine AS builder

# 部分原生依赖在 Alpine 上需要兼容库
RUN apk add --no-cache libc6-compat

# 使用 Corepack 与 package.json 中的 packageManager 字段锁定 pnpm 版本
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

ARG BASE_PATH=""
ENV BASE_PATH=$BASE_PATH
# 仓库默认 next build 为 output: export；构建镜像时需 standalone，故仅在此阶段开启
ENV NEXT_OUTPUT_STANDALONE=true

# Giscus 等 NEXT_PUBLIC_*：由仓库根目录 .env.production 提供（本地或 CI 从 Secrets 生成）；勿在此处写空 ENV，否则会覆盖 .env.production

WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile && pnpm store prune

COPY . .
RUN pnpm run build

FROM node:22-alpine AS runner

ENV NODE_ENV=production
ENV PORT=3000
# standalone 服务监听地址，供容器外访问
ENV HOSTNAME=0.0.0.0

ARG BASE_PATH=""
ENV BASE_PATH=$BASE_PATH

WORKDIR /app

# 非 root 运行（与 Next 官方示例一致）
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nextjs

# Next.js standalone：仅包含追踪到的依赖与 server.js
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]
