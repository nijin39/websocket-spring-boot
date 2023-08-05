package com.aod.backend.route.ui;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RouteController {

    @GetMapping("/health")
    public String healthCheck(){
        return "HI";
    }
}
