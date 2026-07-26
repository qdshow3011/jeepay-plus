FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /workspace
# 限制 Maven JVM 堆内存，防止 Coolify 并行构建时 OOM
ENV MAVEN_OPTS="-Xmx512m -XX:MaxMetaspaceSize=256m"
COPY .mvn/settings.xml /root/.m2/settings.xml
COPY . .
RUN mvn -B -pl jeepay-payment -am package -DskipTests

FROM eclipse-temurin:17-jre-jammy
LABEL maintainer="OpenHubs PAY Team"
ENV LANG=C.UTF-8 TZ=Asia/Shanghai
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system openhubs && useradd --system --gid openhubs --home /openhubshomes openhubs \
    && mkdir -p /openhubshomes/service/app /openhubshomes/service/logs /openhubshomes/service/uploads \
    && chown -R openhubs:openhubs /openhubshomes
COPY --from=builder --chown=openhubs:openhubs /workspace/jeepay-payment/target/jeepay-payment.jar /openhubshomes/service/app/jeepay-payment.jar
COPY --chown=openhubs:openhubs conf/payment/application.yml /openhubshomes/service/app/application.yml
USER openhubs
WORKDIR /openhubshomes/service/app
EXPOSE 9216
ENTRYPOINT ["java", "-jar", "jeepay-payment.jar"]
