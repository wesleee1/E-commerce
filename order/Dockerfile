# ---------- Build Stage ----------
FROM maven:3.9.11-eclipse-temurin-21 AS build

WORKDIR /workspace

# Copy only the Maven configuration first to leverage Docker layer caching
COPY pom.xml .

# Download dependencies
RUN mvn dependency:go-offline

# Copy the application source
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests

# ---------- Runtime Stage ----------
FROM eclipse-temurin:21-jre

WORKDIR /app

# Copy the JAR from the build stage
COPY --from=build /workspace/target/*.jar app.jar

# Document the application's listening port
EXPOSE 8080

# Start the application
ENTRYPOINT ["java", "-jar", "app.jar"]