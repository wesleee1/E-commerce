// ===== CONFIGURATION =====
const API_BASE_URLs = {
    order: 'http://localhost:8085/api/order',
    inventory: 'http://localhost:18081/api/inventory',
    payment: 'http://localhost:8082/api/payment',
    shipping: 'http://localhost:8083/api/shipping',
    notification: 'http://localhost:8084/api/notification'
};

// ===== STATE MANAGEMENT =====
let appState = {
    cart: [],
    orders: [],
    products: [],
    selectedProduct: null,
    currentUser: {
        name: 'Guest User',
        email: 'guest@example.com'
    },
    notifications: [],
    inventory: []
};

// ===== LOCAL STORAGE =====
function saveState() {
    localStorage.setItem('appState', JSON.stringify(appState));
}

function loadState() {
    const saved = localStorage.getItem('appState');
    if (saved) {
        appState = JSON.parse(saved);
        updateCartCount();
    }
}

// ===== PAGE NAVIGATION =====
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');

    // Load data for specific pages
    if (pageId === 'shop') loadProducts();
    if (pageId === 'admin') loadInventory();
    if (pageId === 'orders') loadOrders();
    if (pageId === 'notifications') loadNotifications();
    if (pageId === 'home') loadFeaturedProducts();
    if (pageId === 'checkout') attachShippingListeners();

    window.scrollTo(0, 0);
}

// ===== PRODUCT MANAGEMENT =====
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE_URLs.inventory}/products`);
        if (response.ok) {
            appState.products = await response.json();
            displayProducts(appState.products);
            updateStats();
        }
    } catch (error) {
        console.error('Error loading products:', error);
        displayMockProducts();
    }
}

function displayMockProducts() {
    const mockProducts = [
        {
            id: 1,
            name: 'Wireless Headphones',
            category: 'electronics',
            price: 79.99,
            stock: 15,
            description: 'High-quality wireless headphones with noise cancellation'
        },
        {
            id: 2,
            name: 'Winter Jacket',
            category: 'clothing',
            price: 129.99,
            stock: 8,
            description: 'Warm and stylish winter jacket for cold seasons'
        },
        {
            id: 3,
            name: 'JavaScript Book',
            category: 'books',
            price: 39.99,
            stock: 25,
            description: 'Complete guide to modern JavaScript programming'
        },
        {
            id: 4,
            name: 'Plant Pot Set',
            category: 'home',
            price: 24.99,
            stock: 0,
            description: 'Beautiful ceramic plant pot set for indoor plants'
        },
        {
            id: 5,
            name: 'USB-C Cable',
            category: 'electronics',
            price: 14.99,
            stock: 50,
            description: 'Fast charging USB-C cable 2 meters long'
        },
        {
            id: 6,
            name: 'Running Shoes',
            category: 'clothing',
            price: 99.99,
            stock: 12,
            description: 'Professional running shoes with comfort cushioning'
        }
    ];
    appState.products = mockProducts;
    displayProducts(mockProducts);
    updateStats();
}

function displayProducts(products) {
    const container = document.getElementById('products-list');
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem;"><p>No products found</p></div>';
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-card" onclick="openProductModal(${product.id})">
            <div class="product-image">📦</div>
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-footer">
                    <div class="product-price">$${product.price.toFixed(2)}</div>
                    <div class="product-stock ${product.stock === 0 ? 'out-of-stock' : product.stock < 10 ? 'low-stock' : 'in-stock'}">
                        ${product.stock === 0 ? 'Out of Stock' : product.stock < 10 ? 'Low Stock' : `${product.stock} in stock`}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function loadFeaturedProducts() {
    if (appState.products.length === 0) {
        displayMockProducts();
    }
    const featured = appState.products.slice(0, 3);
    const container = document.getElementById('featured-products');
    container.innerHTML = featured.map(product => `
        <div class="product-card" onclick="openProductModal(${product.id})">
            <div class="product-image">📦</div>
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-footer">
                    <div class="product-price">$${product.price.toFixed(2)}</div>
                    <div class="product-stock ${product.stock === 0 ? 'out-of-stock' : product.stock < 10 ? 'low-stock' : 'in-stock'}">
                        ${product.stock === 0 ? 'Out of Stock' : `${product.stock} in stock`}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;

    let filtered = appState.products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm) || 
                              p.description.toLowerCase().includes(searchTerm);
        const matchesCategory = !category || p.category === category;
        return matchesSearch && matchesCategory;
    });

    displayProducts(filtered);
}

function sortProducts() {
    const sortBy = document.getElementById('sortFilter').value;
    let sorted = [...appState.products];

    switch(sortBy) {
        case 'price-asc':
            sorted.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            sorted.sort((a, b) => b.price - a.price);
            break;
        case 'stock':
            sorted.sort((a, b) => b.stock - a.stock);
            break;
        default:
            sorted.sort((a, b) => a.name.localeCompare(b.name));
    }

    displayProducts(sorted);
}

// ===== PRODUCT MODAL =====
function openProductModal(productId) {
    const product = appState.products.find(p => p.id === productId);
    if (!product) return;

    appState.selectedProduct = product;
    document.getElementById('modal-name').textContent = product.name;
    document.getElementById('modal-category').textContent = product.category.toUpperCase();
    document.getElementById('modal-category').className = 'category-badge';
    document.getElementById('modal-description').textContent = product.description;
    document.getElementById('modal-price').textContent = `$${product.price.toFixed(2)}`;
    document.getElementById('modal-stock').textContent = product.stock === 0 ? 'Out of Stock' : `${product.stock} in stock`;
    document.getElementById('modal-stock').className = `stock-status ${product.stock === 0 ? 'out-of-stock' : 'in-stock'}`;
    const modalImageContainer = document.querySelector('.modal-image');
    modalImageContainer.innerHTML = '<div style="font-size: 80px; display: flex; align-items: center; justify-content: center; height: 200px;">📦</div>';
    document.getElementById('quantity').value = 1;

    document.getElementById('productModal').classList.add('show');
}

function closeModal() {
    document.getElementById('productModal').classList.remove('show');
    appState.selectedProduct = null;
}

function increaseQuantity() {
    const input = document.getElementById('quantity');
    input.value = Math.min(parseInt(input.value) + 1, appState.selectedProduct.stock);
}

function decreaseQuantity() {
    const input = document.getElementById('quantity');
    input.value = Math.max(parseInt(input.value) - 1, 1);
}

function addToCart() {
    if (!appState.selectedProduct || appState.selectedProduct.stock === 0) {
        showToast('Product out of stock', 'error');
        return;
    }

    const quantity = parseInt(document.getElementById('quantity').value);
    const cartItem = appState.cart.find(item => item.id === appState.selectedProduct.id);

    if (cartItem) {
        cartItem.quantity += quantity;
    } else {
        appState.cart.push({
            ...appState.selectedProduct,
            quantity: quantity
        });
    }

    saveState();
    updateCartCount();
    showToast(`Added ${quantity} item(s) to cart`, 'success');
    closeModal();
}

// ===== SHOPPING CART =====
function updateCartCount() {
    const count = appState.cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelector('.cart-count').textContent = count;
}

function displayCart() {
    const container = document.getElementById('cart-items');

    if (appState.cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <p style="font-size: 3rem;">🛒</p>
                <p>Your cart is empty</p>
                <button class="btn btn-primary" onclick="showPage('shop')">Continue Shopping</button>
            </div>
        `;
        updateCartSummary();
        return;
    }

    container.innerHTML = appState.cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">📦</div>
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                <div class="cart-item-controls">
                    <button onclick="decreaseCartQuantity(${item.id})">−</button>
                    <input type="number" value="${item.quantity}" min="1" onchange="updateCartQuantity(${item.id}, this.value)">
                    <button onclick="increaseCartQuantity(${item.id})">+</button>
                    <button class="btn btn-danger" style="margin-left: auto;" onclick="removeFromCart(${item.id})">Remove</button>
                </div>
            </div>
            <div class="cart-item-total">$${(item.price * item.quantity).toFixed(2)}</div>
        </div>
    `).join('');

    updateCartSummary();
}

function updateCartQuantity(productId, newQuantity) {
    const item = appState.cart.find(i => i.id === productId);
    if (item) {
        item.quantity = Math.max(1, parseInt(newQuantity));
        saveState();
        updateCartCount();
        displayCart();
    }
}

function increaseCartQuantity(productId) {
    const item = appState.cart.find(i => i.id === productId);
    if (item) {
        item.quantity++;
        saveState();
        updateCartCount();
        displayCart();
    }
}

function decreaseCartQuantity(productId) {
    const item = appState.cart.find(i => i.id === productId);
    if (item) {
        item.quantity = Math.max(1, item.quantity - 1);
        saveState();
        updateCartCount();
        displayCart();
    }
}

function removeFromCart(productId) {
    appState.cart = appState.cart.filter(item => item.id !== productId);
    saveState();
    updateCartCount();
    displayCart();
    showToast('Item removed from cart', 'success');
}

function updateCartSummary() {
    const subtotal = appState.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = 5;
    const tax = subtotal * 0.1;
    const total = subtotal + shipping + tax;

    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('shipping').textContent = `$${shipping.toFixed(2)}`;
    document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

function proceedToCheckout() {
    if (appState.cart.length === 0) {
        showToast('Cart is empty', 'error');
        return;
    }
    showPage('checkout');
    displayCheckoutSummary();
}

function getShippingCost(method) {
    const shippingCosts = {
        standard: 5.00,
        express: 15.00,
        overnight: 30.00
    };
    return shippingCosts[method] || 5.00;
}

function displayCheckoutSummary() {
    const itemsContainer = document.getElementById('checkout-items');
    itemsContainer.innerHTML = appState.cart.map(item => `
        <div class="checkout-item">
            <span>${item.name} x ${item.quantity}</span>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');

    updateCheckoutCalculations();
}

function updateCheckoutCalculations() {
    const subtotal = appState.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingMethod = document.querySelector('input[name="shipping"]:checked')?.value || 'standard';
    const shipping = getShippingCost(shippingMethod);
    const tax = subtotal * 0.1;
    const total = subtotal + shipping + tax;

    const subtotalEl = document.getElementById('checkout-subtotal');
    const shippingEl = document.getElementById('checkout-shipping');
    const taxEl = document.getElementById('checkout-tax');
    const totalEl = document.getElementById('checkout-total');

    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (shippingEl) shippingEl.textContent = `$${shipping.toFixed(2)}`;
    if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
}

function attachShippingListeners() {
    const shippingRadios = document.querySelectorAll('input[name="shipping"]');
    shippingRadios.forEach(radio => {
        radio.removeEventListener('change', updateCheckoutCalculations);
        radio.addEventListener('change', updateCheckoutCalculations);
    });
    // Call immediately to update totals with currently selected shipping method
    updateCheckoutCalculations();
}

// ===== PAYMENT PROCESSING =====
async function processPayment(event) {
    event.preventDefault();

    // Validate cart is not empty
    if (appState.cart.length === 0) {
        showToast('Cart is empty', 'error');
        return;
    }

    // Validate required fields
    const fullName = document.getElementById('fullName').value?.trim();
    const email = document.getElementById('email').value?.trim();
    const phone = document.getElementById('phone').value?.trim();
    const address = document.getElementById('address').value?.trim();
    const city = document.getElementById('city').value?.trim();
    const zipCode = document.getElementById('zipCode').value?.trim();
    const cardName = document.getElementById('cardName').value?.trim();
    const cardNumber = document.getElementById('cardNumber').value?.trim();
    const expiryDate = document.getElementById('expiryDate').value?.trim();
    const cvv = document.getElementById('cvv').value?.trim();

    if (!fullName || !email || !phone || !address || !city || !zipCode) {
        showToast('Please fill in all shipping information', 'error');
        return;
    }

    if (!cardName || !cardNumber || !expiryDate || !cvv) {
        showToast('Please fill in all payment information', 'error');
        return;
    }

    if (cardNumber.length < 13) {
        showToast('Card number must be at least 13 digits', 'error');
        return;
    }

    const shippingMethod = document.querySelector('input[name="shipping"]:checked')?.value || 'standard';

    const orderData = {
        customerId: 1,
        productId: appState.cart[0]?.id || 1,
        quantity: appState.cart.reduce((sum, item) => sum + item.quantity, 0),
        amount: parseFloat(document.getElementById('checkout-total').textContent.replace('$', '')),
        shippingMethod: shippingMethod
    };

    try {
        // Disable submit button to prevent double clicks
        const submitButton = event.target.querySelector('button[type="submit"]');
        if (submitButton) submitButton.disabled = true;

        showToast('Processing order...', 'info');

        // Create order via Order Service (publishes ORDER_CREATED event)
        const orderResponse = await fetch(`${API_BASE_URLs.order}/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (!orderResponse.ok) {
            showToast('Failed to create order', 'error');
            const submitButton = event.target.querySelector('button[type="submit"]');
            if (submitButton) submitButton.disabled = false;
            return;
        }

        const createdOrder = await orderResponse.json();
        const orderId = createdOrder.orderId;

        // Reserve stock
        for (const item of appState.cart) {
            const reserveResponse = await fetch(`${API_BASE_URLs.inventory}/reserve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `productId=${item.id}&quantity=${item.quantity}&orderId=${orderId}`
            });
            if (!reserveResponse.ok) {
                console.warn(`Warning: Stock reservation may have failed for product ${item.id}`);
            }
        }

        // Gather payment details for submission
        const fullName = document.getElementById('fullName').value?.trim();
        const email = document.getElementById('email').value?.trim();
        const phone = document.getElementById('phone').value?.trim();
        const address = document.getElementById('address').value?.trim();
        const city = document.getElementById('city').value?.trim();
        const zipCode = document.getElementById('zipCode').value?.trim();

        // Process payment
        const paymentResponse = await fetch(`${API_BASE_URLs.payment}/process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId: orderId,
                customerName: fullName,
                email: email,
                phone: phone,
                address: address,
                city: city,
                zipCode: zipCode,
                shippingMethod: shippingMethod,
                totalAmount: orderData.amount,
                status: 'pending'
            })
        });

        if (paymentResponse.ok) {
            // Create shipment
            await fetch(`${API_BASE_URLs.shipping}/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: orderId,
                    shippingMethod: shippingMethod
                })
            });

            // Send notification email
            await fetch(`${API_BASE_URLs.notification}/send-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: orderId,
                    email: email
                })
            });

            // Save order locally
            appState.orders.push({
                id: orderId,
                customerId: 1,
                productId: appState.cart[0]?.id,
                quantity: appState.cart.reduce((sum, item) => sum + item.quantity, 0),
                amount: orderData.amount,
                shippingMethod: shippingMethod,
                status: 'confirmed',
                timestamp: new Date().toISOString()
            });

            // Clear cart
            appState.cart = [];
            saveState();
            updateCartCount();

            showToast('Order placed successfully!', 'success');
            
            // Show order confirmation
            setTimeout(() => {
                showPage('orders');
                loadOrders();
            }, 1500);
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        showToast('Payment processing failed: ' + error.message, 'error');
        // Re-enable submit button on error
        const submitButton = event.target.querySelector('button[type="submit"]');
        if (submitButton) submitButton.disabled = false;
    }
}

// ===== ORDERS =====
async function loadOrders() {
    try {
        // Fetch from Order Service (source of truth for all orders)
        const response = await fetch(`${API_BASE_URLs.order}`);
        if (response.ok) {
            let orders = await response.json();
            
            // Transform Order Service response to match display format
            if (orders && !Array.isArray(orders)) {
                orders = [orders];
            }
            
            // Ensure orders have all required fields for display
            orders = orders.map(order => {
                const itemPrice = order.amount / (order.quantity || 1);
                const product = appState.products.find(p => p.id === order.productId) || {
                    name: `Product #${order.productId}`,
                    price: itemPrice
                };
                
                return {
                    id: order.id || order.orderId,
                    orderId: order.id || order.orderId,
                    customerId: order.customerId,
                    productId: order.productId,
                    quantity: order.quantity,
                    amount: order.amount,
                    totalAmount: order.amount,
                    shippingMethod: order.shippingMethod,
                    status: order.status || 'PENDING',
                    timestamp: order.timestamp || new Date().toISOString(),
                    items: [{
                        id: order.productId,
                        name: product.name,
                        quantity: order.quantity,
                        price: itemPrice
                    }]
                };
            });
            
            appState.orders = orders;
            displayOrders(orders);
        } else {
            console.warn('Failed to fetch orders from Order Service, using local cache');
            displayOrders(appState.orders);
        }
    } catch (error) {
        console.error('Error loading orders from Order Service:', error);
        console.warn('Falling back to local order cache');
        displayOrders(appState.orders);
    }
}

function displayOrders(orders) {
    const container = document.getElementById('orders-list');

    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <p style="font-size: 3rem;">📦</p>
                <p>No orders yet</p>
                <button class="btn btn-primary" onclick="showPage('shop')">Start Shopping</button>
            </div>
        `;
        return;
    }

    container.innerHTML = orders.map(order => {
        // Safely get order properties with defaults
        const orderId = order.id || order.orderId || 'Unknown';
        const orderStatus = (order.status || 'PENDING').toUpperCase();
        const orderDate = order.timestamp ? new Date(order.timestamp).toLocaleDateString() : 'N/A';
        const totalAmount = order.totalAmount || order.amount || 0;
        const items = order.items || [];
        
        return `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <div class="order-id">Order #${orderId}</div>
                    <div class="order-date">${orderDate}</div>
                </div>
                <span class="order-status status-${(order.status || 'pending').toLowerCase()}">${orderStatus}</span>
            </div>
            <div class="order-items">
                ${items.length > 0 
                    ? items.map(item => `
                    <div class="order-item">
                        <span class="order-item-name">${item.name || `Product #${item.id}`}</span>
                        <span class="order-item-qty">x${item.quantity || 0}</span>
                        <span class="order-item-price">$${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</span>
                    </div>
                `).join('')
                    : '<div class="order-item"><em>No items</em></div>'
                }
            </div>
            <div class="order-footer">
                <div class="order-total">Total: $${parseFloat(totalAmount).toFixed(2)}</div>
                <button class="btn btn-primary" onclick="trackOrder(${orderId})">Track Order</button>
            </div>
        </div>
        `;
    }).join('');
}

function trackOrder(orderId) {
    showToast(`Tracking order #${orderId}. Shipment will be dispatched soon!`, 'success');
}

// ===== NOTIFICATIONS =====
async function loadNotifications() {
    try {
        const response = await fetch(`${API_BASE_URLs.notification}/all`);
        if (response.ok) {
            appState.notifications = await response.json();
            displayNotifications(appState.notifications);
        } else {
            displayNotifications(appState.notifications);
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
        displayNotifications([
            {
                id: 1,
                type: 'order',
                icon: '✅',
                title: 'Order Confirmed',
                message: 'Your order #123 has been confirmed',
                time: 'Just now'
            },
            {
                id: 2,
                type: 'shipping',
                icon: '🚚',
                title: 'Shipment Dispatched',
                message: 'Your order is on the way',
                time: '2 hours ago'
            },
            {
                id: 3,
                type: 'payment',
                icon: '💳',
                title: 'Payment Received',
                message: 'Payment of $99.99 received',
                time: '1 day ago'
            }
        ]);
    }
}

function displayNotifications(notifications) {
    const container = document.getElementById('notifications-list');

    if (notifications.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <p>No notifications yet</p>
            </div>
        `;
        return;
    }

    container.innerHTML = notifications.map(notif => `
        <div class="notification-item">
            <div class="notification-icon">${notif.icon || '📧'}</div>
            <div class="notification-content">
                <h4>${notif.title}</h4>
                <p>${notif.message}</p>
                <span class="notification-time">${notif.time}</span>
            </div>
        </div>
    `).join('');
}

// ===== INVENTORY MANAGEMENT =====
async function loadInventory() {
    try {
        const response = await fetch(`${API_BASE_URLs.inventory}/products`);
        if (response.ok) {
            appState.inventory = await response.json();
            displayInventory(appState.inventory);
            updateAnalytics();
        }
    } catch (error) {
        console.error('Error loading inventory:', error);
        appState.inventory = appState.products;
        displayInventory(appState.inventory);
        updateAnalytics();
    }
}

function displayInventory(inventory) {
    const tbody = document.getElementById('inventory-table-body');

    if (inventory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">No products in inventory</td></tr>';
        return;
    }

    tbody.innerHTML = inventory.map(product => `
        <tr>
            <td>#${product.id}</td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.stock}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td>
                <span class="product-stock ${product.stock === 0 ? 'out-of-stock' : product.stock < 10 ? 'low-stock' : 'in-stock'}">
                    ${product.stock === 0 ? 'Out' : product.stock < 10 ? 'Low' : 'OK'}
                </span>
            </td>
            <td>
                <div class="table-actions">
                    <button class="edit-btn" onclick="editProduct(${product.id})">Edit</button>
                    <button class="delete-btn" onclick="deleteProduct(${product.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterInventory() {
    const searchTerm = document.getElementById('inventorySearch').value.toLowerCase();
    const filtered = appState.inventory.filter(p => 
        p.name.toLowerCase().includes(searchTerm) || p.id.toString().includes(searchTerm)
    );
    displayInventory(filtered);
}

function refreshInventory() {
    loadInventory();
    showToast('Inventory refreshed', 'success');
}

async function addProduct(event) {
    event.preventDefault();

    const newProduct = {
        name: document.getElementById('prodName').value,
        category: document.getElementById('prodCategory').value,
        price: parseFloat(document.getElementById('prodPrice').value),
        stock: parseInt(document.getElementById('prodStock').value),
        description: document.getElementById('prodDescription').value
    };

    try {
        const response = await fetch(`${API_BASE_URLs.inventory}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProduct)
        });

        if (response.ok) {
            showToast('Product added successfully!', 'success');
            event.target.reset();
            loadInventory();
        }
    } catch (error) {
        console.error('Error adding product:', error);
        showToast('Error adding product', 'error');
    }
}

function editProduct(productId) {
    showToast('Edit functionality coming soon', 'success');
}

function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        appState.inventory = appState.inventory.filter(p => p.id !== productId);
        displayInventory(appState.inventory);
        showToast('Product deleted', 'success');
    }
}

function updateAnalytics() {
    const total = appState.inventory.length;
    const lowStock = appState.inventory.filter(p => p.stock > 0 && p.stock < 10).length;
    const outOfStock = appState.inventory.filter(p => p.stock === 0).length;
    const totalValue = appState.inventory.reduce((sum, p) => sum + (p.price * p.stock), 0);

    document.getElementById('analytics-total').textContent = total;
    document.getElementById('analytics-lowstock').textContent = lowStock;
    document.getElementById('analytics-outofstock').textContent = outOfStock;
    document.getElementById('analytics-value').textContent = `$${totalValue.toFixed(2)}`;
}

function switchAdminTab(tabName) {
    document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    const tabMap = {
        'view': 'view-tab',
        'add': 'add-tab',
        'analytics': 'analytics-tab'
    };

    document.getElementById(tabMap[tabName]).classList.add('active');
    event.target.classList.add('active');

    if (tabName === 'view') loadInventory();
}

// ===== UTILITY FUNCTIONS =====
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function updateStats() {
    const totalProducts = appState.products.length;
    const totalOrders = appState.orders.length;

    document.getElementById('stat-products').textContent = totalProducts;
    document.getElementById('stat-orders').textContent = totalOrders;
}

// ===== ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    showPage('home');
    loadFeaturedProducts();
    updateStats();

    // Watch for cart page displays
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.id === 'cart' && mutation.target.classList.contains('active')) {
                displayCart();
            }
        });
    });

    observer.observe(document.getElementById('cart'), { attributes: true, attributeFilter: ['class'] });
});

// Close modal on outside click
window.onclick = function(event) {
    const modal = document.getElementById('productModal');
    if (event.target === modal) {
        closeModal();
    }
};

// Format currency globally
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
}
