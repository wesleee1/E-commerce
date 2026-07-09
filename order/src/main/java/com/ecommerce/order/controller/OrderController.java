package com.ecommerce.order.controller;

import com.ecommerce.order.model.Order;
import com.ecommerce.order.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/order")
@CrossOrigin(origins = "*")
public class OrderController {
    @Autowired
    private OrderService orderService;

    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createOrder(@RequestBody Order order) {
        try {
            Order createdOrder = orderService.createOrder(order);
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", createdOrder.getId());
            response.put("orderId", createdOrder.getId());
            response.put("customerId", createdOrder.getCustomerId());
            response.put("productId", createdOrder.getProductId());
            response.put("quantity", createdOrder.getQuantity());
            response.put("amount", createdOrder.getAmount());
            response.put("shippingMethod", createdOrder.getShippingMethod());
            response.put("status", createdOrder.getStatus());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping
    public ResponseEntity<Iterable<Order>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<Order> getOrderById(@PathVariable Long orderId) {
        return ResponseEntity.ok(orderService.getOrderById(orderId));
    }
}
