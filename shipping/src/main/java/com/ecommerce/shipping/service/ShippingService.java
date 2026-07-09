package com.ecommerce.shipping.service;

import com.ecommerce.shipping.model.ShippingRecord;
import com.ecommerce.shipping.repository.ShippingRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ShippingService {
    private final ShippingRepository shippingRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ShippingService(ShippingRepository shippingRepository) {
        this.shippingRepository = shippingRepository;
    }

    @Transactional
    public ShippingRecord shipOrder(Long orderId) {
        return shipOrder(orderId, "STANDARD");
    }

    @Transactional
    public ShippingRecord shipOrder(Long orderId, String shippingMethod) {
        String carrier = mapCarrier(shippingMethod);
        ShippingRecord record = new ShippingRecord(orderId, "SHIPPED", carrier);
        return shippingRepository.save(record);
    }

    public List<ShippingRecord> getAllShipments() {
        return shippingRepository.findAll();
    }

    public List<ShippingRecord> getShipmentsByOrderId(Long orderId) {
        return shippingRepository.findByOrderId(orderId);
    }

    private String mapCarrier(String shippingMethod) {
        return switch (shippingMethod) {
            case "express" -> "FedEx Express";
            case "overnight" -> "DHL Overnight";
            default -> "Standard Courier";
        };
    }

    @KafkaListener(topics = "ecommerce.events", groupId = "shipping-group")
    public void handleEvent(String payload) {
        try {
            JsonNode eventData = objectMapper.readTree(payload);
            String eventType = eventData.get("eventType").asText();
            
            if ("STOCK_RESERVED".equals(eventType)) {
                Long orderId = eventData.get("orderId").asLong();
                shipOrder(orderId, "STANDARD");
            }
        } catch (Exception e) {
            System.err.println("Error processing shipping event: " + e.getMessage());
        }
    }
}
