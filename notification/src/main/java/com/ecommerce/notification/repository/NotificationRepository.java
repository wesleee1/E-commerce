package com.ecommerce.notification.repository;

import com.ecommerce.notification.model.NotificationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<NotificationLog, Long> {
	List<NotificationLog> findByOrderId(Long orderId);
}
