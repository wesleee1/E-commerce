package com.ecommerce.order.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    private Long customerId;

    @NotNull
    private Long productId;

    @NotNull
    private Integer quantity;

    @NotNull
    private Double amount;

    @NotNull
    private String shippingMethod;

    @Column(columnDefinition = "VARCHAR(50) DEFAULT 'PENDING'")
    private String status = "PENDING";

    public Order() {}

    public Order(Long customerId, Long productId, Integer quantity, Double amount, String shippingMethod) {
        this.customerId = customerId;
        this.productId = productId;
        this.quantity = quantity;
        this.amount = amount;
        this.shippingMethod = shippingMethod;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getShippingMethod() { return shippingMethod; }
    public void setShippingMethod(String shippingMethod) { this.shippingMethod = shippingMethod; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
