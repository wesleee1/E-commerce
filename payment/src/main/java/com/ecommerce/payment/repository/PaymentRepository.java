package com.ecommerce.payment.repository;

import com.ecommerce.payment.model.PaymentRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<PaymentRecord, Long> {
	List<PaymentRecord> findByOrderId(Long orderId);
}
