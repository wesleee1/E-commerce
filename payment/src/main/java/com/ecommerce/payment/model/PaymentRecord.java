package com.ecommerce.payment.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class PaymentRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long orderId;
    private String paymentMethod;
    private String status;
    private double amount;

    public PaymentRecord() {}

    public PaymentRecord(Long orderId, String paymentMethod, String status, double amount) {
        this.orderId = orderId;
        this.paymentMethod = paymentMethod;
        this.status = status;
        this.amount = amount;
    }

    public Long getId() { return id; }
    public Long getOrderId() { return orderId; }
    public String getPaymentMethod() { return paymentMethod; }
    public String getStatus() { return status; }
    public double getAmount() { return amount; }
}
