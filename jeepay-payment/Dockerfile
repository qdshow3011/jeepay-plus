FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /workspace
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
COPY . .
RUN mvn -B -pl jeepay-payment -am package -DskipTests

FROM eclipse-temurin:17-jre-jammy
LABEL maintainer="Jeepay Team"
ENV LANG=C.UTF-8 TZ=Asia/Shanghai
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system jeepay && useradd --system --gid jeepay --home /jeepayhomes jeepay \
    && mkdir -p /jeepayhomes/service/app /jeepayhomes/service/logs /jeepayhomes/service/uploads \
    && chown -R jeepay:jeepay /jeepayhomes
COPY --from=builder --chown=jeepay:jeepay /workspace/jeepay-payment/target/jeepay-payment.jar /jeepayhomes/service/app/jeepay-payment.jar
COPY --chown=jeepay:jeepay conf/payment/application.yml /jeepayhomes/service/app/application.yml
USER jeepay
WORKDIR /jeepayhomes/service/app
EXPOSE 9216
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=5 CMD curl --fail --silent http://localhost:9216/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "jeepay-payment.jar"]
