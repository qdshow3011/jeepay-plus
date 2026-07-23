#!/bin/bash
# ============================================================
# Coolify 服务器 Docker 磁盘清理脚本
# 用途：解决 "no space left on device" 构建失败问题
# 使用：SSH 到 Coolify 服务器后执行 bash coolify-disk-cleanup.sh
# ============================================================

set -euo pipefail

echo "========================================"
echo "  Coolify Docker 磁盘清理"
echo "========================================"
echo ""

# 1. 显示当前磁盘使用情况
echo "[1/6] 当前磁盘使用情况:"
df -h / /var 2>/dev/null | grep -v "^Filesystem.*Mounted" | head -5
echo ""

# 2. 显示 Docker 磁盘使用情况
echo "[2/6] Docker 磁盘使用情况:"
docker system df
echo ""

# 3. 清理已停止的容器
echo "[3/6] 清理已停止的容器..."
STOPPED=$(docker ps -a --filter "status=exited" --filter "status=dead" -q | wc -l)
if [ "$STOPPED" -gt 0 ]; then
    echo "  发现 $STOPPED 个已停止的容器，正在清理..."
    docker container prune -f
else
    echo "  没有已停止的容器需要清理"
fi
echo ""

# 4. 清理悬空镜像 (dangling images)
echo "[4/6] 清理悬空镜像..."
DANGLING=$(docker images -f "dangling=true" -q | wc -l)
if [ "$DANGLING" -gt 0 ]; then
    echo "  发现 $DANGLING 个悬空镜像，正在清理..."
    docker image prune -f
else
    echo "  没有悬空镜像需要清理"
fi
echo ""

# 5. 清理未使用的镜像 (未被任何容器引用的镜像)
echo "[5/6] 清理未使用的镜像..."
UNUSED_IMAGES=$(docker images --filter "dangling=false" --format "{{.Repository}}:{{.Tag}} {{.Size}}" | head -20)
if [ -n "$UNUSED_IMAGES" ]; then
    echo "  当前存在的镜像:"
    echo "$UNUSED_IMAGES"
    echo ""
    echo "  清理未被容器引用的镜像..."
    docker image prune -a -f --filter "until=24h"
else
    echo "  没有未使用的镜像"
fi
echo ""

# 6. 清理 Docker 构建缓存 (BuildKit cache)
echo "[6/6] 清理 Docker 构建缓存..."
echo "  这将删除所有 BuildKit 缓存层..."
docker builder prune -a -f
echo ""

# 额外：清理未使用的 Docker volumes (谨慎操作)
echo "========================================"
echo "  清理完成！清理后磁盘使用情况:"
echo "========================================"
df -h / /var 2>/dev/null | grep -v "^Filesystem.*Mounted" | head -5
echo ""
docker system df
echo ""

# 检查是否还有空间问题
AVAIL=$(df / --output=avail -B1 | tail -1)
AVAIL_GB=$((AVAIL / 1024 / 1024 / 1024))
if [ "$AVAIL_GB" -lt 5 ]; then
    echo "========================================"
    echo "  ⚠️  警告：可用空间仍然不足 ${AVAIL_GB}GB"
    echo "  建议进行深度清理:"
    echo "========================================"
    echo ""
    echo "  1. 清理未使用的 Docker volumes (会删除数据!):"
    echo "     docker volume prune -f"
    echo ""
    echo "  2. 清理 Coolify 构建临时文件:"
    echo "     rm -rf /data/coolify/applications/*/builds/*"
    echo "     rm -rf /tmp/docker-build-*"
    echo ""
    echo "  3. 清理系统日志:"
    echo "     journalctl --vacuum-size=100M"
    echo ""
    echo "  4. 清理 apt 缓存:"
    echo "     apt-get clean && apt-get autoremove -y"
    echo ""
    echo "  5. 检查大文件:"
    echo "     find / -type f -size +500M 2>/dev/null | head -20"
else
    echo "========================================"
    echo "  ✅ 可用空间 ${AVAIL_GB}GB，可以重新部署了"
    echo "========================================"
fi
