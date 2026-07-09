package com.ecommerce.notification.controller;

import com.ecommerce.notification.model.NotificationLog;
import com.ecommerce.notification.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notification")
@CrossOrigin(origins = "*")
public class NotificationController {
    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping("/send-email")
    public ResponseEntity<Map<String, Object>> sendEmail(@RequestBody Map<String, Object> emailData) {
        try {
            Long orderId = ((Number) emailData.get("orderId")).longValue();
            String email = (String) emailData.get("email");
            String customerName = emailData.get("customerName") == null ? null : emailData.get("customerName").toString();
            
            NotificationLog log = notificationService.sendOrderEmail(orderId, email, customerName);
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", log.getId());
            response.put("orderId", orderId);
            response.put("email", email);
            response.put("customerName", customerName);
            response.put("status", "sent");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/all")
    public ResponseEntity<List<NotificationLog>> getAllNotifications() {
        return ResponseEntity.ok(notificationService.getAllNotifications());
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<List<NotificationLog>> getOrderNotifications(@PathVariable Long orderId) {
        return ResponseEntity.ok(notificationService.getNotificationsByOrderId(orderId));
    }
}

