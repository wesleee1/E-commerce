package com.ecommerce.inventory.controller;

import com.ecommerce.inventory.model.Product;
import com.ecommerce.inventory.service.InventoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
}
