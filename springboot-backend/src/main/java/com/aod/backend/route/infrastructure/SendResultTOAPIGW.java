package com.aod.backend.route.infrastructure;

import com.aod.backend.route.application.dto.RequestInfo;
import com.aod.backend.route.domain.SendResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.apigatewaymanagementapi.ApiGatewayManagementApiClient;
import software.amazon.awssdk.services.apigatewaymanagementapi.model.GoneException;
import software.amazon.awssdk.services.apigatewaymanagementapi.model.PostToConnectionRequest;

import java.nio.ByteBuffer;

@Slf4j
@Component
public class SendResultTOAPIGW implements SendResult {

    @Autowired
    ApiGatewayManagementApiClient apiGatewayManagementApiClient;

    @Override
    public void sendToAPIGW(RequestInfo requestInfo) {
        try {
            try {
                Thread.sleep( requestInfo.getBookingParams().getDelay() );
            } catch (InterruptedException e) {
                e.printStackTrace();
            }

            SdkBytes payload = SdkBytes.fromUtf8String(
                    "{ \"message\": " +
                            "{\n" +
                            " \"name\": \"" + "jngkim" + "\",\n" +
                            " \"phone\": \"" + "010-8652-4489" + "\",\n" +
                            " \"message\": \"" + "Hello" + "\"\n" +
                            "}"
                            + "}" );

            PostToConnectionRequest request = PostToConnectionRequest.builder()
                    .connectionId(requestInfo.getConnectionId())
                    .data(payload)
                    .build();
            apiGatewayManagementApiClient.postToConnection(request);
        } catch (GoneException goneException){
            log.error("Connection already was closed");
        }
    }
}
