package com.aod.backend.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.EnvironmentVariableCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.apigatewaymanagementapi.ApiGatewayManagementApiClient;

import java.net.URI;

@Slf4j
@Configuration
public class AmazonSDKConfig {

    @Value("${API_ENDPOINT}")
    private String apiRefValue;

    @Bean
    public ApiGatewayManagementApiClient settingAPIGWConnection(){
        log.info(apiRefValue+"/dev");
        return ApiGatewayManagementApiClient.builder()
                .region(Region.AP_NORTHEAST_2)
                .endpointOverride(URI.create(apiRefValue+"/dev"))
                .build();
    }
}
