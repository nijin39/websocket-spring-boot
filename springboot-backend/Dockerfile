FROM eclipse-temurin:17-jdk-alpine

WORKDIR /usr/src/app

ARG JAR_PATH=./build/libs

COPY ${JAR_PATH}/springboot-backend-0.0.1-SNAPSHOT.jar ${JAR_PATH}/springboot-backend-0.0.1-SNAPSHOT.jar

CMD ["java","-jar","./build/libs/springboot-backend-0.0.1-SNAPSHOT.jar"]