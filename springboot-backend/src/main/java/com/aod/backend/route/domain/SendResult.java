package com.aod.backend.route.domain;

import com.aod.backend.route.application.dto.RequestInfo;

public interface SendResult {
    void sendToAPIGW(RequestInfo requestInfo);
}
