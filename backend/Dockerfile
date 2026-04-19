FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /build
COPY pom.xml .
RUN mvn dependency:go-offline -B -q
COPY src ./src
RUN mvn package -DskipTests -B -q && echo "BUILD OK" && ls target/*.jar

FROM eclipse-temurin:21-jre-alpine AS runner
RUN addgroup -S lumay && adduser -S -D -H -G lumay lumay
WORKDIR /app
RUN mkdir -p /var/log/lumay && chown -R lumay:lumay /var/log/lumay /app
COPY --from=builder --chown=lumay:lumay /build/target/*.jar app.jar
USER lumay
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 \
    CMD wget -qO- http://localhost:8080/actuator/health | grep -q UP || exit 1
ENTRYPOINT ["java","-XX:+UseContainerSupport","-XX:MaxRAMPercentage=75.0","-XX:+UseG1GC","-Djava.security.egd=file:/dev/./urandom","-jar","app.jar"]
