package com.ecommerce.payment.controller;

import com.ecommerce.payment.model.PaymentRecord;
import com.ecommerce.payment.service.PaymentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {
    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    public PaymentRecord pay(@RequestParam Long orderId, @RequestParam double amount, @RequestParam String paymentMethod) {
        return paymentService.processPayment(orderId, amount, paymentMethod);
    }

    @GetMapping
    public List<PaymentRecord> getPayments(@RequestParam(required = false) Long orderId) {
        if (orderId != null) {
            return paymentService.getPaymentsByOrderId(orderId);
        }
        return paymentService.getAllPayments();
    }
}
