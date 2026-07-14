FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /workspace
COPY .mvn/settings.xml /root/.m2/settings.xml
COPY . .
RUN mvn -B -pl openhubs-pay-payment -am package -DskipTests

FROM eclipse-temurin:17-jre-jammy
LABEL maintainer="OpenHubs Pay Team"
ENV LANG=C.UTF-8 TZ=Asia/Shanghai
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system openhubs_pay && useradd --system --gid openhubs_pay --home /openhubs-pay-homes openhubs_pay \
    && mkdir -p /openhubs-pay-homes/service/app /openhubs-pay-homes/service/logs /openhubs-pay-homes/service/uploads \
    && chown -R openhubs_pay:openhubs_pay /openhubs-pay-homes
COPY --from=builder --chown=openhubs_pay:openhubs_pay /workspace/openhubs-pay-payment/target/openhubs-pay-payment.jar /openhubs-pay-homes/service/app/openhubs-pay-payment.jar
COPY --chown=openhubs_pay:openhubs_pay conf/payment/application.yml /openhubs-pay-homes/service/app/application.yml
USER openhubs_pay
WORKDIR /openhubs-pay-homes/service/app
EXPOSE 9216
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=5 CMD curl --fail --silent http://localhost:9216/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "openhubs-pay-payment.jar"]
