# 构建阶段
# cashier / manager / merchant 均使用 Vue 3 + Vite
FROM node:20-alpine AS builder

ARG PLATFORM

WORKDIR /workspace

COPY . /workspace

# 使用国内镜像源加速构建（可选，Railway 部署时可以移除）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories
RUN npm config set registry https://registry.npmmirror.com

RUN cd /workspace/jeepay-ui-${PLATFORM} && npm install && npm run build


# 运行阶段
FROM nginx:alpine

ARG PLATFORM

# 环境变量
ENV BACKEND_HOST=${BACKEND_HOST}
# Railway 会自动提供 PORT 环境变量
ENV PORT=${PORT:-80}

WORKDIR /workspace

COPY --from=builder /workspace/jeepay-ui-${PLATFORM}/dist /workspace
RUN chmod -R a+r /workspace

RUN rm -rf /etc/nginx/conf.d/default.conf

# 复制并修改 Nginx 配置模板以支持 PORT 变量
COPY --from=builder /workspace/default.conf.template /etc/nginx/templates/default.conf.template

# 复制启动脚本
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE ${PORT}

ENTRYPOINT ["/docker-entrypoint.sh"]

# Railway 部署说明
# 需要在 Railway 控制台设置以下环境变量：
# - PLATFORM: 选择要部署的平台 (cashier/manager/merchant)
# - BACKEND_HOST: 后端 API 服务地址 (例如: your-backend-service.railway.app)
# - PORT: 端口号（Railway 会自动分配，也可以手动设置）
#
# 编译命令示例
# docker buildx build . --build-arg PLATFORM=cashier -t jeepay-ui-cashier:latest
# docker buildx build . --build-arg PLATFORM=manager -t jeepay-ui-manager:latest
# docker buildx build . --build-arg PLATFORM=merchant -t jeepay-ui-merchant:latest
#
# 本地启动命令示例
# docker run -d -p 9226:80 -e BACKEND_HOST=172.20.0.21:9216 jeepay-ui-cashier:latest
# docker run -d -p 9227:80 -e BACKEND_HOST=172.20.0.22:9217 jeepay-ui-manager:latest
# docker run -d -p 9228:80 -e BACKEND_HOST=172.20.0.23:9218 jeepay-ui-merchant:latest
