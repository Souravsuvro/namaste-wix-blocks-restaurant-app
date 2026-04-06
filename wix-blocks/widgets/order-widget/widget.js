/**
 * Namaste GIEN - Order Widget Controller
 * Premium Indian Restaurant in Gien, France
 *
 * Full online ordering system with cart management, checkout,
 * order types (delivery/pickup/dine-in), and real-time order tracking.
 *
 * @module order-widget
 * @requires wix-data
 * @requires backend/orders-api
 */

import wixData from 'wix-data';
import { placeOrder, getOrderStatus } from 'backend/orders-api';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** @type {string[]} Available order type identifiers */
const ORDER_TYPES = ['delivery', 'pickup', 'dineIn'];

/** @type {Object<string, string>} Human-readable labels for order types */
const ORDER_TYPE_LABELS = {
  delivery: 'Delivery',
  pickup: 'Pickup',
  dineIn: 'Dine-In',
};

/** @type {string[]} Order status step identifiers in sequence */
const STATUS_STEPS = ['confirmed', 'preparing', 'ready', 'delivered'];

/** @type {Object<string, string>} Human-readable labels for status steps */
const STATUS_LABELS = {
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  delivered: 'Delivered',
};

/** @type {number} Interval in ms for polling order status after placement */
const STATUS_POLL_INTERVAL = 30000;

/** @type {string} Wix Data collection name for menu items */
const MENU_COLLECTION = 'MenuItems';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} CartItem
 * @property {string} itemId        - Unique menu item identifier
 * @property {string} name          - Display name of the item
 * @property {number} price         - Unit price in EUR
 * @property {number} quantity      - Number of units
 * @property {string} instructions  - Special instructions from customer
 */

/** @type {CartItem[]} Current cart contents */
let cart = [];

/** @type {string} Currently selected order type */
let selectedOrderType = 'delivery';

/** @type {Object|null} Widget property values from Wix Blocks editor */
let widgetProps = {};

/** @type {Intl.NumberFormat} Price formatter for EUR currency */
let priceFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
});

/** @type {number|null} Interval ID for order status polling */
let statusPollTimer = null;

/** @type {string|null} Current order reference after successful placement */
let currentOrderId = null;

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Widget entry point. Called when the widget DOM is ready.
 * Sets up event listeners, loads menu data, and applies initial properties.
 */
$w.onReady(function () {
  initializeProps();
  setupOrderTypeSelector();
  loadMenuItems();
  setupCartToggle();
  setupCheckoutForm();
});

/**
 * Responds to property changes from the Wix Blocks editor panel.
 * Rebuilds the price formatter when currency changes and re-renders
 * any affected UI sections.
 *
 * @param {Object} newProps - Updated property key-value pairs
 */
$widget.onPropsChanged((newProps) => {
  widgetProps = { ...widgetProps, ...newProps };

  // Rebuild price formatter if currency changed
  if (newProps.currency) {
    priceFormatter = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: newProps.currency,
    });
  }

  // Re-apply order type visibility
  if (
    newProps.enableDelivery !== undefined ||
    newProps.enablePickup !== undefined ||
    newProps.enableDineIn !== undefined
  ) {
    setupOrderTypeSelector();
  }

  // Re-render cart totals if fee/tax changed
  if (
    newProps.serviceFeePercent !== undefined ||
    newProps.taxPercent !== undefined ||
    newProps.minimumOrder !== undefined
  ) {
    renderCartSummary();
  }

  // Apply theme colors
  if (newProps.primaryColor || newProps.accentColor) {
    applyThemeColors(newProps.primaryColor, newProps.accentColor);
  }
});

// ---------------------------------------------------------------------------
// Property Helpers
// ---------------------------------------------------------------------------

/**
 * Reads initial widget property values and stores them in local state.
 * Also configures the price formatter based on the currency property.
 */
function initializeProps() {
  widgetProps = {
    enableDelivery: $widget.props.enableDelivery ?? true,
    enablePickup: $widget.props.enablePickup ?? true,
    enableDineIn: $widget.props.enableDineIn ?? true,
    minimumOrder: $widget.props.minimumOrder ?? 15,
    serviceFeePercent: $widget.props.serviceFeePercent ?? 5,
    taxPercent: $widget.props.taxPercent ?? 10,
    currency: $widget.props.currency ?? 'EUR',
    primaryColor: $widget.props.primaryColor ?? '#1B3A6B',
    accentColor: $widget.props.accentColor ?? '#E8731A',
  };

  priceFormatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: widgetProps.currency,
  });

  applyThemeColors(widgetProps.primaryColor, widgetProps.accentColor);
}

/**
 * Applies primary and accent brand colors as CSS custom properties
 * on the widget root element.
 *
 * @param {string} [primary] - Primary color hex value
 * @param {string} [accent]  - Accent color hex value
 */
function applyThemeColors(primary, accent) {
  try {
    const root = $w('#orderContainer');
    if (primary) {
      root.style.setProperty('--color-primary', primary);
    }
    if (accent) {
      root.style.setProperty('--color-accent', accent);
    }
  } catch (err) {
    console.warn('Order Widget: Could not apply theme colors.', err);
  }
}

// ---------------------------------------------------------------------------
// Order Type Selector
// ---------------------------------------------------------------------------

/**
 * Configures the delivery/pickup/dine-in toggle buttons.
 * Hides buttons for disabled order types and selects the first
 * available type as default.
 */
function setupOrderTypeSelector() {
  const enableFlags = {
    delivery: widgetProps.enableDelivery,
    pickup: widgetProps.enablePickup,
    dineIn: widgetProps.enableDineIn,
  };

  ORDER_TYPES.forEach((type) => {
    const btn = $w(`#orderType_${type}`);
    if (!btn) return;

    if (enableFlags[type]) {
      btn.show();
      btn.onClick(() => selectOrderType(type));
    } else {
      btn.hide();
    }
  });

  // Auto-select the first enabled type
  const firstEnabled = ORDER_TYPES.find((t) => enableFlags[t]);
  if (firstEnabled) {
    selectOrderType(firstEnabled);
  }
}

/**
 * Sets the active order type, updates button styling, and toggles
 * the delivery address field visibility in the checkout form.
 *
 * @param {string} type - One of 'delivery', 'pickup', or 'dineIn'
 */
function selectOrderType(type) {
  selectedOrderType = type;

  // Update active button styling
  ORDER_TYPES.forEach((t) => {
    const btn = $w(`#orderType_${t}`);
    if (!btn) return;

    if (t === type) {
      btn.addClass('order-type-selector__btn--active');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.removeClass('order-type-selector__btn--active');
      btn.setAttribute('aria-pressed', 'false');
    }
  });

  // Show/hide delivery address field
  const addressField = $w('#deliveryAddressField');
  if (addressField) {
    if (type === 'delivery') {
      addressField.show();
    } else {
      addressField.hide();
    }
  }
}

// ---------------------------------------------------------------------------
// Menu Loading
// ---------------------------------------------------------------------------

/**
 * Fetches menu items from the Wix Data collection and renders them
 * grouped by category. Shows a loading indicator during fetch and
 * displays an empty state if no items are found.
 */
async function loadMenuItems() {
  showLoading(true);

  try {
    const results = await wixData
      .query(MENU_COLLECTION)
      .ascending('category')
      .ascending('sortOrder')
      .find();

    if (results.items.length === 0) {
      showEmptyMenu();
      return;
    }

    renderMenuItems(results.items);
  } catch (err) {
    console.error('Order Widget: Failed to load menu items.', err);
    showEmptyMenu('Unable to load the menu. Please try again later.');
  } finally {
    showLoading(false);
  }
}

/**
 * Renders menu items into their respective category sections
 * using a repeater or dynamic container.
 *
 * @param {Object[]} items - Array of menu item records from Wix Data
 */
function renderMenuItems(items) {
  const menuContainer = $w('#menuContainer');
  if (!menuContainer) return;

  // Group items by category
  const categories = {};
  items.forEach((item) => {
    const cat = item.category || 'Other';
    if (!categories[cat]) {
      categories[cat] = [];
    }
    categories[cat].push(item);
  });

  // Build repeater data
  const repeaterData = [];
  Object.keys(categories).forEach((category) => {
    categories[category].forEach((item) => {
      repeaterData.push({
        _id: item._id,
        name: item.title || item.name,
        description: item.description || '',
        price: item.price || 0,
        image: item.image || '',
        category: category,
        isVegetarian: item.isVegetarian || false,
        isSpicy: item.isSpicy || false,
      });
    });
  });

  const repeater = $w('#menuRepeater');
  if (repeater) {
    repeater.data = repeaterData;
    repeater.onItemReady(($item, itemData) => {
      $item('#itemName').text = itemData.name;
      $item('#itemDescription').text = itemData.description;
      $item('#itemPrice').text = formatPrice(itemData.price);

      if (itemData.image) {
        $item('#itemImage').src = itemData.image;
      }

      // Add-to-cart button
      $item('#addToCartBtn').onClick(() => {
        addToCart(itemData._id, itemData.name, itemData.price);
      });
    });
  }
}

// ---------------------------------------------------------------------------
// Cart Management
// ---------------------------------------------------------------------------

/**
 * Adds an item to the cart. If the item already exists, increments its
 * quantity by one. Otherwise, creates a new cart entry.
 * Fires the 'cartUpdated' custom event.
 *
 * @param {string} itemId - Unique menu item identifier
 * @param {string} name   - Display name of the item
 * @param {number} price  - Unit price in EUR
 */
function addToCart(itemId, name, price) {
  const existing = cart.find((item) => item.itemId === itemId);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      itemId,
      name,
      price,
      quantity: 1,
      instructions: '',
    });
  }

  onCartChanged();
}

/**
 * Removes an item entirely from the cart by its item ID.
 * Fires the 'cartUpdated' custom event.
 *
 * @param {string} itemId - Unique menu item identifier
 */
function removeFromCart(itemId) {
  cart = cart.filter((item) => item.itemId !== itemId);
  onCartChanged();
}

/**
 * Updates the quantity of a specific cart item. If the new quantity
 * is zero or less, the item is removed from the cart.
 *
 * @param {string} itemId      - Unique menu item identifier
 * @param {number} newQuantity - Desired quantity (minimum 0)
 */
function updateQuantity(itemId, newQuantity) {
  if (newQuantity <= 0) {
    removeFromCart(itemId);
    return;
  }

  const item = cart.find((i) => i.itemId === itemId);
  if (item) {
    item.quantity = newQuantity;
    onCartChanged();
  }
}

/**
 * Updates the special instructions for a cart item.
 *
 * @param {string} itemId       - Unique menu item identifier
 * @param {string} instructions - Customer's special instructions text
 */
function updateInstructions(itemId, instructions) {
  const item = cart.find((i) => i.itemId === itemId);
  if (item) {
    item.instructions = instructions;
  }
}

/**
 * Central handler called whenever the cart contents change.
 * Re-renders the cart UI, updates the badge count, validates the
 * minimum order, and fires the custom 'cartUpdated' event.
 */
function onCartChanged() {
  renderCart();
  renderCartSummary();
  updateCartBadge();
  validateMinimumOrder();

  // Fire custom event
  $widget.fireEvent('cartUpdated', {
    items: [...cart],
    itemCount: getTotalItemCount(),
    subtotal: calculateSubtotal(),
  });
}

// ---------------------------------------------------------------------------
// Cart Rendering
// ---------------------------------------------------------------------------

/**
 * Renders the cart items list inside the sidebar. Shows the empty
 * cart state when the cart is empty.
 */
function renderCart() {
  const cartContainer = $w('#cartItemsContainer');
  const cartEmpty = $w('#cartEmpty');
  const cartContent = $w('#cartContent');

  if (cart.length === 0) {
    if (cartEmpty) cartEmpty.show();
    if (cartContent) cartContent.hide();
    return;
  }

  if (cartEmpty) cartEmpty.hide();
  if (cartContent) cartContent.show();

  // Render cart items via repeater
  const cartRepeater = $w('#cartRepeater');
  if (cartRepeater) {
    cartRepeater.data = cart.map((item) => ({
      _id: item.itemId,
      ...item,
    }));

    cartRepeater.onItemReady(($item, itemData) => {
      $item('#cartItemName').text = itemData.name;
      $item('#cartItemPrice').text = formatPrice(itemData.price * itemData.quantity);
      $item('#cartItemQuantity').text = String(itemData.quantity);

      if (itemData.instructions) {
        $item('#cartItemInstructions').text = itemData.instructions;
        $item('#cartItemInstructions').show();
      } else {
        $item('#cartItemInstructions').hide();
      }

      // Quantity controls
      $item('#cartMinusBtn').onClick(() => {
        updateQuantity(itemData.itemId, itemData.quantity - 1);
      });

      $item('#cartPlusBtn').onClick(() => {
        updateQuantity(itemData.itemId, itemData.quantity + 1);
      });

      // Remove button
      $item('#cartRemoveBtn').onClick(() => {
        removeFromCart(itemData.itemId);
      });
    });
  }
}

/**
 * Renders the cart summary section: subtotal, service fee, tax, and total.
 */
function renderCartSummary() {
  const subtotal = calculateSubtotal();
  const serviceFee = calculateServiceFee(subtotal);
  const tax = calculateTax(subtotal);
  const total = subtotal + serviceFee + tax;

  setTextSafe('#summarySubtotal', formatPrice(subtotal));
  setTextSafe('#summaryServiceFee', formatPrice(serviceFee));
  setTextSafe('#summaryTax', formatPrice(tax));
  setTextSafe('#summaryTotal', formatPrice(total));

  // Update checkout button state
  const submitBtn = $w('#checkoutSubmitBtn');
  if (submitBtn) {
    submitBtn.enabled = cart.length > 0 && !isBelowMinimumOrder();
  }
}

/**
 * Updates the cart badge count shown on the floating cart toggle button.
 */
function updateCartBadge() {
  const count = getTotalItemCount();
  setTextSafe('#cartBadge', String(count));

  const toggle = $w('#cartToggleBtn');
  if (toggle) {
    if (count > 0) {
      toggle.show();
    } else {
      toggle.hide();
    }
  }
}

// ---------------------------------------------------------------------------
// Cart Sidebar Toggle
// ---------------------------------------------------------------------------

/**
 * Sets up the floating cart button and close button for the sidebar.
 */
function setupCartToggle() {
  const toggleBtn = $w('#cartToggleBtn');
  if (toggleBtn) {
    toggleBtn.onClick(() => openCartSidebar());
  }

  const closeBtn = $w('#cartCloseBtn');
  if (closeBtn) {
    closeBtn.onClick(() => closeCartSidebar());
  }
}

/**
 * Opens the cart sidebar panel by adding the open state class.
 */
function openCartSidebar() {
  const sidebar = $w('#cartSidebar');
  if (sidebar) {
    sidebar.show('slide', { direction: 'right', duration: 250 });
  }

  const container = $w('#orderContainer');
  if (container) {
    container.addClass('order-container--cart-open');
  }
}

/**
 * Closes the cart sidebar panel.
 */
function closeCartSidebar() {
  const sidebar = $w('#cartSidebar');
  if (sidebar) {
    sidebar.hide('slide', { direction: 'right', duration: 250 });
  }

  const container = $w('#orderContainer');
  if (container) {
    container.removeClass('order-container--cart-open');
  }
}

// ---------------------------------------------------------------------------
// Calculations
// ---------------------------------------------------------------------------

/**
 * Calculates the cart subtotal (sum of price * quantity for all items).
 *
 * @returns {number} Subtotal in EUR
 */
function calculateSubtotal() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/**
 * Calculates the service fee based on the subtotal.
 *
 * @param {number} subtotal - Cart subtotal in EUR
 * @returns {number} Service fee amount
 */
function calculateServiceFee(subtotal) {
  const percent = widgetProps.serviceFeePercent ?? 5;
  return subtotal * (percent / 100);
}

/**
 * Calculates the tax amount based on the subtotal.
 *
 * @param {number} subtotal - Cart subtotal in EUR
 * @returns {number} Tax amount
 */
function calculateTax(subtotal) {
  const percent = widgetProps.taxPercent ?? 10;
  return subtotal * (percent / 100);
}

/**
 * Returns the total number of items in the cart (sum of all quantities).
 *
 * @returns {number} Total item count
 */
function getTotalItemCount() {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Calculates the full order total including subtotal, service fee, and tax.
 *
 * @returns {number} Grand total in EUR
 */
function calculateTotal() {
  const subtotal = calculateSubtotal();
  return subtotal + calculateServiceFee(subtotal) + calculateTax(subtotal);
}

// ---------------------------------------------------------------------------
// Minimum Order Validation
// ---------------------------------------------------------------------------

/**
 * Checks whether the current cart subtotal is below the minimum order amount.
 *
 * @returns {boolean} True if below minimum order threshold
 */
function isBelowMinimumOrder() {
  const minimum = widgetProps.minimumOrder ?? 15;
  return calculateSubtotal() < minimum && cart.length > 0;
}

/**
 * Shows or hides the minimum order warning message based on the
 * current cart subtotal compared to the configured minimum.
 */
function validateMinimumOrder() {
  const warning = $w('#minimumOrderWarning');
  if (!warning) return;

  if (isBelowMinimumOrder()) {
    const minimum = widgetProps.minimumOrder ?? 15;
    setTextSafe(
      '#minimumOrderText',
      `Minimum order amount is ${formatPrice(minimum)}. Please add more items.`
    );
    warning.show();
  } else {
    warning.hide();
  }
}

// ---------------------------------------------------------------------------
// Checkout Form
// ---------------------------------------------------------------------------

/**
 * Sets up the checkout form submit handler and field validation listeners.
 */
function setupCheckoutForm() {
  const form = $w('#checkoutForm');
  if (!form) return;

  const submitBtn = $w('#checkoutSubmitBtn');
  if (submitBtn) {
    submitBtn.onClick(() => handleCheckout());
  }

  // Real-time validation on blur
  const requiredFields = ['#customerName', '#customerPhone'];
  requiredFields.forEach((selector) => {
    const field = $w(selector);
    if (field) {
      field.onBlur(() => validateField(selector));
    }
  });
}

/**
 * Validates a single form field and shows/hides its error message.
 *
 * @param {string} selector - Wix element selector (e.g. '#customerName')
 * @returns {boolean} True if the field is valid
 */
function validateField(selector) {
  const field = $w(selector);
  if (!field) return true;

  const value = (field.value || '').trim();
  const errorEl = $w(`${selector}Error`);
  let isValid = true;

  if (!value) {
    isValid = false;
    if (errorEl) {
      errorEl.text = 'This field is required.';
      errorEl.show();
    }
  } else {
    if (errorEl) {
      errorEl.hide();
    }
  }

  // Phone format validation
  if (selector === '#customerPhone' && value) {
    const phoneRegex = /^[+]?[\d\s\-().]{7,20}$/;
    if (!phoneRegex.test(value)) {
      isValid = false;
      if (errorEl) {
        errorEl.text = 'Please enter a valid phone number.';
        errorEl.show();
      }
    }
  }

  return isValid;
}

/**
 * Validates the entire checkout form. Name and phone are always required;
 * address is required only for delivery orders.
 *
 * @returns {boolean} True if all required fields are valid
 */
function validateCheckoutForm() {
  let isValid = true;

  // Always required
  if (!validateField('#customerName')) isValid = false;
  if (!validateField('#customerPhone')) isValid = false;

  // Address required for delivery
  if (selectedOrderType === 'delivery') {
    if (!validateField('#customerAddress')) isValid = false;
  }

  return isValid;
}

// ---------------------------------------------------------------------------
// Checkout / Order Submission
// ---------------------------------------------------------------------------

/**
 * Handles the checkout process: validates the form, validates the minimum
 * order, submits the order via the backend API, displays the confirmation
 * screen, and starts status polling.
 */
async function handleCheckout() {
  // Validate minimum order
  if (isBelowMinimumOrder()) {
    validateMinimumOrder();
    return;
  }

  // Validate form
  if (!validateCheckoutForm()) {
    return;
  }

  // Fire checkout started event
  $widget.fireEvent('checkoutStarted', {
    orderType: selectedOrderType,
    items: [...cart],
    total: calculateTotal(),
  });

  const submitBtn = $w('#checkoutSubmitBtn');

  try {
    // Show loading state
    if (submitBtn) {
      submitBtn.disable();
      submitBtn.label = 'Placing Order...';
    }

    // Gather order data
    const orderData = buildOrderPayload();

    // Submit to backend
    const result = await placeOrder(orderData);

    if (result && result.orderId) {
      currentOrderId = result.orderId;

      // Fire order placed event
      $widget.fireEvent('orderPlaced', {
        orderId: result.orderId,
        referenceNumber: result.referenceNumber || result.orderId,
        orderType: selectedOrderType,
        total: calculateTotal(),
      });

      // Show confirmation
      showOrderConfirmation(result.referenceNumber || result.orderId);

      // Clear cart
      cart = [];
      onCartChanged();
      closeCartSidebar();

      // Start polling for status updates
      startStatusPolling(result.orderId);
    } else {
      throw new Error('Invalid order response from server.');
    }
  } catch (err) {
    console.error('Order Widget: Failed to place order.', err);
    showOrderError('We could not place your order. Please try again or contact us directly.');
  } finally {
    if (submitBtn) {
      submitBtn.enable();
      submitBtn.label = 'Place Order';
    }
  }
}

/**
 * Builds the order payload object from current state for the backend API.
 *
 * @returns {Object} Complete order data ready for submission
 */
function buildOrderPayload() {
  const subtotal = calculateSubtotal();
  const serviceFee = calculateServiceFee(subtotal);
  const tax = calculateTax(subtotal);

  return {
    orderType: selectedOrderType,
    items: cart.map((item) => ({
      itemId: item.itemId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      instructions: item.instructions || '',
      lineTotal: item.price * item.quantity,
    })),
    customer: {
      name: ($w('#customerName').value || '').trim(),
      phone: ($w('#customerPhone').value || '').trim(),
      email: ($w('#customerEmail').value || '').trim(),
      address:
        selectedOrderType === 'delivery'
          ? ($w('#customerAddress').value || '').trim()
          : '',
    },
    notes: ($w('#orderNotes').value || '').trim(),
    subtotal,
    serviceFee,
    tax,
    total: subtotal + serviceFee + tax,
    currency: widgetProps.currency || 'EUR',
  };
}

// ---------------------------------------------------------------------------
// Order Confirmation
// ---------------------------------------------------------------------------

/**
 * Displays the order confirmation screen with the reference number
 * and hides the menu/checkout views.
 *
 * @param {string} referenceNumber - Order reference or ID to display
 */
function showOrderConfirmation(referenceNumber) {
  // Hide menu and checkout sections
  hideElement('#menuContainer');
  hideElement('#checkoutForm');
  hideElement('#orderTypeSelector');

  // Show confirmation section
  const confirmation = $w('#orderConfirmation');
  if (confirmation) {
    confirmation.show();
  }

  setTextSafe('#confirmationReference', referenceNumber);
  setTextSafe(
    '#confirmationMessage',
    getConfirmationMessage(selectedOrderType)
  );
}

/**
 * Returns the appropriate confirmation message based on the order type.
 *
 * @param {string} orderType - The selected order type
 * @returns {string} Confirmation message text
 */
function getConfirmationMessage(orderType) {
  switch (orderType) {
    case 'delivery':
      return 'Your order is being prepared and will be delivered to your address. We will keep you updated on the status.';
    case 'pickup':
      return 'Your order is being prepared. We will notify you when it is ready for pickup at the restaurant.';
    case 'dineIn':
      return 'Your order has been sent to the kitchen. Our team will serve your dishes at your table.';
    default:
      return 'Your order has been placed successfully. Thank you for choosing Namaste GIEN!';
  }
}

/**
 * Shows an error message to the user when order placement fails.
 *
 * @param {string} message - Error message to display
 */
function showOrderError(message) {
  const errorEl = $w('#orderError');
  if (errorEl) {
    errorEl.text = message;
    errorEl.show();

    // Auto-hide after 8 seconds
    setTimeout(() => {
      errorEl.hide();
    }, 8000);
  }
}

// ---------------------------------------------------------------------------
// Order Status Polling
// ---------------------------------------------------------------------------

/**
 * Starts polling the backend for order status updates at the configured
 * interval (every 30 seconds). Stops automatically when the order
 * reaches a terminal state (delivered or cancelled).
 *
 * @param {string} orderId - The order ID to track
 */
function startStatusPolling(orderId) {
  // Clear any existing timer
  stopStatusPolling();

  // Immediate first check
  pollOrderStatus(orderId);

  // Set up recurring poll
  statusPollTimer = setInterval(() => {
    pollOrderStatus(orderId);
  }, STATUS_POLL_INTERVAL);
}

/**
 * Stops the order status polling interval.
 */
function stopStatusPolling() {
  if (statusPollTimer) {
    clearInterval(statusPollTimer);
    statusPollTimer = null;
  }
}

/**
 * Fetches the latest order status from the backend and updates
 * the status tracker UI. Stops polling if the order has reached
 * a terminal state.
 *
 * @param {string} orderId - The order ID to check
 */
async function pollOrderStatus(orderId) {
  try {
    const status = await getOrderStatus(orderId);

    if (status && status.currentStep) {
      renderOrderStatus(status.currentStep, status.updatedAt);

      // Stop polling on terminal states
      if (status.currentStep === 'delivered' || status.currentStep === 'cancelled') {
        stopStatusPolling();
      }
    }
  } catch (err) {
    console.warn('Order Widget: Failed to fetch order status.', err);
    // Continue polling on transient errors
  }
}

/**
 * Renders the order status tracker with step indicators showing
 * completed, active, and pending states.
 *
 * @param {string} currentStep  - Current status step identifier
 * @param {string} [updatedAt]  - ISO timestamp of the last update
 */
function renderOrderStatus(currentStep, updatedAt) {
  const currentIndex = STATUS_STEPS.indexOf(currentStep);

  STATUS_STEPS.forEach((step, index) => {
    const stepEl = $w(`#statusStep_${step}`);
    if (!stepEl) return;

    // Remove existing state classes
    stepEl.removeClass('order-status__step--completed');
    stepEl.removeClass('order-status__step--active');

    if (index < currentIndex) {
      stepEl.addClass('order-status__step--completed');
    } else if (index === currentIndex) {
      stepEl.addClass('order-status__step--active');
    }
  });

  // Update time display
  if (updatedAt) {
    const timeStr = new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(updatedAt));
    setTextSafe('#statusTime', timeStr);
  }
}

// ---------------------------------------------------------------------------
// UI Helpers
// ---------------------------------------------------------------------------

/**
 * Formats a numeric price using the configured Intl.NumberFormat instance.
 *
 * @param {number} amount - Price amount to format
 * @returns {string} Formatted price string (e.g. "12,50 EUR")
 */
function formatPrice(amount) {
  try {
    return priceFormatter.format(amount);
  } catch (err) {
    return `${amount.toFixed(2)} EUR`;
  }
}

/**
 * Safely sets the text property of a Wix element, catching errors
 * if the element does not exist.
 *
 * @param {string} selector - Wix element selector
 * @param {string} text     - Text to set
 */
function setTextSafe(selector, text) {
  try {
    const el = $w(selector);
    if (el) {
      el.text = text;
    }
  } catch (err) {
    // Element not found or not a text element; fail silently
  }
}

/**
 * Safely hides a Wix element by selector.
 *
 * @param {string} selector - Wix element selector
 */
function hideElement(selector) {
  try {
    const el = $w(selector);
    if (el) {
      el.hide();
    }
  } catch (err) {
    // Element not found; fail silently
  }
}

/**
 * Safely shows a Wix element by selector.
 *
 * @param {string} selector - Wix element selector
 */
function showElement(selector) {
  try {
    const el = $w(selector);
    if (el) {
      el.show();
    }
  } catch (err) {
    // Element not found; fail silently
  }
}

/**
 * Shows or hides the global loading indicator.
 *
 * @param {boolean} isLoading - True to show, false to hide
 */
function showLoading(isLoading) {
  const loader = $w('#orderLoading');
  const content = $w('#menuContainer');

  if (isLoading) {
    if (loader) loader.show();
    if (content) content.hide();
  } else {
    if (loader) loader.hide();
    if (content) content.show();
  }
}

/**
 * Displays the empty menu state with an optional custom message.
 *
 * @param {string} [message] - Custom message to display
 */
function showEmptyMenu(message) {
  const emptyState = $w('#orderEmpty');
  if (emptyState) {
    emptyState.show();
  }

  if (message) {
    setTextSafe('#orderEmptyMessage', message);
  }

  hideElement('#menuContainer');
}
