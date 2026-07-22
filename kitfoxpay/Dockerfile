# KitfoxPay Dockerfile
# Node.js 22 Alpine 精简生产镜像
FROM node:22-alpine

WORKDIR /app

# 复制 package 文件并安装生产依赖
COPY package.json package-lock.json ./
RUN npm install --production --registry=https://registry.npmmirror.com

# 复制应用源码
COPY index.js ./
COPY newpay.js ./
COPY epay.js ./
COPY myzfw.js ./
COPY admin.js ./
COPY test.js ./
COPY test-sign.js ./
COPY config.example.js ./
COPY config.js ./
COPY jeepay/ ./jeepay/
COPY public/ ./public/
COPY docs/ ./docs/

# 默认环境变量
ENV NODE_ENV=production
ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=9219
ENV JEEPAY_BASE_URL=http://host.docker.internal:9216
ENV SITE_DOMAIN=http://localhost:9219

EXPOSE 9219

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:9219/api/health',r=>{process.exit(r.statusCode===200?0:1)})"

CMD ["node", "index.js"]
