#!/bin/bash
# KitfoxPay 启动脚本
# 作为 OpenHubs PAY 的易支付协议适配网关

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NODE="C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2/node.exe"

export JEEPAY_BASE_URL="${JEEPAY_BASE_URL:-http://localhost:9216}"
export JEEPAY_MCH_NO="${JEEPAY_MCH_NO:-M1784708760}"
export JEEPAY_APP_ID="${JEEPAY_APP_ID:-6a607e98e4b022b84e41f0e2}"
export JEEPAY_PRIVATE_KEY="${JEEPAY_PRIVATE_KEY}"
export EPAY_PID="${EPAY_PID:-1001}"
export EPAY_KEY="${EPAY_KEY}"
export SERVER_HOST="${SERVER_HOST:-0.0.0.0}"
export SERVER_PORT="${SERVER_PORT:-9219}"
export SITE_DOMAIN="${SITE_DOMAIN:-http://localhost:9219}"
export ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"

echo "Starting KitfoxPay on ${SERVER_HOST}:${SERVER_PORT}..."
exec "$NODE" "$SCRIPT_DIR/index.js"
