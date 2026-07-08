package com.ecommerce.notification.controller;

import com.ecommerce.notification.model.NotificationLog;
import com.ecommerce.notification.service.NotificationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {
    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping
    public NotificationLog notify(@RequestParam Long orderId, @RequestParam String message) {
        return notificationService.sendNotification(orderId, message);
    }

    @GetMapping
    public List<NotificationLog> getNotifications(@RequestParam(required = false) Long orderId) {
        if (orderId != null) {
            return notificationService.getNotificationsByOrderId(orderId);
        }
        return notificationService.getAllNotifications();
    }
}
