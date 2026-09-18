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

# Forzamos opcionalmente el perfil prod o dejamos que la variable de entorno lo maneje
ENTRYPOINT ["java", "-Dspring.profiles.active=prod", "-jar", "app.jar"]
