package com.ecommerce.payment.service;

import com.ecommerce.payment.model.PaymentRecord;
import com.ecommerce.payment.repository.PaymentRepository;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PaymentService {
    private final PaymentRepository paymentRepository;

    public PaymentService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

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
        if (payload.contains("STOCK_RESERVED")) {
            processPayment(1001L, 999.0, "CARD");
        }
    }
}
