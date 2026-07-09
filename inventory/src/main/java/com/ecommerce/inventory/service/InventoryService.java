package com.ecommerce.inventory.service;

import com.ecommerce.inventory.model.Product;
import com.ecommerce.inventory.repository.ProductRepository;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class InventoryService {
    private final ProductRepository productRepository;
    private final ObjectProvider<KafkaTemplate<String, String>> kafkaTemplateProvider;

    public InventoryService(ProductRepository productRepository, ObjectProvider<KafkaTemplate<String, String>> kafkaTemplateProvider) {
        this.productRepository = productRepository;
        this.kafkaTemplateProvider = kafkaTemplateProvider;
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Optional<Product> getProduct(Long id) {
        return productRepository.findById(id);
    }

    @Transactional
    public boolean reserveStock(Long productId, int quantity, Long orderId) {
        Optional<Product> optionalProduct = productRepository.findById(productId);
        if (optionalProduct.isEmpty()) {
            return false;
        }
        Product product = optionalProduct.get();
        if (product.getStock() < quantity) {
            return false;
        }
        product.setStock(product.getStock() - quantity);
        productRepository.save(product);
        
        // Calculate total amount for this product
        double itemAmount = product.getPrice() * quantity;
        String payload = String.format("{\"eventType\":\"STOCK_RESERVED\",\"orderId\":%d,\"productId\":%d,\"quantity\":%d,\"amount\":%.2f}", 
            orderId, productId, quantity, itemAmount);
        
        KafkaTemplate<String, String> kafkaTemplate = kafkaTemplateProvider.getIfAvailable();
        if (kafkaTemplate != null) {
            kafkaTemplate.send("ecommerce.events", payload);
        }
        return true;
    }

    @Transactional
    public Product createProduct(Product product) {
        return productRepository.save(product);
    }
}
