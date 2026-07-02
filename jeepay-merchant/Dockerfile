#
#   jeepay-merchant（商户管理平台）Java 程序镜像构建脚本
#

FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /workspace

RUN mkdir -p /root/.m2
COPY <<EOF /root/.m2/settings.xml
<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 http://maven.apache.org/xsd/settings-1.0.0.xsd">
  <mirrors>
    <mirror>
      <id>aliyunmaven</id>
      <mirrorOf>central</mirrorOf>
      <url>https://maven.aliyun.com/repository/public</url>
    </mirror>
  </mirrors>
</settings>
EOF

COPY pom.xml /workspace/pom.xml
COPY jeepay-z-codegen/pom.xml /workspace/jeepay-z-codegen/pom.xml
COPY jeepay-core/pom.xml /workspace/jeepay-core/pom.xml
COPY jeepay-service/pom.xml /workspace/jeepay-service/pom.xml
COPY jeepay-components/pom.xml /workspace/jeepay-components/pom.xml
COPY jeepay-components/jeepay-components-mq/pom.xml /workspace/jeepay-components/jeepay-components-mq/pom.xml
COPY jeepay-components/jeepay-components-oss/pom.xml /workspace/jeepay-components/jeepay-components-oss/pom.xml
COPY jeepay-merchant/pom.xml /workspace/jeepay-merchant/pom.xml

RUN mvn -B -pl jeepay-merchant -am dependency:go-offline || true

COPY jeepay-core/src /workspace/jeepay-core/src
COPY jeepay-service/src /workspace/jeepay-service/src
COPY jeepay-components/jeepay-components-mq/src /workspace/jeepay-components/jeepay-components-mq/src
COPY jeepay-components/jeepay-components-oss/src /workspace/jeepay-components/jeepay-components-oss/src
COPY jeepay-merchant/src /workspace/jeepay-merchant/src

RUN mvn -B -pl jeepay-merchant -am clean package -DskipTests

FROM eclipse-temurin:17-jre-jammy

LABEL maintainer="Jeepay Team"

ENV LANG=C.UTF-8
ENV TZ=Asia/Shanghai

EXPOSE 9218

VOLUME ["/jeepayhomes/service/logs", "/jeepayhomes/service/uploads"]

RUN mkdir -p /jeepayhomes/service/app

COPY --from=builder /workspace/jeepay-merchant/target/jeepay-merchant.jar /jeepayhomes/service/app/jeepay-merchant.jar

WORKDIR /jeepayhomes/service/app

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:9218/ || wget -q --spider http://localhost:9218/ || exit 1

CMD ["java", "-jar", "jeepay-merchant.jar"]