# 构建阶段
FROM node:20-alpine AS builder

ARG PLATFORM
ARG NPM_REGISTRY=https://registry.npmjs.org

WORKDIR /workspace

COPY . /workspace

RUN npm config set registry ${NPM_REGISTRY} \
    && cd /workspace/jeepay-ui-${PLATFORM} \
    && npm install \
    && npm run build

# 运行阶段
FROM nginx:alpine

ARG PLATFORM

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

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f -s http://localhost:80/ || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]