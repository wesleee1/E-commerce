package com.ecommerce.inventory.service;

import com.ecommerce.inventory.model.Product;
import com.ecommerce.inventory.repository.ProductRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class InventoryService {
    private final ProductRepository productRepository;
    private final ObjectProvider<KafkaTemplate<String, String>> kafkaTemplateProvider;
    private final ObjectMapper objectMapper = new ObjectMapper();

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
        return reserveSingleProduct(productId, quantity);
    }

    @Transactional
    public boolean reserveOrderStock(Long orderId, List<Map<String, Object>> items, Double amount, String shippingMethod,
                                     String customerEmail, String customerName) {
        if (orderId == null || amount == null || items == null || items.isEmpty()) {
            return false;
        }

        List<ReservedProduct> reservedProducts = new ArrayList<>();
        int totalQuantity = 0;

        for (Map<String, Object> item : items) {
            Long productId = toLong(item.get("productId"));
            Integer quantity = toInteger(item.get("quantity"));
            if (productId == null || quantity == null || quantity <= 0) {
                return false;
            }

            Optional<Product> optionalProduct = productRepository.findById(productId);
            if (optionalProduct.isEmpty()) {
                return false;
            }

            Product product = optionalProduct.get();
            if (product.getStock() < quantity) {
                return false;
            }

            reservedProducts.add(new ReservedProduct(product, quantity));
            totalQuantity += quantity;
        }

        for (ReservedProduct reservation : reservedProducts) {
            Product product = reservation.product();
            product.setStock(product.getStock() - reservation.quantity());
            productRepository.save(product);
        }

        publishStockReservedEvent(orderId, totalQuantity, amount, shippingMethod, customerEmail, customerName);
        return true;
    }

    private boolean reserveSingleProduct(Long productId, int quantity) {
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
        return true;
    }

    @Transactional
    public Product createProduct(Product product) {
        return productRepository.save(product);
    }

    private void publishStockReservedEvent(Long orderId, int totalQuantity, Double amount, String shippingMethod,
                                           String customerEmail, String customerName) {
        KafkaTemplate<String, String> kafkaTemplate = kafkaTemplateProvider.getIfAvailable();
        if (kafkaTemplate == null) {
            return;
        }

        Map<String, Object> eventData = new HashMap<>();
        eventData.put("eventType", "STOCK_RESERVED");
        eventData.put("orderId", orderId);
        eventData.put("quantity", totalQuantity);
        eventData.put("amount", amount);
        eventData.put("shippingMethod", shippingMethod == null || shippingMethod.isBlank() ? "standard" : shippingMethod);
        if (customerEmail != null && !customerEmail.isBlank()) {
            eventData.put("customerEmail", customerEmail);
        }
        if (customerName != null && !customerName.isBlank()) {
            eventData.put("customerName", customerName);
        }

        try {
            kafkaTemplate.send("ecommerce.events", objectMapper.writeValueAsString(eventData));
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Failed to publish stock reservation event", ex);
        }
    }

    private Long toLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        if (value == null) {
            return null;
        }
        try {
            return Long.parseLong(value.toString());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private Integer toInteger(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value == null) {
            return null;
        }
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private record ReservedProduct(Product product, int quantity) {
    }
}
