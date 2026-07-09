package com.ecommerce.inventory.controller;

import com.ecommerce.inventory.model.Product;
import com.ecommerce.inventory.service.InventoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "*")
public class InventoryController {
    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping("/products")
    public List<Product> getProducts() {
        return inventoryService.getAllProducts();
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<Product> getProduct(@PathVariable Long id) {
        return inventoryService.getProduct(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/products")
    public Product createProduct(@RequestBody Product product) {
        return inventoryService.createProduct(product);
    }

    @PostMapping("/reserve")
    public ResponseEntity<String> reserveStock(@RequestParam Long productId, @RequestParam int quantity, @RequestParam Long orderId) {
        boolean reserved = inventoryService.reserveStock(productId, quantity, orderId);
        if (reserved) {
            return ResponseEntity.ok("reserved");
        }
        return ResponseEntity.badRequest().body("insufficient stock");
    }

    @PostMapping("/reserve-order")
    public ResponseEntity<Map<String, Object>> reserveOrderStock(@RequestBody Map<String, Object> orderData) {
        Long orderId = toLong(orderData.get("orderId"));
        Double amount = toDouble(orderData.get("amount"));
        String shippingMethod = toStringValue(orderData.get("shippingMethod"));
        String customerEmail = toStringValue(orderData.get("customerEmail"));
        String customerName = toStringValue(orderData.get("customerName"));
        List<Map<String, Object>> items = extractItems(orderData.get("items"));

        if (orderId == null || amount == null || items.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "orderId, amount, and items are required"));
        }

        boolean reserved = inventoryService.reserveOrderStock(orderId, items, amount, shippingMethod, customerEmail, customerName);
        if (reserved) {
            return ResponseEntity.ok(Map.of("orderId", orderId, "status", "reserved"));
        }
        return ResponseEntity.badRequest().body(Map.of("error", "insufficient stock for one or more items"));
    }

    private List<Map<String, Object>> extractItems(Object value) {
        if (!(value instanceof List<?> rawItems)) {
            return List.of();
        }

        List<Map<String, Object>> items = new ArrayList<>();
        for (Object rawItem : rawItems) {
            if (rawItem instanceof Map<?, ?> rawMap) {
                Map<String, Object> item = new HashMap<>();
                rawMap.forEach((key, itemValue) -> item.put(String.valueOf(key), itemValue));
                items.add(item);
            }
        }
        return items;
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

    private Double toDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        if (value == null) {
            return null;
        }
        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private String toStringValue(Object value) {
        return value == null ? null : value.toString();
    }
}
