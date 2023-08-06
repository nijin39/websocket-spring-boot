package com.aod.backend.route.ui;

import com.aod.backend.route.application.dto.RequestInfo;
import com.aod.backend.route.domain.SendResult;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpRequest;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.InputStream;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

@Slf4j
@RestController
public class RouteController {

    @Autowired
    SendResult sendResult;

    @GetMapping("/health")
    public String healthCheck(){
        return "HI";
    }


    @GetMapping("/health1")
    public String healthCheck1(){
        return "HI11";
    }


    @GetMapping("/ws-delay")
    public String handleWSDelay(HttpServletRequest request){
        log.info(Collections.list(request.getHeaderNames()).toString());
        log.info(request.getHeader("connectionid"));
        sendResult.sendToAPIGW(RequestInfo.builder()
                .connectionId(request.getHeader("connectionid"))
                .bookingParams(new RequestInfo.BookingParams("create", "reservation", 1000))
                .build());
        return Collections.list(request.getHeaderNames()).toString();
    }
}
