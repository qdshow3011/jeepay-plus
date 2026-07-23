# Coolify 部署指南

## 最低系统要求

| 资源 | 最低 | 推荐 | 说明 |
|------|------|------|------|
| CPU | 2 核 | 4 核 | Java Maven 构建 CPU 密集 |
| 内存 | 4 GB | **8 GB** | 7个服务并行构建，Java 编译峰值 1-2GB/个 |
| 磁盘 | **30 GB** | 50 GB+ | Docker 镜像 + 构建缓存，Maven 依赖 ~2GB |
| Swap | 4 GB | 4 GB | 防止构建 OOM |
| Docker | 24.0+ | 最新版 | 需要 BuildKit 支持 |

> ⚠️ **exit code 255 = 99% 的情况是内存不足导致 Docker daemon 被 OOM Killer 杀死。**
> 如果服务器内存 < 4GB，必须先添加 swap 或升级内存。

## 部署前准备

### 1. 清理 Docker 磁盘空间

SSH 到 Coolify 服务器，执行清理脚本：

```bash
# 下载并执行清理脚本（或手动执行以下命令）
bash scripts/coolify-disk-cleanup.sh
```

或手动执行核心清理命令：

```bash
# 清理已停止的容器
docker container prune -f

# 清理悬空镜像
docker image prune -f

# 清理未被容器引用的镜像
docker image prune -a -f --filter "until=24h"

# 清理构建缓存（最重要！）
docker builder prune -a -f

# 查看清理后的空间
df -h /
docker system df
```

### 2. 深度清理（如果空间仍不足）

```bash
# 清理未使用的 Docker volumes（⚠️ 会删除数据，确保无重要数据）
docker volume prune -f

# 清理 Coolify 构建临时文件
rm -rf /data/coolify/applications/*/builds/*
rm -rf /tmp/docker-build-*

# 清理系统日志
journalctl --vacuum-size=100M

# 清理 apt 缓存
apt-get clean && apt-get autoremove -y

# 查找大文件
find / -type f -size +500M 2>/dev/null | head -20
```

## Coolify 配置

### 1. 创建新项目

1. 在 Coolify 中创建新项目，选择 "Docker Compose" 类型
2. 选择 Git 仓库源，指定 `jeepay-plus` 目录
3. Coolify 会自动识别 `docker-compose.yml`

### 2. 环境变量配置

在 Coolify 的环境变量中配置以下变量（参考 `.env.example`）：

```env
# MySQL
MYSQL_ROOT_PASSWORD=<强密码>
MYSQL_DATABASE=openhubsdb
MYSQL_USER=openhubs
MYSQL_PASSWORD=<强密码>

# ActiveMQ
ACTIVEMQ_USER=admin
ACTIVEMQ_PASSWORD=<强密码>

# JWT 密钥
MANAGER_JWT_SECRET=<随机字符串>
MERCHANT_JWT_SECRET=<随机字符串>

# CORS
OPENHUBS_CORS_ALLOWED_ORIGINS=https://your-domain.com

# KitfoxPay
KITFOX_MCH_NO=M1784708760
KITFOX_APP_ID=6a607e98e4b022b84e41f0e2
KITFOX_PRIVATE_KEY=<你的私钥>
KITFOX_EPAY_PID=1001
KITFOX_EPAY_KEY=<你的EPay密钥>
KITFOX_SITE_DOMAIN=https://your-domain.com
KITFOX_ADMIN_PASSWORD=<强密码>
```

### 3. 构建优化说明

本项目已做以下优化以减少磁盘占用和构建失败：

1. **MySQL 改用官方镜像** — 不再构建自定义 MySQL 镜像，通过 volume mount 挂载 `init.sql`
2. **`.dockerignore` 优化** — 排除文档、其他服务源码、脚本等不必要文件，减少 build context
3. **Vue UI Dockerfile 分层构建** — `package.json` 先于源码复制并 `npm install`，依赖不变时复用 Docker 缓存，跳过 3-5 分钟的安装过程
4. **Vue UI 内存限制** — `NODE_OPTIONS=--max-old-space-size=4096` 防止 Vite 构建 OOM
5. **Vue UI npm 镜像** — 默认使用 `registry.npmmirror.com`，国内构建速度提升 5-10 倍
6. **多阶段构建** — Java 服务使用 Maven 多阶段构建，最终镜像只包含 JRE + JAR

### 4. 构建顺序

Coolify 默认并行构建所有服务。如果遇到资源不足，可以设置构建依赖：

```yaml
# 在 docker-compose.yml 中已配置 depends_on
# 但构建阶段 Coolify 可能仍并行执行
# 如果 OOM，建议在 Coolify 设置中限制并行构建数
```

## 常见问题

### 构建失败 exit code 255（构建进程被杀）

**原因**：最常见的 exit code 255 原因排序：

1. **Docker daemon OOM（内存不足）** — 本项目有 7+ 个服务并行构建，每个 Java 构建需要 ~1GB 内存，总内存峰值可达 6-8GB
2. **BuildKit 状态损坏** — 上次构建被中断，残留锁文件或损坏的缓存层
3. **磁盘空间再次不足** — 尽管清理过，新构建又占满了磁盘
4. **Docker Hub 不可达** — `--pull` 强制拉取所有基础镜像，网络失败导致整个构建退出

**诊断**：
```bash
# SSH 到 Coolify 服务器，运行诊断脚本
bash scripts/coolify-build-debug.sh

# 或手动检查:
free -h                          # 内存是否充足（建议 4GB+ 可用）
df -h / /var/lib/docker          # 磁盘是否 >= 10GB 可用
dmesg | grep -i "oom\|killed"    # 是否有 OOM Killer 记录
docker system df                 # Docker 占用情况
```

**三步修复法**：

```bash
# 第1步: 重启 Docker daemon（清理 BuildKit 状态）
systemctl restart docker

# 第2步: 彻底清理（注意会删除缓存，下次构建慢一些）
docker system prune -a -f --volumes

# 第3步: 添加 swap（如果内存不足）
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

如果仍然失败，尝试禁用 BuildKit（在 Coolify 构建命令前添加 `DOCKER_BUILDKIT=0`），这会降低并行度但更稳定。

### "no space left on device"

**原因**：服务器磁盘空间不足。

**解决**：
1. 执行 `scripts/coolify-disk-cleanup.sh` 清理脚本
2. 如果仍然不足，执行深度清理（见上文）
3. 考虑扩展服务器磁盘

### npm install / npm run build 失败（exit code 1）

日志特征：`"npm install" "npm run build" did not complete successfully: exit code: 1`

**常见原因排序**：

1. **Node OOM（内存不足）** — Vue + Vite + ant-design-vue + echarts 构建峰值需要 **2-3GB 内存**（仅前端构建部分）
2. **npm registry 超时** — 默认 `registry.npmjs.org` 从国内服务器访问很慢（本项目已改为 `npmmirror.com`）
3. **npm install 在全量 COPY 后执行** — 旧 Dockerfile 先 `COPY . /workspace` 再安装，导致每次代码变更都重新下载全部依赖

**已修复**（本次更新）：

```dockerfile
# Dockerfile 优化说明:
# 1. NODE_OPTIONS=--max-old-space-size=4096  → 防止 OOM
# 2. npm registry 默认 npmmirror.com          → 国内镜像加速
# 3. 分层 COPY: package.json 先复制再 npm install  → Docker 层缓存，依赖不变时跳过安装
```

**如果仍然失败**，在 Coolify 构建参数中添加：
```bash
--build-arg NPM_REGISTRY=https://registry.npmjs.org  # 海外服务器用官方源
```

或在 Coolify 环境变量中设置 `NPM_REGISTRY`。

### 构建超时 / 拉取镜像失败

**原因**：ActiveMQ 构建需要下载 ~200MB 归档文件，Maven/Node 需要下载依赖。`--pull` 强制重新拉取所有基础镜像。

**解决**：
1. 确保服务器网络通畅
2. 如果在国内服务器，Docker Hub 可能很慢，配置镜像加速器：
```bash
# /etc/docker/daemon.json
{
  "registry-mirrors": ["https://docker.1ms.run"]
}
systemctl restart docker
```
3. Maven 同理，在 Coolify 环境变量中指定国内镜像源
4. 首次构建预计 15-30 分钟（取决于网络和服务器配置）

### MySQL 初始化失败

**原因**：`init.sql` 挂载路径不正确。

**解决**：
1. 确认 `docs/sql/init.sql` 文件存在于仓库中
2. 检查 Coolify 构建目录结构
3. 如果 bind mount 不可用（某些 Coolify 配置），恢复使用 Dockerfile 构建

### 服务启动后立即退出

**原因**：依赖服务未就绪。

**解决**：
- `docker-compose.yml` 已配置 `depends_on` + `condition: service_healthy`
- 如果仍然失败，检查 MySQL/Redis/ActiveMQ 的健康状态

## 端口映射

| 服务 | 内部端口 | 外部端口 | 说明 |
|------|----------|----------|------|
| MySQL | 3306 | 3306 | 数据库 |
| ActiveMQ | 8161 | 8161 | 消息队列管理界面 |
| Payment | 9216 | 9216 | 支付服务 API |
| Manager | 9217 | 9217 | 运营平台 API |
| Merchant | 9218 | 9218 | 商户平台 API |
| UI Payment | 80 | 9226 | 收银台前端 |
| UI Manager | 80 | 9227 | 运营平台前端 |
| UI Merchant | 80 | 9228 | 商户平台前端 |
| KitfoxPay | 9219 | 9229 | EPay 网关 |

> 在 Coolify 中建议通过反向代理（域名）暴露前端服务，而非直接映射端口。
