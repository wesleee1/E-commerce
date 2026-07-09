package com.ecommerce.shipping.repository;

import com.ecommerce.shipping.model.ShippingRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShippingRepository extends JpaRepository<ShippingRecord, Long> {
	List<ShippingRecord> findByOrderId(Long orderId);
}
