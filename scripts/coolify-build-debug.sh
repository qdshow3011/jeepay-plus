#!/bin/bash
# ============================================================
# Coolify 构建失败诊断脚本 (exit code 255 / OOM / BuildKit)
# 用途：诊断 Docker 构建失败原因
# ============================================================

set -euo pipefail

echo "========================================"
echo "  Coolify Docker 构建诊断"
echo "========================================"
echo ""

# 1. 检查系统资源
echo "[1] 系统资源状态:"
echo "   CPU: $(nproc) 核"
MEM_TOTAL=$(free -m | awk '/^Mem:/{print $2}')
MEM_AVAIL=$(free -m | awk '/^Mem:/{print $7}')
echo "   内存: 可用 ${MEM_AVAIL}MB / 总计 ${MEM_TOTAL}MB"
echo "   Swap: $(free -m | awk '/^Swap:/{print $3}')MB 已用 / $(free -m | awk '/^Swap:/{print $2}')MB 总计"
echo ""

# 2. 检查磁盘空间
echo "[2] 磁盘空间:"
df -h / /var/lib/docker 2>/dev/null | grep -v "^Filesystem"
DOCKER_ROOT=$(docker info --format '{{.DockerRootDir}}' 2>/dev/null || echo "/var/lib/docker")
echo "   Docker 数据目录: ${DOCKER_ROOT}"
echo ""

# 3. Docker 状态
echo "[3] Docker 状态:"
if systemctl is-active --quiet docker 2>/dev/null || pgrep -x dockerd > /dev/null; then
    echo "   Docker daemon: 运行中"
else
    echo "   Docker daemon: ⚠️ 未运行！需要启动 Docker"
fi
echo "   Docker 版本: $(docker version --format '{{.Server.Version}}' 2>/dev/null || echo 'unknown')"
echo "   BuildKit 版本: $(docker buildx version 2>/dev/null || echo 'not installed')"
echo ""

# 4. 检查 Docker 磁盘使用
echo "[4] Docker 磁盘使用:"
docker system df 2>/dev/null || echo "   (无法获取)"
echo ""

# 5. 检查是否有残留的构建容器
echo "[5] 残留构建容器:"
BUILD_DEAD=$(docker ps -a --filter "status=exited" --filter "status=dead" -q 2>/dev/null | wc -l)
echo "   已停止/死掉的容器: ${BUILD_DEAD}"
if [ "${BUILD_DEAD}" -gt 0 ]; then
    echo "   (可运行 'docker container prune -f' 清理)"
fi
echo ""

# 6. 检查 BuildKit 状态
echo "[6] BuildKit 状态:"
if docker buildx ls 2>/dev/null | grep -q "default"; then
    echo "   BuildKit builder: 可用"
else
    echo "   BuildKit builder: ⚠️ 不可用，需要创建"
fi
echo ""

# 7. 检查 Docker Hub 连通性
echo "[7] Docker Hub 连通性测试:"
if curl -s --connect-timeout 5 -o /dev/null -w "%{http_code}" https://registry-1.docker.io/v2/ 2>/dev/null | grep -q "401\|200"; then
    echo "   Docker Hub: 可达"
else
    echo "   Docker Hub: ⚠️ 不可达（网络问题或被墙）"
fi
echo ""

# 8. 检查 OOM 历史
echo "[8] OOM 历史 (最近10条):"
if command -v dmesg &> /dev/null; then
    dmesg -T 2>/dev/null | grep -i "oom\|out of memory\|killed process" | tail -10 || echo "   (无 OOM 记录)"
else
    journalctl -k --no-pager -n 50 2>/dev/null | grep -i "oom\|out of memory" | tail -10 || echo "   (无 OOM 记录)"
fi
echo ""

echo "========================================"
echo "  诊断结论:"
echo "========================================"
echo ""

# 给出建议
HAS_ISSUES=false

if [ "${MEM_AVAIL}" -lt 2048 ]; then
    echo "  ⚠️  可用内存不足 2GB，构建可能因 OOM 被杀死"
    echo "  建议: 1) 添加 swap: fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile"
    echo "        2) 在 Coolify 中增加服务器内存"
    echo "        3) 限制并行构建数: export COMPOSE_PARALLEL_LIMIT=2"
    HAS_ISSUES=true
fi

AVAIL_GB=$(df / --output=avail -B1 2>/dev/null | tail -1)
AVAIL_GB=$((AVAIL_GB / 1024 / 1024 / 1024))
if [ "${AVAIL_GB}" -lt 10 ]; then
    echo "  ⚠️  可用磁盘空间不足 10GB"
    echo "  建议: 运行 scripts/coolify-disk-cleanup.sh 清理磁盘"
    HAS_ISSUES=true
fi

if [ "${BUILD_DEAD}" -gt 20 ]; then
    echo "  ⚠️  存在大量残留容器，可能占用磁盘和 inode"
    echo "  建议: docker container prune -f"
    HAS_ISSUES=true
fi

if ! "${HAS_ISSUES}"; then
    echo "  ✅ 未发现明显资源问题"
    echo ""
    echo "  如果构建仍然失败，尝试以下步骤:"
fi

echo ""
echo "  快速修复:"
echo "  1. 重启 Docker daemon: systemctl restart docker"
echo "  2. 清理 BuildKit 缓存: docker builder prune -a -f"
echo "  3. 清理所有 Docker 缓存: docker system prune -a -f"
echo "  4. 重启整个服务器: reboot"
echo ""
echo "  如果仍失败，尝试禁用 BuildKit:"
echo "    在 Coolify 构建命令前添加 DOCKER_BUILDKIT=0"
echo "    或在 /etc/docker/daemon.json 中禁用 buildkit"
