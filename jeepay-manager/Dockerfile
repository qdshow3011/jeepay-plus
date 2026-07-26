FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /workspace
COPY .mvn/settings.xml /root/.m2/settings.xml
COPY . .
RUN mvn -B -pl jeepay-manager -am package -DskipTests

FROM eclipse-temurin:17-jre-jammy
LABEL maintainer="OpenHubs PAY Team"
ENV LANG=C.UTF-8 TZ=Asia/Shanghai
RUN apt-get update && apt-get install -y --no-install-recommends curl fontconfig fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system openhubs && useradd --system --gid openhubs --home /openhubshomes openhubs \
    && mkdir -p /openhubshomes/service/app /openhubshomes/service/logs /openhubshomes/service/uploads \
    && chown -R openhubs:openhubs /openhubshomes
COPY --from=builder --chown=openhubs:openhubs /workspace/jeepay-manager/target/jeepay-manager.jar /openhubshomes/service/app/jeepay-manager.jar
COPY --chown=openhubs:openhubs conf/manager/application.yml /openhubshomes/service/app/application.yml
USER openhubs
WORKDIR /openhubshomes/service/app
EXPOSE 9217
ENTRYPOINT ["java", "-jar", "jeepay-manager.jar"]
