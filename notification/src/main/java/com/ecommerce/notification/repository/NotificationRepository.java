package com.ecommerce.notification.repository;

import com.ecommerce.notification.model.NotificationLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<NotificationLog, Long> {
	List<NotificationLog> findByOrderId(Long orderId);
}
