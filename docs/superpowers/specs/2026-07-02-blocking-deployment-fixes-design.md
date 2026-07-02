# 阻断级部署问题修复设计

## 目标

使仓库中的 Docker Compose 部署配置形成一条自包含、无冲突的启动链路，并且只使用 ActiveMQ。

## 范围

- 从 Compose 中移除 RabbitMQ、RocketMQ NameServer、RocketMQ Broker 及其卷配置。
- MySQL、Redis、ActiveMQ 均使用 Compose 服务名作为容器内 DNS 名称。
- 三个后端服务的数据库账号、密码和中间件地址与 Compose 保持一致。
- 三个后端服务使用各自模块内的 Dockerfile 构建。
- 三个前端服务统一从仓库内 `./jeepay-ui` 构建，不依赖开发者机器绝对路径。
- 移除当前无法工作的总 Nginx 服务；收银台、运营端、商户端继续通过各自前端容器的 Nginx 和映射端口提供服务。

## 配置约定

- MySQL 服务名：`mysql`；数据库：`jeepaydb`；应用账号：`jeepay`；应用密码：`jeepay`。
- Redis 服务名：`redis`；容器端口：`6379`。
- ActiveMQ 服务名：`activemq`；容器端口：`61616`。
- 后端端口保持 `9216`、`9217`、`9218`。
- 前端映射端口保持 `9226`、`9227`、`9228`。

## 验证

增加一个无需 Docker、Java 或 Maven 的 PowerShell 静态验证脚本，检查：

1. Compose 只包含 ActiveMQ，不包含 RabbitMQ/RocketMQ。
2. 静态 IP 没有重复。
3. 后端 Dockerfile 路径真实存在。
4. 前端构建上下文为仓库相对路径且真实存在。
5. 三份生产配置中的 MySQL、Redis、ActiveMQ 地址和数据库凭据与 Compose 一致。
6. Compose 不再引用缺失的 `nginx.tar.gz` 或根目录 Dockerfile。

## 非目标

本次不处理依赖升级、JWT/CORS、业务 TODO、测试覆盖率和 SDK 版本冲突。
