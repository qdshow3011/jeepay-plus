FROM eclipse-temurin:17-jre-alpine

ENV ACTIVEMQ_VERSION 5.16.7
ENV ACTIVEMQ apache-activemq-${ACTIVEMQ_VERSION}
ENV ACTIVEMQ_HOME /opt/activemq

RUN apk add --no-cache curl netcat-openbsd tar gzip && \
    mkdir -p /opt && \
    (curl -sSL --retry 5 --retry-delay 5 --connect-timeout 30 -o /tmp/activemq.tar.gz https://archive.apache.org/dist/activemq/${ACTIVEMQ_VERSION}/${ACTIVEMQ}-bin.tar.gz \
     || curl -sSL --retry 3 --retry-delay 5 --connect-timeout 30 -o /tmp/activemq.tar.gz https://dlcdn.apache.org/activemq/${ACTIVEMQ_VERSION}/${ACTIVEMQ}-bin.tar.gz) && \
    tar -xvz -C /opt -f /tmp/activemq.tar.gz && \
    rm -f /tmp/activemq.tar.gz && \
    ln -s /opt/${ACTIVEMQ} ${ACTIVEMQ_HOME} && \
    addgroup -S activemq && \
    adduser -S -H -G activemq -h ${ACTIVEMQ_HOME} activemq && \
    chown -R activemq:activemq /opt/${ACTIVEMQ} && \
    chown -h activemq:activemq ${ACTIVEMQ_HOME} && \
    apk del tar gzip

COPY ./activemq.xml ${ACTIVEMQ_HOME}/conf/activemq.xml

EXPOSE 1883 5672 8161 61613 61614 61616

USER activemq
WORKDIR ${ACTIVEMQ_HOME}

CMD ["/bin/sh", "-c", "printf 'activemq.username=%s\nactivemq.password=%s\n' \"$ACTIVEMQ_USER\" \"$ACTIVEMQ_PASSWORD\" > conf/credentials.properties && bin/activemq console"]