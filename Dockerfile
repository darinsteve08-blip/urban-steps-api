# Etapa de construcción (Build)
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Compilamos el proyecto omitiendo pruebas para agilizar
RUN mvn clean package -DskipTests

# Etapa de ejecución (Run)
FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app
# Copiamos el .jar generado
COPY --from=build /app/target/*.jar app.jar

# Exponemos el puerto que usará la aplicación
EXPOSE 8080
ENV PORT=8080

# Forzamos perfil prod, vinculación a 0.0.0.0 y puerto dinámico para Render
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8080} -Dserver.address=0.0.0.0 -Dspring.profiles.active=prod -jar app.jar"]
