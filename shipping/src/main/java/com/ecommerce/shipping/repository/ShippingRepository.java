package com.ecommerce.shipping.repository;

import com.ecommerce.shipping.model.ShippingRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShippingRepository extends JpaRepository<ShippingRecord, Long> {
	List<ShippingRecord> findByOrderId(Long orderId);
}
