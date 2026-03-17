FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml ./
RUN mvn dependency:go-offline -q
COPY src/ ./src/
RUN mvn package -DskipTests -q

FROM eclipse-temurin:21-jre-alpine AS production
WORKDIR /app
RUN addgroup -g 1001 -S appgroup && adduser -u 1001 -S appuser -G appgroup
COPY --from=builder /app/target/*.jar app.jar
USER appuser
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --retries=5 \
  CMD wget -qO- http://localhost:8080/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
