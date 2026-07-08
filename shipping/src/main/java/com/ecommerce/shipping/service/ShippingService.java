package com.ecommerce.shipping.service;

import com.ecommerce.shipping.model.ShippingRecord;
import com.ecommerce.shipping.repository.ShippingRepository;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ShippingService {
    private final ShippingRepository shippingRepository;

    public ShippingService(ShippingRepository shippingRepository) {
        this.shippingRepository = shippingRepository;
    }

    public ShippingRecord shipOrder(Long orderId) {
        ShippingRecord record = new ShippingRecord(orderId, "SHIPPED", "Flipkart Express");
        return shippingRepository.save(record);
    }

    public List<ShippingRecord> getAllShipments() {
        return shippingRepository.findAll();
    }

    public List<ShippingRecord> getShipmentsByOrderId(Long orderId) {
        return shippingRepository.findByOrderId(orderId);
    }

    @KafkaListener(topics = "ecommerce.events", groupId = "shipping-group")
    public void handleEvent(String payload) {
        if (payload.contains("STOCK_RESERVED")) {
            shipOrder(1001L);
        }
    }
}
