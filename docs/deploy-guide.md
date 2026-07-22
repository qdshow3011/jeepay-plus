# OpenHubs PAY + KitfoxPay 融合部署说明书

## 1. 系统概述

OpenHubs PAY 是一套完整的支付平台系统，集成了 **KitfoxPay 易支付协议适配网关**，
支持商户通过标准 EPay（易支付）协议接入支付能力。

### 1.1 架构概览

```
┌──────────────────────────────────────────────────────────────┐
│                      外部商户系统                              │
│  (NewAPI / 任意支持易支付协议的第三方系统)                       │
└──────┬───────────────────────────────────────────────────────┘
       │ EPay 协议 (submit.php / mapi.php / api.php)
       ▼
┌──────────────────────────────────────────────────────────────┐
│                 KitfoxPay (Node.js)                           │
│  端口: 9229 → 9219 (容器内部)                                  │
│  职责: EPay 协议解析 → Jeepay API 转换 → 签名验证 → 回调转发    │
└──────┬───────────────────────────────────────────────────────┘
       │ Jeepay REST API (内部网络)
       ▼
┌──────────────────────────────────────────────────────────────┐
│                OpenHubs PAY (Spring Boot)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │ Payment  │  │ Manager  │  │ Merchant │                   │
│  │  :9216   │  │  :9217   │  │  :9218   │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │ UI-Cash  │  │ UI-Mgr   │  │ UI-Mch   │                   │
│  │  :9226   │  │  :9227   │  │  :9228   │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
└──────────────────────────────────────────────────────────────┘
       │              │              │
       ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│  MySQL   │  │  Redis   │  │ ActiveMQ │
│  :3306   │  │  :6379   │  │  :61616  │
└──────────┘  └──────────┘  └──────────┘
```

### 1.2 服务清单（全部 10 个）

| # | 服务名 | 类型 | 对外端口 | 内部端口 | 说明 |
|---|--------|------|---------|---------|------|
| 1 | mysql | 数据库 | 3306 | 3306 | MySQL 8.0, 初始化脚本自动执行 |
| 2 | redis | 缓存 | — | 6379 | Redis 7.4 Alpine, DB1=运营/DB2=商户/DB3=支付 |
| 3 | activemq | 消息队列 | 8161 | 61616 | ActiveMQ Classic, Jetty 管理界面已禁用 |
| 4 | payment | 后端 | 9216 | 9216 | 支付网关核心 API (Spring Boot) |
| 5 | manager | 后端 | 9217 | 9217 | 运营管理后台 API |
| 6 | merchant | 后端 | 9218 | 9218 | 商户自服务 API |
| 7 | ui-payment | 前端 | 9226 | 80 | 收银台页面 (Vue.js + Nginx) |
| 8 | ui-manager | 前端 | 9227 | 80 | 运营管理界面 |
| 9 | ui-merchant | 前端 | 9228 | 80 | 商户管理界面 |
| 10 | **kitfoxpay** | 网关 | **9229** | 9219 | 易支付协议适配网关 (Node.js) |

---

## 2. 环境要求

| 软件 | 最低版本 | 说明 |
|------|---------|------|
| Docker | 24.0+ | 容器运行环境 |
| Docker Compose | v2.0+ (插件版) | 多容器编排 |
| 内存 | ≥ 4 GB | 全部服务同时运行的建议值 |
| 磁盘 | ≥ 10 GB | 包含镜像和持久化数据卷 |

---

## 3. 快速部署

### 3.1 克隆仓库

```bash
git clone https://github.com/qdshow3011/jeepay-plus.git
cd jeepay-plus
```

### 3.2 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，至少修改以下变量：

```ini
# 数据库密码（三处均需修改）
MYSQL_ROOT_PASSWORD=<强密码>
MYSQL_PASSWORD=<强密码>

# 消息队列
ACTIVEMQ_PASSWORD=<强密码>

# JWT 密钥（至少 32 字节随机字符串）
MANAGER_JWT_SECRET=<随机生成>
MERCHANT_JWT_SECRET=<随机生成>

# KitfoxPay 易支付密钥（下游系统对接时使用）
KITFOX_EPAY_KEY=<32 位 MD5 密钥>
KITFOX_PRIVATE_KEY=<从运营后台获取的商户私钥>
KITFOX_SITE_DOMAIN=http://<你的服务器IP或域名>:9229
```

### 3.3 一键启动

```bash
docker compose up -d
```

首次构建约需 5-10 分钟（含 Maven 编译 Java 后端 + 下载 npm 依赖）。后续启动约 30 秒。

### 3.4 验证部署

```bash
# 检查所有服务是否健康
docker compose ps

# 预期输出: 10 个服务均为 Up (healthy)
```

访问以下地址确认：

| 地址 | 说明 |
|------|------|
| http://localhost:9227 | 运营管理后台 (admin / admin123) |
| http://localhost:9228 | 商户管理后台 (admin / admin123) |
| http://localhost:9226 | 收银台页面 |
| http://localhost:9229/api/health | KitfoxPay 健康检查 |

---

## 4. KitfoxPay 易支付网关使用

### 4.1 接口地址

KitfoxPay 提供与标准易支付兼容的接口：

| 接口 | 方法 | 地址 | 说明 |
|------|------|------|------|
| 前台支付提交 | GET/POST | `http://localhost:9229/submit.php` | 发起支付，返回支付表单或跳转 URL |
| 后台 API 支付 | GET/POST | `http://localhost:9229/mapi.php` | 后端直接调用 |
| 统一 API | GET/POST | `http://localhost:9229/api.php` | 查询/退款/结算（通过 act 参数区分） |
| 支付通知回调 | POST | `http://localhost:9229/api/payment/notify` | Jeepay → EPay 通知转发 |
| 退款通知回调 | POST | `http://localhost:9229/api/refund/notify` | Jeepay → EPay 退款通知转发 |

### 4.2 签名参数

- **商户 ID (pid)**: 1001（默认，见 `.env` 中 `KITFOX_EPAY_PID`）
- **签名密钥 (key)**: 见 `.env` 中 `KITFOX_EPAY_KEY`
- **签名算法**: MD5
- **签名方式**: 参数按 key 字典序拼接 + key，取 MD5（大写）

### 4.3 支付测试示例

```bash
# 生成签名
SIGN=$(node -e "
const crypto = require('crypto');
const params = { pid:'1001', type:'ALI_WAP', out_trade_no:'TEST' + Date.now(), money:'0.01', name:'测试订单', notify_url:'http://your-host/notify', return_url:'http://your-host/return' };
const signStr = Object.keys(params).sort().map(k => k + '=' + params[k]).join('&') + '你的EPAY_KEY';
console.log(crypto.createHash('md5').update(signStr).digest('hex').toUpperCase());
")

# 发起支付
curl "http://localhost:9229/submit.php?pid=1001&type=ALI_WAP&out_trade_no=TEST123&money=0.01&name=测试&notify_url=http://your-host/notify&return_url=http://your-host/return&sign=${SIGN}&sign_type=MD5"
```

---

## 5. 常用运维命令

```bash
# 查看全部服务状态
docker compose ps

# 查看实时日志（全部服务）
docker compose logs -f

# 查看单个服务日志
docker compose logs -f kitfoxpay
docker compose logs -f payment

# 重启单个服务
docker compose restart kitfoxpay

# 停止全部服务
docker compose down

# 停止并清理数据卷（危险：会删除数据库数据）
docker compose down -v

# 更新后重新构建并启动
docker compose up -d --build
```

---

## 6. 运营后台配置

### 6.1 商户配置

1. 登录运营后台: http://localhost:9227 (账号: admin / 密码: admin123)
2. 进入 **商户管理** → 查看默认商户 M1784708760（青岛华城智慧地产服务有限公司）
3. 进入 **支付接口配置** → 配置支付宝/微信等渠道参数

### 6.2 添加支付通道

KitfoxPay 下单需要商户配置支付通道。以支付宝为例：

1. 运营后台 → **支付接口配置** → 新增支付宝配置（填入 appId/私钥/公钥）
2. 运营后台 → **商户支付通道** → 为商户 M1784708760 新增通道
   - 应用: 选择对应的应用
   - 支付接口: alipay
   - 支付方式: ALI_WAP（手机网站支付）
   - 费率: 0.006（0.6%）

### 6.3 EPay 渠道配置

商户可通过 EPay 渠道接入第三方支付：

1. 运营后台 → **EPay 配置** → 新增 EPay 渠道
2. 填入下游 EPay 服务商的 pid、key 和接口地址
3. 在商户支付通道中关联 EPay 渠道

---

## 7. 安全建议

1. **生产环境务必修改所有默认密码**: MySQL、ActiveMQ、JWT Secret、KitfoxPay Admin 密码
2. **CORS 配置**: 将 `OPENHUBS_CORS_ALLOWED_ORIGINS` 改为实际域名
3. **HTTPS**: 建议在前置 Nginx/反向代理配置 SSL
4. **数据备份**: 定期备份 `mysql` 卷中的数据
5. **日志轮转**: 生产环境建议配置 Docker 日志驱动（json-file 配合 max-size）

---

## 8. 故障排查

| 现象 | 可能原因 | 解决方法 |
|------|---------|---------|
| 服务启动超时 | Maven 构建慢 | 配置国内 Maven 镜像，等待完成 |
| ui-manager 502 | Nginx DNS 缓存 | 已修复 (resolver 127.0.0.11) |
| admin 登录失败 | BCrypt 密码不匹配 | 已修复，恢复 init.sql 重建即可 |
| 支付返回"系统异常" | 支付接口未配置真实凭证 | 在运营后台填入真实支付宝/微信密钥 |
| KitfoxPay 返回"商户应用不支持" | 未配置支付通道 | 参考 6.2 节添加通道 |
| 容器重启后端口占用 | Docker 未释放端口 | `docker compose down` 后等待 10 秒重新启动 |

---

## 9. 附录

### 9.1 端口分配总表

| 端口 | 服务 | 用途 |
|------|------|------|
| 3306 | MySQL | 数据库连接 |
| 61616 | ActiveMQ | 消息队列 (内部) |
| 8161 | ActiveMQ Web | 管理界面 (已禁用) |
| 6379 | Redis | 缓存 (内部) |
| 9216 | Payment API | 支付网关后端 |
| 9217 | Manager API | 运营管理后端 |
| 9218 | Merchant API | 商户管理后端 |
| 9226 | Payment UI | 收银台前端 |
| 9227 | Manager UI | 运营管理前端 |
| 9228 | Merchant UI | 商户管理前端 |
| 9229 | KitfoxPay | 易支付协议网关 |

### 9.2 项目仓库

- GitHub: https://github.com/qdshow3011/jeepay-plus.git
- 分支: main
- 许可证: MIT (KitfoxPay) / Apache 2.0 (OpenHubs PAY)
