package com.ecommerce.shipping.controller;

import com.ecommerce.shipping.model.ShippingRecord;
import com.ecommerce.shipping.service.ShippingService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shipping")
@CrossOrigin(origins = "*")
public class ShippingController {
    private final ShippingService shippingService;

    public ShippingController(ShippingService shippingService) {
        this.shippingService = shippingService;
    }

    @PostMapping
    public ShippingRecord ship(@RequestParam Long orderId) {
        return shippingService.shipOrder(orderId);
    }

    @GetMapping
    public List<ShippingRecord> getShipments(@RequestParam(required = false) Long orderId) {
        if (orderId != null) {
            return shippingService.getShipmentsByOrderId(orderId);
        }
        return shippingService.getAllShipments();
    }
}
