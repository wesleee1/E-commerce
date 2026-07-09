package com.ecommerce.notification.service;

import com.ecommerce.notification.model.NotificationLog;
import com.ecommerce.notification.repository.NotificationRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
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
        try {
            JsonNode eventData = objectMapper.readTree(payload);
            String eventType = eventData.get("eventType").asText();
            
            if ("STOCK_RESERVED".equals(eventType)) {
                Long orderId = eventData.get("orderId").asLong();
                int quantity = eventData.get("quantity").asInt();
                
                String message = String.format("Order %d confirmed for %d items. Processing...", orderId, quantity);
                sendNotification(orderId, message);
            }
        } catch (Exception e) {
            System.err.println("Error processing notification event: " + e.getMessage());
        }
    }
}

