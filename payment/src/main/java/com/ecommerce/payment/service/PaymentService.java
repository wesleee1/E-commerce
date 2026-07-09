package com.ecommerce.payment.service;

import com.ecommerce.payment.model.PaymentRecord;
import com.ecommerce.payment.repository.PaymentRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PaymentService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    @Transactional
    public PaymentRecord processPayment(Long orderId, double amount, String paymentMethod) {
        PaymentRecord record = new PaymentRecord(orderId, paymentMethod, "PAID", amount);
        return paymentRepository.save(record);
    }

    public List<PaymentRecord> getAllPayments() {
        return paymentRepository.findAll();
    }

    public List<PaymentRecord> getPaymentsByOrderId(Long orderId) {
        return paymentRepository.findByOrderId(orderId);
    }

    @KafkaListener(topics = "ecommerce.events", groupId = "payment-group")
    public void handleEvent(String payload) {
        try {
            JsonNode eventData = objectMapper.readTree(payload);
            String eventType = eventData.get("eventType").asText();
            
            if ("STOCK_RESERVED".equals(eventType)) {
                Long orderId = eventData.get("orderId").asLong();
                double amount = eventData.get("amount").asDouble(999.0);
                
                processPayment(orderId, amount, "AUTO");
            }
        } catch (Exception e) {
            System.err.println("Error processing payment event: " + e.getMessage());
        }
    }
}

