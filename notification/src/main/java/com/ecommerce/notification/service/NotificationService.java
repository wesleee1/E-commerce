package com.ecommerce.notification.service;

import com.ecommerce.notification.model.NotificationLog;
import com.ecommerce.notification.repository.NotificationRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${notification.email.from:notifications@ecommerce.local}")
    private String fromAddress;

    public NotificationService(NotificationRepository notificationRepository, ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.notificationRepository = notificationRepository;
        this.mailSenderProvider = mailSenderProvider;
    }

    @Transactional
    public NotificationLog sendNotification(Long orderId, String message) {
        NotificationLog log = new NotificationLog(orderId, "email", message);
        return notificationRepository.save(log);
    }

    @Transactional
    public NotificationLog sendOrderEmail(Long orderId, String recipientEmail, String customerName) {
        String subject = String.format("Your order #%d has been placed", orderId);
        String greetingName = (customerName == null || customerName.isBlank()) ? "Customer" : customerName;
        String body = String.format(
            "Hello %s,%n%nYour order #%d has been placed successfully.%nWe’ll send another update when it ships.%n%nThanks,%nEcommercePro",
            greetingName,
            orderId
        );

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender != null) {
            SimpleMailMessage email = new SimpleMailMessage();
            email.setFrom(fromAddress);
            email.setTo(recipientEmail);
            email.setSubject(subject);
            email.setText(body);
            mailSender.send(email);
        }

        return sendNotification(orderId, String.format("Order %d confirmation sent to %s", orderId, recipientEmail));
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

