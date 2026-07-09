package com.ecommerce.order.service;

import com.ecommerce.order.model.Order;
import com.ecommerce.order.model.OrderItem;
import com.ecommerce.order.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class OrderService {
    @Autowired
    private OrderRepository orderRepository;

    @Autowired(required = false)
    private KafkaTemplate<String, String> kafkaTemplate;

    @Transactional
    public Order createOrder(Order order) {
        validateOrder(order);
        normalizeOrder(order);

        Order savedOrder = orderRepository.save(order);
        publishOrderEvent(savedOrder);
        return savedOrder;
    }

    private void validateOrder(Order order) {
        if (order.getCustomerId() == null || order.getAmount() == null || order.getShippingMethod() == null) {
            throw new IllegalArgumentException("Order must contain customerId, amount, and shippingMethod");
        }

        boolean hasItems = order.getItems() != null && !order.getItems().isEmpty();
        if (!hasItems && (order.getProductId() == null || order.getQuantity() == null)) {
            throw new IllegalArgumentException("Order must contain either items or legacy productId and quantity fields");
        }
    }

    private void normalizeOrder(Order order) {
        List<OrderItem> normalizedItems = new ArrayList<>();

        if (order.getItems() != null && !order.getItems().isEmpty()) {
            for (OrderItem item : order.getItems()) {
                if (item.getProductId() == null || item.getQuantity() == null || item.getUnitPrice() == null) {
                    throw new IllegalArgumentException("Each order item must contain productId, quantity, and unitPrice");
                }

                item.setProductName(item.getProductName() == null || item.getProductName().isBlank()
                        ? "Product #" + item.getProductId()
                        : item.getProductName());
                item.setLineTotal(item.getUnitPrice() * item.getQuantity());
                normalizedItems.add(item);
            }
        } else {
            OrderItem fallbackItem = new OrderItem();
            fallbackItem.setProductId(order.getProductId());
            fallbackItem.setProductName("Product #" + order.getProductId());
            fallbackItem.setQuantity(order.getQuantity());
            fallbackItem.setUnitPrice(order.getAmount() / Math.max(order.getQuantity(), 1));
            fallbackItem.setLineTotal(order.getAmount());
            normalizedItems.add(fallbackItem);
        }

        order.setItems(normalizedItems);

        OrderItem heroItem = normalizedItems.get(0);
        int totalQuantity = normalizedItems.stream().mapToInt(OrderItem::getQuantity).sum();
        double subtotal = normalizedItems.stream().mapToDouble(OrderItem::getLineTotal).sum();

        order.setProductId(heroItem.getProductId());
        order.setQuantity(totalQuantity);
        if (order.getSubtotalAmount() == null) {
            order.setSubtotalAmount(subtotal);
        }
        if (order.getShippingCost() == null) {
            order.setShippingCost(Math.max(0.0, order.getAmount() - order.getSubtotalAmount() - (order.getTaxAmount() == null ? 0.0 : order.getTaxAmount())));
        }
        if (order.getTaxAmount() == null) {
            order.setTaxAmount(Math.max(0.0, order.getAmount() - order.getSubtotalAmount() - order.getShippingCost()));
        }
        if (order.getTrackingNumber() == null || order.getTrackingNumber().isBlank()) {
            order.setTrackingNumber("ECP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        if (order.getEstimatedDelivery() == null || order.getEstimatedDelivery().isBlank()) {
            order.setEstimatedDelivery(estimateDelivery(order.getShippingMethod()));
        }
        if (order.getStatus() == null || order.getStatus().isBlank()) {
            order.setStatus("PENDING");
        }
    }

    private String estimateDelivery(String shippingMethod) {
        return switch (shippingMethod == null ? "standard" : shippingMethod.toLowerCase()) {
            case "overnight" -> "Tomorrow by 9 PM";
            case "express" -> "2-3 business days";
            default -> "5-7 business days";
        };
    }

    private void publishOrderEvent(Order order) {
        if (kafkaTemplate != null) {
            Map<String, Object> eventData = new HashMap<>();
            eventData.put("eventType", "ORDER_CREATED");
            eventData.put("orderId", order.getId());
            eventData.put("customerId", order.getCustomerId());
            eventData.put("productId", order.getProductId());
            eventData.put("quantity", order.getQuantity());
            eventData.put("amount", order.getAmount());
            eventData.put("shippingMethod", order.getShippingMethod());
            eventData.put("itemCount", order.getItems().size());
            eventData.put("trackingNumber", order.getTrackingNumber());
            eventData.put("createdAt", order.getCreatedAt() == null ? null : order.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

            String payload = convertMapToJson(eventData);
            kafkaTemplate.send("ecommerce.events", payload);
        }
    }

    private String convertMapToJson(Map<String, Object> map) {
        StringBuilder json = new StringBuilder("{");
        map.forEach((key, value) -> {
            if (json.length() > 1) json.append(",");
            json.append("\"").append(key).append("\":");
            if (value instanceof String) {
                json.append("\"").append(value).append("\"");
            } else {
                json.append(value);
            }
        });
        json.append("}");
        return json.toString();
    }

    public Order getOrderById(Long id) {
        return orderRepository.findById(id).orElseThrow(() -> 
            new RuntimeException("Order not found with id: " + id));
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc();
    }
}
