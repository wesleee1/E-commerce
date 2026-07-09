package com.ecommerce.payment.controller;

import com.ecommerce.payment.model.PaymentRecord;
import com.ecommerce.payment.service.PaymentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "*")
public class PaymentController {
    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/process")
    public ResponseEntity<Map<String, Object>> processPayment(@RequestBody Map<String, Object> orderData) {
        try {
            Long orderId = System.currentTimeMillis();
            double totalAmount = ((Number) orderData.get("totalAmount")).doubleValue();
            String shippingMethod = (String) orderData.get("shippingMethod");
            
            PaymentRecord record = paymentService.processPayment(orderId, totalAmount, "CARD");
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", record.getId());
            response.put("orderId", orderId);
            response.put("status", "PAID");
            response.put("amount", totalAmount);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/orders")
    public ResponseEntity<List<PaymentRecord>> getOrders() {
        return ResponseEntity.ok(paymentService.getAllPayments());
    }

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<List<PaymentRecord>> getOrderPayments(@PathVariable Long orderId) {
        return ResponseEntity.ok(paymentService.getPaymentsByOrderId(orderId));
    }
}

