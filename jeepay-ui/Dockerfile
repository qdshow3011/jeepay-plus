# 构建阶段
FROM node:20-alpine AS builder

ARG PLATFORM
ARG NPM_REGISTRY=https://registry.npmmirror.com

# 限制 Node 堆内存，防止 Coolify 并行构建多个 UI 时总内存超过服务器上限
# 3 个 UI + 3 个 Maven 并行构建，单个 Node 进程 2GB，总计可控
ENV NODE_OPTIONS=--max-old-space-size=2048

WORKDIR /workspace

# 第1层: 仅复制 package.json — 依赖不变时可以复用 Docker 缓存，跳过漫长的 npm install
COPY package.json ./
COPY jeepay-ui-cashier/package.json ./jeepay-ui-cashier/
COPY jeepay-ui-manager/package.json ./jeepay-ui-manager/
COPY jeepay-ui-merchant/package.json ./jeepay-ui-merchant/

# 第2层: 安装全部 workspace 依赖（缓存友好，package.json 不变则跳过）
# 默认使用 npmmirror.com 国内镜像，可通过 build-arg 覆盖
RUN npm config set registry ${NPM_REGISTRY} \
    && npm install

# 第3层: 复制源代码和构建配置（依赖已缓存，此处仅复制变更的文件）
COPY jeepay-ui-cashier/ ./jeepay-ui-cashier/
COPY jeepay-ui-manager/ ./jeepay-ui-manager/
COPY jeepay-ui-merchant/ ./jeepay-ui-merchant/
COPY default.conf.template ./

# 第4层: 仅构建目标平台
RUN cd /workspace/jeepay-ui-${PLATFORM} \
    && npm run build

# 运行阶段
FROM nginx:alpine

ARG PLATFORM

# 安装 curl 供调试和 nginx 健康检查使用
RUN apk add --no-cache curl

ENV BACKEND_HOST=${BACKEND_HOST}
ENV PORT=80

WORKDIR /workspace

COPY --from=builder /workspace/jeepay-ui-${PLATFORM}/dist /workspace
RUN chmod -R a+r /workspace

RUN rm -rf /etc/nginx/conf.d/default.conf

COPY --from=builder /workspace/default.conf.template /etc/nginx/templates/default.conf.template

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]