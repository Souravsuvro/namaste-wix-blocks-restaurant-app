/**
 * Order processing backend API — Velo Web Module.
 * @module orders-api
 */
import wixData from 'wix-data';
import { validateOrderItems, validateName, validatePhone, validateAddress, validateMinimumOrder, sanitizeString } from './utils/validation';
import { calculateOrderSummary, generateOrderNumber } from './utils/pricing';
import { sendOrderConfirmation, notifyKitchen } from './notifications';

const COLLECTION = 'orders';

/**
 * Places a new order.
 * @param {Object} orderData
 * @param {Array} orderData.items - Cart items
 * @param {string} orderData.orderType - 'delivery' | 'pickup' | 'dine-in'
 * @param {string} orderData.customerName
 * @param {string} orderData.customerPhone
 * @param {string} [orderData.customerEmail]
 * @param {string} [orderData.deliveryAddress] - Required for delivery
 * @param {string} [orderData.specialInstructions]
 * @param {string} [orderData.paymentMethod]
 * @param {Object} [pricingOptions]
 * @returns {Promise<Object>} Created order with order number
 */
export async function placeOrder(orderData, pricingOptions = {}) {
  // Validate items
  const itemsCheck = validateOrderItems(orderData.items);
  if (!itemsCheck.valid) throw new Error(itemsCheck.message);

  // Validate customer info
  const nameCheck = validateName(orderData.customerName);
  if (!nameCheck.valid) throw new Error(nameCheck.message);

  const phoneCheck = validatePhone(orderData.customerPhone);
  if (!phoneCheck.valid) throw new Error(phoneCheck.message);

  // Validate delivery address if delivery order
  if (orderData.orderType === 'delivery') {
    const addrCheck = validateAddress(orderData.deliveryAddress);
    if (!addrCheck.valid) throw new Error(addrCheck.message);
  }

  // Calculate pricing
  const summary = calculateOrderSummary(orderData.items, {
    serviceFeePercent: pricingOptions.serviceFeePercent || 5,
    taxPercent: pricingOptions.taxPercent || 10,
    deliveryFee: pricingOptions.deliveryFee || 0,
  });

  // Validate minimum order
  const minCheck = validateMinimumOrder(summary.subtotal, pricingOptions.minimumOrder || 15);
  if (!minCheck.valid) throw new Error(minCheck.message);

  const order = {
    orderNumber: generateOrderNumber(),
    items: JSON.stringify(orderData.items),
    subtotal: summary.subtotal,
    serviceFee: summary.serviceFee,
    deliveryFee: summary.deliveryFee,
    tax: summary.tax,
    total: summary.total,
    status: 'new',
    orderType: orderData.orderType,
    customerName: sanitizeString(orderData.customerName),
    customerPhone: sanitizeString(orderData.customerPhone),
    customerEmail: sanitizeString(orderData.customerEmail || ''),
    deliveryAddress: sanitizeString(orderData.deliveryAddress || ''),
    specialInstructions: sanitizeString(orderData.specialInstructions || ''),
    paymentMethod: orderData.paymentMethod || 'card',
    estimatedTime: orderData.orderType === 'delivery' ? 45 : 25,
    createdAt: new Date(),
  };

  const result = await wixData.insert(COLLECTION, order);

  // Send notifications (non-blocking)
  sendOrderConfirmation(result).catch(console.error);
  notifyKitchen(result).catch(console.error);

  return result;
}

/**
 * Retrieves an order by order number.
 * @param {string} orderNumber
 * @returns {Promise<Object>}
 */
export async function getOrder(orderNumber) {
  const result = await wixData.query(COLLECTION)
    .eq('orderNumber', orderNumber)
    .find();

  if (result.items.length === 0) {
    throw new Error('Order not found.');
  }

  const order = result.items[0];
  order.items = JSON.parse(order.items);
  return order;
}

/**
 * Retrieves the current status of an order.
 * @param {string} orderNumber
 * @returns {Promise<{ status: string, estimatedTime: number }>}
 */
export async function getOrderStatus(orderNumber) {
  const order = await getOrder(orderNumber);
  return {
    status: order.status,
    estimatedTime: order.estimatedTime,
    orderType: order.orderType,
  };
}

/**
 * Updates the status of an order. Admin only.
 * @param {string} orderId - The _id of the order
 * @param {string} newStatus
 * @param {number} [estimatedTime]
 * @returns {Promise<Object>}
 */
export async function updateOrderStatus(orderId, newStatus, estimatedTime) {
  const order = await wixData.get(COLLECTION, orderId);
  if (!order) throw new Error('Order not found.');

  const validTransitions = {
    'new': ['confirmed', 'cancelled'],
    'confirmed': ['preparing', 'cancelled'],
    'preparing': ['ready', 'cancelled'],
    'ready': ['out-for-delivery', 'picked-up', 'delivered'],
    'out-for-delivery': ['delivered'],
  };

  const allowed = validTransitions[order.status];
  if (allowed && !allowed.includes(newStatus)) {
    throw new Error(`Cannot transition from "${order.status}" to "${newStatus}".`);
  }

  order.status = newStatus;
  if (estimatedTime !== undefined) {
    order.estimatedTime = estimatedTime;
  }

  return wixData.update(COLLECTION, order);
}

/**
 * Retrieves orders filtered by status.
 * @param {string} [status] - Filter by status
 * @param {number} [limit=50]
 * @param {number} [skip=0]
 * @returns {Promise<{ items: Array, totalCount: number }>}
 */
export async function getOrders(status, limit = 50, skip = 0) {
  let query = wixData.query(COLLECTION)
    .descending('createdAt')
    .limit(limit)
    .skip(skip);

  if (status) {
    query = query.eq('status', status);
  }

  const result = await query.find();
  const items = result.items.map(order => ({
    ...order,
    items: JSON.parse(order.items),
  }));

  return { items, totalCount: result.totalCount };
}

/**
 * Gets today's orders for the kitchen dashboard.
 * @returns {Promise<Array>}
 */
export async function getTodaysOrders() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const result = await wixData.query(COLLECTION)
    .ge('createdAt', startOfDay)
    .descending('createdAt')
    .find();

  return result.items.map(order => ({
    ...order,
    items: JSON.parse(order.items),
  }));
}

/**
 * Cancels an order if it's in a cancellable state.
 * @param {string} orderId
 * @returns {Promise<Object>}
 */
export async function cancelOrder(orderId) {
  const order = await wixData.get(COLLECTION, orderId);
  if (!order) throw new Error('Order not found.');

  const cancellable = ['new', 'confirmed'];
  if (!cancellable.includes(order.status)) {
    throw new Error('This order can no longer be cancelled.');
  }

  order.status = 'cancelled';
  return wixData.update(COLLECTION, order);
}
