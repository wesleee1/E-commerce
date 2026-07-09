package com.ecommerce.inventory.repository;

import com.ecommerce.inventory.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
}
