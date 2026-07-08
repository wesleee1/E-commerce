# EcommercePro Frontend

A modern, fully-featured e-commerce frontend built with HTML5, CSS3, and JavaScript. Integrates with Spring Boot microservices for inventory, payment, shipping, and notifications.

## Features

### 🛍️ Customer Features
- **Product Catalog** - Browse products with search, filter, and sort capabilities
- **Shopping Cart** - Add/remove items, adjust quantities, persistent storage
- **Checkout** - Complete checkout flow with shipping and payment options
- **Order Management** - View order history and track orders
- **Notifications** - Email notifications and notification preferences
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

### 📦 Admin Features
- **Inventory Management** - View, add, edit, and delete products
- **Stock Tracking** - Monitor stock levels with low-stock and out-of-stock alerts
- **Analytics Dashboard** - View inventory statistics and product value
- **Category Management** - Organize products by category

## Architecture

The frontend communicates with four microservices:

```
┌─────────────────┐
│   Frontend      │
│  (HTML/CSS/JS)  │
└────────┬────────┘
         │
    ┌────┴────┬─────────┬─────────┐
    │          │         │         │
┌───▼───┐  ┌──▼──┐  ┌───▼───┐ ┌──▼────┐
│Inv.   │  │Pay  │  │Shipping │Notif. │
│:8081  │  │:8082│  │  :8083  │ :8084 │
└───────┘  └─────┘  └────────┘ └───────┘
```

## API Endpoints

| Service | Endpoints | Purpose |
|---------|-----------|---------|
| **Inventory** (8081) | `/api/inventory/products`, `/api/inventory/reserve` | Product catalog, stock reservation |
| **Payment** (8082) | `/api/payment/process`, `/api/payment/orders` | Payment processing, order history |
| **Shipping** (8083) | `/api/shipping/create` | Shipment creation and tracking |
| **Notification** (8084) | `/api/notification/send-email`, `/api/notification/all` | Email notifications, notification list |

## Setup & Running

### Local Development

1. **Start the services** (from project root):
   ```bash
   docker compose up --build -d
   ```

2. **Open frontend** in browser:
   ```
   http://localhost/
   ```
   
   Or for local testing (without Docker):
   - Open `index.html` directly in your browser
   - Services should be running on localhost

### Configuration

Default API endpoints in `script.js`:
```javascript
const API_BASE_URLs = {
    inventory: 'http://localhost:18081/api/inventory',
    payment: 'http://localhost:8082/api/payment',
    shipping: 'http://localhost:8083/api/shipping',
    notification: 'http://localhost:8084/api/notification'
};
```

Modify these URLs to match your deployment environment.

## File Structure

```
frontend/
├── index.html      # Main HTML structure
├── styles.css      # Responsive styling (mobile-first)
├── script.js       # Application logic & API integration
├── Dockerfile      # Container configuration (nginx)
└── README.md       # This file
```

## Pages & Functionality

### Home
- Hero section with call-to-action
- Featured products showcase
- Statistics cards (products, orders, customers)

### Shop
- Full product catalog with grid layout
- Search bar for product lookup
- Category filter dropdown
- Sort options (name, price, stock)
- Product cards with stock indicators

### Shopping Cart
- Summary of all cart items
- Quantity adjustment controls
- Remove item functionality
- Order summary with subtotal, shipping, tax

### Checkout
- Multi-section form:
  - Shipping Information (name, email, address)
  - Payment Information (card details)
  - Shipping Method (standard, express, overnight)
- Order summary on the right
- Real-time total calculation

### My Orders
- Order history with order IDs and dates
- Order status badges (pending, confirmed, shipped, delivered)
- Itemized order details
- Track order functionality

### Notifications
- Notification feed with timestamps
- Notification preference settings
- Email subscription options

### Inventory (Admin)
- Three tabs:
  - **View Inventory**: Table of all products with edit/delete actions
  - **Add Product**: Form to add new products
  - **Analytics**: Inventory statistics and charts

## Design System

### Colors
- **Primary**: #2563eb (Blue)
- **Success**: #10b981 (Green)
- **Danger**: #ef4444 (Red)
- **Warning**: #f59e0b (Amber)

### Responsive Breakpoints
- Desktop: 1200px+
- Tablet: 768px-1199px
- Mobile: < 480px

### Typography
- System fonts for performance (no external font loading)
- Consistent sizing scale
- Readable line heights

## State Management

Application state stored in `localStorage`:
```javascript
{
  cart: [],        // Shopping cart items
  orders: [],      // Order history
  products: [],    // Product catalog
  notifications: [], // Notification history
  inventory: []    // Admin inventory view
}
```

## Key JavaScript Functions

| Function | Purpose |
|----------|---------|
| `loadProducts()` | Fetch products from inventory service |
| `addToCart()` | Add product to shopping cart |
| `processPayment()` | Process checkout and payment |
| `loadOrders()` | Fetch order history |
| `loadNotifications()` | Fetch notification list |
| `loadInventory()` | Load inventory for admin view |

## Testing

### Manual Testing Checklist
- [ ] Products load from inventory service
- [ ] Search and filter work correctly
- [ ] Add to cart persists after page reload
- [ ] Checkout form validates input
- [ ] Order confirmation email sent
- [ ] Order appears in "My Orders" page
- [ ] Notifications display correctly
- [ ] Admin can add/edit/delete products
- [ ] Responsive design on mobile

### Mock Data
If services are not available, the frontend loads mock data for demonstration:
- 6 sample products across categories
- Mock orders and notifications
- Allows testing UI without full backend

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- No external dependencies (pure HTML/CSS/JS)
- Lazy loading of images
- Efficient DOM updates
- Local storage caching
- CSS animations optimized for 60fps

## Troubleshooting

### Products not loading
- Check if inventory service is running on `localhost:18081`
- Check browser console for CORS errors
- Verify API endpoint in `script.js`

### Cart not persisting
- Check browser localStorage is enabled
- Clear cache if state seems corrupted

### Checkout fails
- Ensure all payment service endpoints are accessible
- Check form validation (all fields required)
- Verify database connections

### Notifications not showing
- Check notification service is running on `localhost:8084`
- Verify email service is configured

## Future Enhancements

- [ ] User authentication & login
- [ ] Wishlist functionality
- [ ] Product reviews and ratings
- [ ] Real-time inventory sync
- [ ] Advanced analytics dashboard
- [ ] Discount codes and coupons
- [ ] Multiple payment methods (PayPal, Apple Pay)
- [ ] Chat support integration
- [ ] Push notifications
- [ ] Dark mode support

## License

This project is part of the E-commerce Microservices Platform.
