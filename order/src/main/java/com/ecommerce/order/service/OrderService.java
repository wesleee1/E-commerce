package com.ecommerce.order.service;

import com.ecommerce.order.model.Order;
import com.ecommerce.order.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
public class OrderService {
    @Autowired
    private OrderRepository orderRepository;

    @Autowired(required = false)
    private KafkaTemplate<String, String> kafkaTemplate;

    @Transactional
    public Order createOrder(Order order) {
        // Validate order data
        if (order.getCustomerId() == null || order.getProductId() == null || 
            order.getQuantity() == null || order.getAmount() == null) {
            throw new IllegalArgumentException("Order must contain customerId, productId, quantity, and amount");
        }

        // Save order to database
        Order savedOrder = orderRepository.save(order);

        // Publish OrderCreated event to Kafka
        publishOrderEvent(savedOrder);

        return savedOrder;
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

    public Iterable<Order> getAllOrders() {
        return orderRepository.findAll();
    }
}
