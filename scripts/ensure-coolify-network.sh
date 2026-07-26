#!/bin/bash
# ============================================================
# 确保 Coolify Traefik 代理网络存在
# 在 Coolify 部署前 SSH 到服务器执行此脚本
# ============================================================

set -e

echo "=== 检查 Coolify 网络 ==="

# 检查 coolify 网络是否存在，不存在则创建
if docker network inspect coolify >/dev/null 2>&1; then
    echo "[OK] coolify 网络已存在"
else
    echo "[CREATE] coolify 网络不存在，正在创建..."
    docker network create coolify
    echo "[OK] coolify 网络创建成功"
fi

# 显示网络信息
echo ""
echo "=== 网络详情 ==="
docker network inspect coolify --format '{{.Name}} (driver: {{.Driver}}, scope: {{.Scope}})'

# 检查 Traefik 是否连接到此网络
echo ""
echo "=== Traefik 容器状态 ==="
TRAEFIK=$(docker ps --filter "name=traefik" --format "{{.Names}}" 2>/dev/null | head -1)
if [ -n "$TRAEFIK" ]; then
    echo "[OK] Traefik 容器: $TRAEFIK"
    # 检查 Traefik 是否在 coolify 网络上
    if docker network inspect coolify --format '{{range .Containers}}{{.Name}} {{end}}' | grep -q "$TRAEFIK"; then
        echo "[OK] Traefik 已连接到 coolify 网络"
    else
        echo "[WARN] Traefik 未连接到 coolify 网络！"
        echo "  尝试手动连接: docker network connect coolify $TRAEFIK"
    fi
else
    echo "[WARN] 未找到 Traefik 容器，Coolify 代理可能未启动"
fi

echo ""
echo "=== 完成 ==="
