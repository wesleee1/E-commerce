package com.ecommerce.notification.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class NotificationLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long orderId;
    private String channel;
    private String message;

    public NotificationLog() {}

    public NotificationLog(Long orderId, String channel, String message) {
        this.orderId = orderId;
        this.channel = channel;
        this.message = message;
    }

    public Long getId() { return id; }
    public Long getOrderId() { return orderId; }
    public String getChannel() { return channel; }
    public String getMessage() { return message; }
}
