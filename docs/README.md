# E-commerce Microservices Platform

This workspace now contains a Spring Boot-based e-commerce platform with four microservices:

- Inventory service: product catalog and stock reservation
- Payment service: order payment tracking
- Shipping service: shipping lifecycle
- Notification service: order notifications

## Run locally

1. Start PostgreSQL and create the databases:
   - ecommerce_inventory
   - ecommerce_payment
   - ecommerce_shipping
   - ecommerce_notification

2. Start Kafka on localhost:9092.

3. Start each service:
   - inventory: http://localhost:18081
   - payment: http://localhost:8082
   - shipping: http://localhost:8083
   - notification: http://localhost:8084

4. Open frontend/index.html in a browser.

## Notes

The UI is a Flipkart-inspired storefront with product cards, search, and a demo checkout flow.
