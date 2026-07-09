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
    inventory: [],
    wishlist: [],
    appliedPromo: null
};

// ===== LOCAL STORAGE =====
function saveState() {
    localStorage.setItem('appState', JSON.stringify(appState));
}

function loadState() {
    const saved = localStorage.getItem('appState');
    if (saved) {
        appState = JSON.parse(saved);
    }
    appState.cart = Array.isArray(appState.cart) ? appState.cart : [];
    appState.orders = Array.isArray(appState.orders) ? appState.orders : [];
    appState.products = Array.isArray(appState.products) ? appState.products : [];
    appState.notifications = Array.isArray(appState.notifications) ? appState.notifications : [];
    appState.inventory = Array.isArray(appState.inventory) ? appState.inventory : [];
    appState.wishlist = Array.isArray(appState.wishlist) ? appState.wishlist : [];
    appState.currentUser = {
        name: appState.currentUser?.name || 'Guest User',
        email: appState.currentUser?.email || 'guest@example.com'
    };
    appState.appliedPromo = appState.appliedPromo || null;

    updateCartCount();
    updateWishlistCount();
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
    if (pageId === 'wishlist') displayWishlist();
    if (pageId === 'orders') loadOrders();
    if (pageId === 'notifications') loadNotifications();
    if (pageId === 'home') {
        loadFeaturedProducts();
        renderRecommendationRail();
        renderHomeSignals();
    }
    if (pageId === 'checkout') {
        attachShippingListeners();
        displayCheckoutSummary();
    }
    if (pageId === 'cart') displayCart();

    window.scrollTo(0, 0);
}

// ===== PRODUCT MANAGEMENT =====
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE_URLs.inventory}/products`);
        if (response.ok) {
            appState.products = await response.json();
            displayProducts(appState.products);
            renderRecommendationRail();
            renderHomeSignals();
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
    renderRecommendationRail();
    renderHomeSignals();
    updateStats();
}

function displayProducts(products) {
    const container = document.getElementById('products-list');
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem;"><p>No products found</p></div>';
        return;
    }

    container.innerHTML = products.map(product => renderProductCard(product)).join('');
}

function loadFeaturedProducts() {
    if (appState.products.length === 0) {
        displayMockProducts();
    }
    const featured = appState.products.slice(0, 3);
    const container = document.getElementById('featured-products');
    container.innerHTML = featured.map(product => renderProductCard(product, true)).join('');
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
    renderRecommendationRail();
    renderHomeSignals();
    showToast(`Added ${quantity} item(s) to cart`, 'success');
    closeModal();
}

function quickAddToCart(productId) {
    const product = appState.products.find(p => p.id === productId);
    if (!product || product.stock === 0) {
        showToast('Product out of stock', 'error');
        return;
    }

    const existing = appState.cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        appState.cart.push({ ...product, quantity: 1 });
    }

    saveState();
    updateCartCount();
    renderRecommendationRail();
    renderHomeSignals();
    showToast(`${product.name} added to cart`, 'success');
}

function toggleWishlist(productId) {
    const exists = appState.wishlist.includes(productId);
    if (exists) {
        appState.wishlist = appState.wishlist.filter(id => id !== productId);
        showToast('Removed from wishlist', 'success');
    } else {
        appState.wishlist.push(productId);
        showToast('Saved to wishlist', 'success');
    }

    saveState();
    updateWishlistCount();
    displayProducts(appState.products);
    displayWishlist();
    renderRecommendationRail();
    renderHomeSignals();
}

function toggleWishlistFromModal() {
    if (!appState.selectedProduct) {
        return;
    }
    toggleWishlist(appState.selectedProduct.id);
}

// ===== SHOPPING CART =====
function updateCartCount() {
    const count = appState.cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelector('.cart-count').textContent = count;
}

function updateWishlistCount() {
    const count = appState.wishlist.length;
    const badge = document.querySelector('.wishlist-count');
    if (badge) {
        badge.textContent = count;
    }
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
        renderCartInsights();
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
    renderCartInsights();
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
    renderRecommendationRail();
    renderHomeSignals();
    showToast('Item removed from cart', 'success');
}

function updateCartSummary() {
    const pricing = calculatePricing('standard');

    const subtotalEl = document.getElementById('subtotal');
    const discountEl = document.getElementById('discount');
    const shippingEl = document.getElementById('shipping');
    const taxEl = document.getElementById('tax');
    const totalEl = document.getElementById('total');

    if (subtotalEl) subtotalEl.textContent = formatCurrency(pricing.subtotal);
    if (discountEl) discountEl.textContent = `-${formatCurrency(pricing.discount)}`;
    if (shippingEl) shippingEl.textContent = formatCurrency(pricing.shipping);
    if (taxEl) taxEl.textContent = formatCurrency(pricing.tax);
    if (totalEl) totalEl.textContent = formatCurrency(pricing.total);

    const promoFeedback = document.getElementById('promo-feedback');
    if (promoFeedback) {
        promoFeedback.textContent = pricing.promoLabel;
    }
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
    const shippingMethod = document.querySelector('input[name="shipping"]:checked')?.value || 'standard';
    const pricing = calculatePricing(shippingMethod);

    const subtotalEl = document.getElementById('checkout-subtotal');
    const discountEl = document.getElementById('checkout-discount');
    const shippingEl = document.getElementById('checkout-shipping');
    const taxEl = document.getElementById('checkout-tax');
    const totalEl = document.getElementById('checkout-total');
    const promoLabel = document.getElementById('checkout-promo-label');
    const deliveryEstimate = document.getElementById('checkout-delivery-estimate');

    if (subtotalEl) subtotalEl.textContent = formatCurrency(pricing.subtotal);
    if (discountEl) discountEl.textContent = `-${formatCurrency(pricing.discount)}`;
    if (shippingEl) shippingEl.textContent = formatCurrency(pricing.shipping);
    if (taxEl) taxEl.textContent = formatCurrency(pricing.tax);
    if (totalEl) totalEl.textContent = formatCurrency(pricing.total);
    if (promoLabel) promoLabel.textContent = pricing.promoCode || 'No promo';
    if (deliveryEstimate) deliveryEstimate.textContent = getDeliveryEstimate(shippingMethod);
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
function getInputValue(id) {
    const el = document.getElementById(id);
    return el ? el.value?.trim() : '';
}

async function processPayment(event) {
    event.preventDefault();

    // Validate cart is not empty
    if (appState.cart.length === 0) {
        showToast('Cart is empty', 'error');
        return;
    }

    // Validate required fields
    const fullName = getInputValue('fullName');
    const email = getInputValue('email');
    const phone = getInputValue('phone');
    const address = getInputValue('address');
    const city = getInputValue('city');
    const zipCode = getInputValue('zipCode');
    const cardName = getInputValue('cardName');
    const cardNumber = getInputValue('cardNumber');
    const expiryDate = getInputValue('expiryDate');
    const cvv = getInputValue('cvv');

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
    const pricing = calculatePricing(shippingMethod);

    const orderData = {
        customerId: 1,
        customerName: fullName,
        customerEmail: email,
        phone: phone,
        addressLine: address,
        city: city,
        zipCode: zipCode,
        productId: appState.cart[0]?.id || 1,
        quantity: appState.cart.reduce((sum, item) => sum + item.quantity, 0),
        amount: pricing.total,
        shippingMethod: shippingMethod,
        promoCode: appState.appliedPromo?.code || null,
        orderNote: getInputValue('orderNote'),
        subtotalAmount: pricing.subtotal,
        shippingCost: pricing.shipping,
        taxAmount: pricing.tax,
        items: appState.cart.map(item => ({
            productId: item.id,
            productName: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            lineTotal: item.price * item.quantity
        }))
    };

    try {
        // Disable submit button to prevent double clicks
        const submitButton = event.target?.querySelector('button[type="submit"]');
        if (submitButton) submitButton.disabled = true;

        showToast('Processing order...', 'info');

        // Create order via Order Service (publishes ORDER_CREATED event)
        const orderResponse = await fetch(`${API_BASE_URLs.order}/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (!orderResponse.ok) {
            const errorPayload = await orderResponse.json().catch(() => null);
            const errorMessage = errorPayload?.error || 'Failed to create order';
            showToast(errorMessage, 'error');
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
        const fullName = getInputValue('fullName');
        const email = getInputValue('email');
        const phone = getInputValue('phone');
        const address = getInputValue('address');
        const city = getInputValue('city');
        const zipCode = getInputValue('zipCode');

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
            appState.orders.unshift(mapOrderForDisplay({
                ...createdOrder,
                customerName: fullName,
                customerEmail: email,
                phone: phone,
                addressLine: address,
                city: city,
                zipCode: zipCode,
                promoCode: appState.appliedPromo?.code || null,
                orderNote: getInputValue('orderNote'),
                subtotalAmount: pricing.subtotal,
                shippingCost: pricing.shipping,
                taxAmount: pricing.tax,
                amount: pricing.total,
                items: orderData.items,
                status: 'confirmed',
                createdAt: createdOrder.createdAt || new Date().toISOString()
            }));

            // Clear cart
            appState.cart = [];
            appState.appliedPromo = null;
            saveState();
            updateCartCount();
            updateWishlistCount();
            renderRecommendationRail();
            renderHomeSignals();

            showToast('Order placed successfully!', 'success');
            
            // Show order confirmation
            setTimeout(() => {
                showPage('orders');
                loadOrders();
            }, 1500);
        } else {
            showToast('Payment service rejected the transaction', 'error');
            if (submitButton) submitButton.disabled = false;
            return;
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
        const response = await fetch(`${API_BASE_URLs.order}`);
        if (response.ok) {
            let orders = await response.json();
            if (orders && !Array.isArray(orders)) {
                orders = [orders];
            }
            orders = orders.map(mapOrderForDisplay);
            
            appState.orders = orders;
            saveState();
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
        updateOrderOverview([]);
        return;
    }

    container.innerHTML = orders.map(order => {
        const orderId = order.id || order.orderId || 'Unknown';
        const orderStatus = (order.status || 'PENDING').toUpperCase();
        const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A';
        const totalAmount = order.totalAmount || order.amount || 0;
        const items = order.items || [];
        
        return `
        <div class="order-card advanced-order-card">
            <div class="order-header">
                <div>
                    <div class="order-id">Order #${orderId}</div>
                    <div class="order-date">${orderDate}</div>
                </div>
                <span class="order-status status-${(order.status || 'pending').toLowerCase()}">${orderStatus}</span>
            </div>
            <div class="order-meta-grid">
                <div><span>Tracking</span><strong>${order.trackingNumber || 'Pending assignment'}</strong></div>
                <div><span>ETA</span><strong>${order.estimatedDelivery || getDeliveryEstimate(order.shippingMethod)}</strong></div>
                <div><span>Shipping</span><strong>${(order.shippingMethod || 'standard').toUpperCase()}</strong></div>
                <div><span>Promo</span><strong>${order.promoCode || 'None'}</strong></div>
            </div>
            <div class="order-items">
                ${items.length > 0 
                    ? items.map(item => `
                    <div class="order-item">
                        <span class="order-item-name">${item.productName || item.name || `Product #${item.productId || item.id}`}</span>
                        <span class="order-item-qty">x${item.quantity || 0}</span>
                        <span class="order-item-price">${formatCurrency(item.lineTotal || ((item.unitPrice || item.price || 0) * (item.quantity || 0)))}</span>
                    </div>
                `).join('')
                    : '<div class="order-item"><em>No items</em></div>'
                }
            </div>
            <div class="order-secondary-row">
                <div>
                    <span>Ship to</span>
                    <strong>${order.customerName || appState.currentUser.name}</strong>
                    <p>${order.addressLine || 'Address unavailable'}${order.city ? `, ${order.city}` : ''}${order.zipCode ? ` ${order.zipCode}` : ''}</p>
                </div>
                <div>
                    <span>Delivery note</span>
                    <strong>${order.orderNote || 'No special instructions'}</strong>
                    <p>${order.customerEmail || appState.currentUser.email}</p>
                </div>
            </div>
            <div class="order-footer">
                <div class="order-total">Total: ${formatCurrency(parseFloat(totalAmount))}</div>
                <button class="btn btn-primary" onclick="trackOrder(${orderId})">Track Order</button>
            </div>
        </div>
        `;
    }).join('');

    updateOrderOverview(orders);
}

function trackOrder(orderId) {
    const order = appState.orders.find(item => item.id === orderId || item.orderId === orderId);
    const trackingNumber = order?.trackingNumber || 'Pending assignment';
    const eta = order?.estimatedDelivery || 'Shipment will be dispatched soon';
    showToast(`Tracking ${trackingNumber}. ETA: ${eta}`, 'success');
}

function displayWishlist() {
    const container = document.getElementById('wishlist-grid');
    if (!container) {
        return;
    }

    const products = appState.products.filter(product => appState.wishlist.includes(product.id));
    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-state-panel">
                <p style="font-size: 3rem;">♡</p>
                <p>No favorites yet</p>
                <button class="btn btn-primary" onclick="showPage('shop')">Discover products</button>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(product => renderProductCard(product, true)).join('');
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
    renderHomeSignals();
}

// ===== ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    showPage('home');
    loadFeaturedProducts();
    renderRecommendationRail();
    renderHomeSignals();
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

function renderProductCard(product, spotlight = false) {
    const inWishlist = appState.wishlist.includes(product.id);
    return `
        <div class="product-card ${spotlight ? 'spotlight-card' : ''}" onclick="openProductModal(${product.id})">
            <div class="product-image">📦</div>
            <div class="product-info">
                <div class="product-topline">
                    <div class="product-category">${product.category}</div>
                    ${spotlight ? '<span class="product-badge">Top Pick</span>' : ''}
                </div>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-footer">
                    <div class="product-price">${formatCurrency(product.price)}</div>
                    <div class="product-stock ${product.stock === 0 ? 'out-of-stock' : product.stock < 10 ? 'low-stock' : 'in-stock'}">
                        ${product.stock === 0 ? 'Out of Stock' : product.stock < 10 ? 'Low Stock' : `${product.stock} in stock`}
                    </div>
                </div>
                <div class="product-card-actions">
                    <button class="btn btn-primary" onclick="event.stopPropagation(); quickAddToCart(${product.id})">Quick Add</button>
                    <button class="btn btn-secondary" onclick="event.stopPropagation(); toggleWishlist(${product.id})">${inWishlist ? 'Saved' : 'Wishlist'}</button>
                </div>
            </div>
        </div>
    `;
}

function applyPromoCode() {
    const input = document.getElementById('promoCodeInput');
    const code = input?.value?.trim().toUpperCase();
    if (!code) {
        showToast('Enter a promo code first', 'error');
        return;
    }

    const promo = getPromoDetails(code, appState.cart.reduce((sum, item) => sum + item.price * item.quantity, 0), appState.cart.reduce((sum, item) => sum + item.quantity, 0));
    if (!promo) {
        showToast('Promo code not recognized', 'error');
        return;
    }

    appState.appliedPromo = promo;
    saveState();
    updateCartSummary();
    updateCheckoutCalculations();
    showToast(`${promo.code} applied`, 'success');
}

function getPromoDetails(code, subtotal, itemCount) {
    const promoCode = (code || '').toUpperCase();
    if (promoCode === 'SAVE10') {
        return { code: 'SAVE10', label: '10% off cart value', type: 'percent', value: 0.10 };
    }
    if (promoCode === 'SHIPFREE') {
        return { code: 'SHIPFREE', label: 'Free shipping unlocked', type: 'shipping', value: 1 };
    }
    if (promoCode === 'BULK20' && itemCount >= 5 && subtotal >= 100) {
        return { code: 'BULK20', label: '20% off bulk basket', type: 'percent', value: 0.20 };
    }
    return null;
}

function calculatePricing(shippingMethod) {
    const subtotal = appState.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = appState.cart.reduce((sum, item) => sum + item.quantity, 0);
    const baseShipping = appState.cart.length === 0 ? 0 : getShippingCost(shippingMethod);

    let discount = 0;
    let shipping = baseShipping;
    let promoLabel = 'No promo applied';
    let promoCode = null;

    if (appState.appliedPromo) {
        promoCode = appState.appliedPromo.code;
        promoLabel = `${appState.appliedPromo.code} · ${appState.appliedPromo.label}`;

        if (appState.appliedPromo.type === 'percent') {
            discount = subtotal * appState.appliedPromo.value;
        }
        if (appState.appliedPromo.type === 'shipping') {
            discount = baseShipping;
            shipping = 0;
        }
    }

    if (promoCode === 'BULK20' && (itemCount < 5 || subtotal < 100)) {
        appState.appliedPromo = null;
        promoLabel = 'BULK20 requires 5 items and $100 subtotal';
        promoCode = null;
        saveState();
    }

    const taxableSubtotal = Math.max(0, subtotal - discount);
    const tax = taxableSubtotal * 0.1;
    const total = taxableSubtotal + shipping + tax;

    return {
        subtotal,
        discount,
        shipping,
        tax,
        total,
        promoLabel,
        promoCode
    };
}

function getDeliveryEstimate(shippingMethod) {
    switch ((shippingMethod || 'standard').toLowerCase()) {
        case 'overnight':
            return 'Tomorrow by 9 PM';
        case 'express':
            return '2-3 business days';
        default:
            return '5-7 business days';
    }
}

function renderRecommendationRail() {
    const container = document.getElementById('recommended-products');
    if (!container) {
        return;
    }

    const categoryPool = [...appState.cart, ...appState.products.filter(product => appState.wishlist.includes(product.id))]
        .map(product => product.category)
        .filter(Boolean);
    const favoriteCategory = categoryPool[0] || appState.products[0]?.category;

    const recommendations = appState.products
        .filter(product => !appState.cart.some(item => item.id === product.id))
        .filter(product => !favoriteCategory || product.category === favoriteCategory)
        .slice(0, 3);

    if (recommendations.length === 0) {
        container.innerHTML = '<div class="empty-state-panel"><p>Recommendations will appear as you shop.</p></div>';
        return;
    }

    container.innerHTML = recommendations.map(product => renderProductCard(product, true)).join('');
}

function renderCartInsights() {
    const panel = document.getElementById('cart-insights');
    if (!panel) {
        return;
    }

    if (appState.cart.length === 0) {
        panel.innerHTML = '<p>Your cart insights will appear here once you add items.</p>';
        return;
    }

    const topCategory = getTopCategoryFromProducts(appState.cart);
    const pricing = calculatePricing('standard');
    panel.innerHTML = `
        <div class="insight-card">
            <span>Top category</span>
            <strong>${topCategory || 'Mixed basket'}</strong>
        </div>
        <div class="insight-card">
            <span>Estimated reward</span>
            <strong>${Math.round(pricing.total / 10)} pts</strong>
        </div>
        <div class="insight-card">
            <span>Basket signal</span>
            <strong>${appState.cart.length > 2 ? 'High intent' : 'Building'}</strong>
        </div>
    `;
}

function renderHomeSignals() {
    const orderCountEl = document.getElementById('hero-order-count');
    const wishlistCountEl = document.getElementById('hero-wishlist-count');
    const inventoryHealthEl = document.getElementById('hero-inventory-health');
    const topCategoryEl = document.getElementById('hero-top-category');

    if (orderCountEl) orderCountEl.textContent = appState.orders.length;
    if (wishlistCountEl) wishlistCountEl.textContent = appState.wishlist.length;
    if (inventoryHealthEl) {
        const lowStock = appState.products.filter(product => product.stock > 0 && product.stock < 10).length;
        inventoryHealthEl.textContent = lowStock > 2 ? 'Watch low stock' : 'Stable';
    }
    if (topCategoryEl) topCategoryEl.textContent = getTopCategoryFromProducts([...appState.cart, ...appState.products.filter(product => appState.wishlist.includes(product.id))]) || 'Electronics';
}

function getTopCategoryFromProducts(products) {
    const counts = products.reduce((accumulator, product) => {
        if (!product.category) {
            return accumulator;
        }
        accumulator[product.category] = (accumulator[product.category] || 0) + 1;
        return accumulator;
    }, {});

    return Object.entries(counts).sort((left, right) => right[1] - left[1])[0]?.[0] || null;
}

function mapOrderForDisplay(order) {
    const items = Array.isArray(order.items) && order.items.length > 0
        ? order.items.map(item => ({
            ...item,
            productId: item.productId || item.id,
            productName: item.productName || item.name || `Product #${item.productId || item.id}`,
            unitPrice: item.unitPrice || item.price || 0,
            lineTotal: item.lineTotal || ((item.unitPrice || item.price || 0) * (item.quantity || 0))
        }))
        : [{
            productId: order.productId,
            productName: appState.products.find(product => product.id === order.productId)?.name || `Product #${order.productId}`,
            quantity: order.quantity,
            unitPrice: (order.amount || 0) / Math.max(order.quantity || 1, 1),
            lineTotal: order.subtotalAmount || order.amount || 0
        }];

    return {
        id: order.id || order.orderId,
        orderId: order.id || order.orderId,
        customerId: order.customerId,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        phone: order.phone,
        addressLine: order.addressLine,
        city: order.city,
        zipCode: order.zipCode,
        productId: order.productId,
        quantity: order.quantity || items.reduce((sum, item) => sum + (item.quantity || 0), 0),
        amount: order.amount,
        subtotalAmount: order.subtotalAmount || items.reduce((sum, item) => sum + (item.lineTotal || 0), 0),
        shippingCost: order.shippingCost || 0,
        taxAmount: order.taxAmount || 0,
        totalAmount: order.amount || 0,
        shippingMethod: order.shippingMethod,
        promoCode: order.promoCode,
        orderNote: order.orderNote,
        trackingNumber: order.trackingNumber,
        estimatedDelivery: order.estimatedDelivery,
        status: order.status || 'PENDING',
        createdAt: order.createdAt || order.timestamp || new Date().toISOString(),
        items
    };
}

function updateOrderOverview(orders) {
    const totalOrdersEl = document.getElementById('orders-total-count');
    const totalSpendEl = document.getElementById('orders-total-spend');
    const activeTrackersEl = document.getElementById('orders-active-trackers');
    const favoriteCategoryEl = document.getElementById('orders-favorite-category');

    const spend = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const activeTrackers = orders.filter(order => ['PENDING', 'CONFIRMED', 'SHIPPED'].includes((order.status || '').toUpperCase())).length;
    const favoriteCategory = getTopCategoryFromProducts(orders.flatMap(order => order.items.map(item => ({ category: appState.products.find(product => product.id === item.productId)?.category || 'Mixed' }))));

    if (totalOrdersEl) totalOrdersEl.textContent = orders.length;
    if (totalSpendEl) totalSpendEl.textContent = formatCurrency(spend);
    if (activeTrackersEl) activeTrackersEl.textContent = activeTrackers;
    if (favoriteCategoryEl) favoriteCategoryEl.textContent = favoriteCategory || 'Mixed';
}

function toggleProfile() {
    showToast(`Signed in as ${appState.currentUser.name}`, 'info');
}

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
