package com.ecommerce.payment.repository;

import com.ecommerce.payment.model.PaymentRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<PaymentRecord, Long> {
	List<PaymentRecord> findByOrderId(Long orderId);
}
