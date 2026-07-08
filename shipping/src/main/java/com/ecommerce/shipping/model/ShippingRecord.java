package com.ecommerce.shipping.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class ShippingRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long orderId;
    private String status;
    private String carrier;

    public ShippingRecord() {}

    public ShippingRecord(Long orderId, String status, String carrier) {
        this.orderId = orderId;
        this.status = status;
        this.carrier = carrier;
    }

    public Long getId() { return id; }
    public Long getOrderId() { return orderId; }
    public String getStatus() { return status; }
    public String getCarrier() { return carrier; }
}
