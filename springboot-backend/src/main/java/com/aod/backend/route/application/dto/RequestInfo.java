package com.aod.backend.route.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class RequestInfo {
    private String connectionId;
    private BookingParams bookingParams;

    @Data
    @AllArgsConstructor
    public static class BookingParams {
        private String action;
        private String message;
        private Integer delay;
    }
}
