#
#   jeepay-merchant（商户管理平台）Java 程序镜像构建脚本
#   支持多阶段构建：Maven 构建 + JRE 运行
#

# ------ 构建阶段 ------
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /workspace

# 复制 POM 文件
COPY pom.xml /workspace/pom.xml
COPY jeepay-core/pom.xml /workspace/jeepay-core/pom.xml
COPY jeepay-service/pom.xml /workspace/jeepay-service/pom.xml
COPY jeepay-components/pom.xml /workspace/jeepay-components/pom.xml
COPY jeepay-components/jeepay-components-mq/pom.xml /workspace/jeepay-components/jeepay-components-mq/pom.xml
COPY jeepay-components/jeepay-components-oss/pom.xml /workspace/jeepay-components/jeepay-components-oss/pom.xml
COPY jeepay-merchant/pom.xml /workspace/jeepay-merchant/pom.xml

# 下载依赖（利用 Docker 缓存，使用基础镜像内置的 mvn）
RUN --mount=type=cache,target=/root/.m2 mvn -B -pl jeepay-merchant -am dependency:go-offline

# 复制源码
COPY jeepay-core/src /workspace/jeepay-core/src
COPY jeepay-service/src /workspace/jeepay-service/src
COPY jeepay-components/jeepay-components-mq/src /workspace/jeepay-components/jeepay-components-mq/src
COPY jeepay-components/jeepay-components-oss/src /workspace/jeepay-components/jeepay-components-oss/src
COPY jeepay-merchant/src /workspace/jeepay-merchant/src

# 构建
RUN --mount=type=cache,target=/root/.m2 mvn -B -pl jeepay-merchant -am clean package -DskipTests

# ------ 运行阶段 ------
FROM eclipse-temurin:17-jre-jammy

LABEL maintainer="Jeepay Team"

ENV LANG=C.UTF-8
ENV TZ=Asia/Shanghai

EXPOSE 9218

VOLUME ["/jeepayhomes/service/logs", "/jeepayhomes/service/uploads"]

RUN mkdir -p /jeepayhomes/service/app

# 从构建阶段复制 jar
COPY --from=builder /workspace/jeepay-merchant/target/jeepay-merchant.jar /jeepayhomes/service/app/jeepay-merchant.jar

WORKDIR /jeepayhomes/service/app

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:9218/ || wget -q --spider http://localhost:9218/ || exit 1

CMD ["java", "-jar", "jeepay-merchant.jar"]