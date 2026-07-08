package com.ecommerce.notification.service;

import com.ecommerce.notification.model.NotificationLog;
import com.ecommerce.notification.repository.NotificationRepository;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public NotificationLog sendNotification(Long orderId, String message) {
        NotificationLog log = new NotificationLog(orderId, "email", message);
        return notificationRepository.save(log);
    }

    public List<NotificationLog> getAllNotifications() {
        return notificationRepository.findAll();
    }

    public List<NotificationLog> getNotificationsByOrderId(Long orderId) {
        return notificationRepository.findByOrderId(orderId);
    }

    @KafkaListener(topics = "ecommerce.events", groupId = "notification-group")
    public void handleEvent(String payload) {
        if (payload.contains("STOCK_RESERVED")) {
            sendNotification(1001L, "Your order is confirmed and being processed.");
        }
    }
}
