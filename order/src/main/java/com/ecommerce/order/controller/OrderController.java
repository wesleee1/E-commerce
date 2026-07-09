package com.ecommerce.order.controller;

import com.ecommerce.order.model.Order;
import com.ecommerce.order.model.OrderItem;
import com.ecommerce.order.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/order")
@CrossOrigin(origins = "*")
public class OrderController {
    @Autowired
    private OrderService orderService;

    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createOrder(@RequestBody Map<String, Object> requestBody) {
        try {
            Order order = mapToOrder(requestBody);
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
            response.put("trackingNumber", createdOrder.getTrackingNumber());
            response.put("estimatedDelivery", createdOrder.getEstimatedDelivery());
            response.put("createdAt", createdOrder.getCreatedAt());
            response.put("subtotalAmount", createdOrder.getSubtotalAmount());
            response.put("shippingCost", createdOrder.getShippingCost());
            response.put("taxAmount", createdOrder.getTaxAmount());
            response.put("items", createdOrder.getItems());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    private Order mapToOrder(Map<String, Object> requestBody) {
        Order order = new Order();
        order.setCustomerId(toLong(requestBody.get("customerId")));
        order.setProductId(toLong(requestBody.get("productId")));
        order.setQuantity(toInteger(requestBody.get("quantity")));
        order.setAmount(toDouble(requestBody.get("amount")));
        order.setShippingMethod(toStringValue(requestBody.get("shippingMethod")));
        order.setCustomerName(toStringValue(requestBody.get("customerName")));
        order.setCustomerEmail(toStringValue(requestBody.get("customerEmail")));
        order.setPhone(toStringValue(requestBody.get("phone")));
        order.setAddressLine(toStringValue(requestBody.get("addressLine")));
        order.setCity(toStringValue(requestBody.get("city")));
        order.setZipCode(toStringValue(requestBody.get("zipCode")));
        order.setPromoCode(toStringValue(requestBody.get("promoCode")));
        order.setOrderNote(toStringValue(requestBody.get("orderNote")));
        order.setSubtotalAmount(toDouble(requestBody.get("subtotalAmount")));
        order.setShippingCost(toDouble(requestBody.get("shippingCost")));
        order.setTaxAmount(toDouble(requestBody.get("taxAmount")));

        Object itemsObject = requestBody.get("items");
        if (itemsObject instanceof List<?> itemsList) {
            List<OrderItem> items = new ArrayList<>();
            for (Object itemObject : itemsList) {
                if (itemObject instanceof Map<?, ?> itemMap) {
                    OrderItem item = new OrderItem();
                    item.setProductId(toLong(itemMap.get("productId")));
                    item.setProductName(toStringValue(itemMap.get("productName")));
                    item.setQuantity(toInteger(itemMap.get("quantity")));
                    item.setUnitPrice(toDouble(itemMap.get("unitPrice")));
                    item.setLineTotal(toDouble(itemMap.get("lineTotal")));
                    items.add(item);
                }
            }
            order.setItems(items);
        }

        return order;
    }

    private Long toLong(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(value.toString());
    }

    private Integer toInteger(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        return Integer.parseInt(value.toString());
    }

    private Double toDouble(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        return Double.parseDouble(value.toString());
    }

    private String toStringValue(Object value) {
        return value == null ? null : value.toString();
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
