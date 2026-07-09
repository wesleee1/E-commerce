package com.ecommerce.shipping.controller;

import com.ecommerce.shipping.model.ShippingRecord;
import com.ecommerce.shipping.service.ShippingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shipping")
@CrossOrigin(origins = "*")
public class ShippingController {
    private final ShippingService shippingService;

    public ShippingController(ShippingService shippingService) {
        this.shippingService = shippingService;
    }

    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createShipment(@RequestBody Map<String, Object> shipmentData) {
        try {
            Long orderId = ((Number) shipmentData.get("orderId")).longValue();
            String shippingMethod = (String) shipmentData.get("shippingMethod");
            
            ShippingRecord record = shippingService.shipOrder(orderId, shippingMethod);
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", record.getId());
            response.put("orderId", orderId);
            response.put("status", "SHIPPED");
            response.put("carrier", record.getCarrier());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<ShippingRecord>> getShipments(@RequestParam(required = false) Long orderId) {
        if (orderId != null) {
            return ResponseEntity.ok(shippingService.getShipmentsByOrderId(orderId));
        }
        return ResponseEntity.ok(shippingService.getAllShipments());
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<List<ShippingRecord>> getShipmentsByOrderId(@PathVariable Long orderId) {
        return ResponseEntity.ok(shippingService.getShipmentsByOrderId(orderId));
    }
}

