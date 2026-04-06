/**
 * Tax, fee, and pricing calculation utilities.
 * @module pricing
 */

/**
 * Formats a price amount for display.
 * @param {number} amount
 * @param {string} [currency='EUR']
 * @param {string} [locale='fr-FR']
 * @returns {string} Formatted price string
 */
export function formatPrice(amount, currency = 'EUR', locale = 'fr-FR') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculates the subtotal for a list of cart items.
 * @param {Array<{ price: number, quantity: number }>} items
 * @returns {number}
 */
export function calculateSubtotal(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/**
 * Calculates the service fee based on subtotal.
 * @param {number} subtotal
 * @param {number} [feePercent=5]
 * @returns {number}
 */
export function calculateServiceFee(subtotal, feePercent = 5) {
  if (subtotal <= 0 || feePercent <= 0) return 0;
  return roundCurrency(subtotal * (feePercent / 100));
}

/**
 * Calculates tax on the subtotal + service fee.
 * @param {number} subtotal
 * @param {number} serviceFee
 * @param {number} [taxPercent=10]
 * @returns {number}
 */
export function calculateTax(subtotal, serviceFee, taxPercent = 10) {
  if (taxPercent <= 0) return 0;
  const taxable = subtotal + serviceFee;
  return roundCurrency(taxable * (taxPercent / 100));
}

/**
 * Calculates the delivery fee based on distance.
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} [baseFee=2.50]
 * @param {number} [feePerKm=0.80]
 * @param {number} [orderTotal=0] - Order total for free delivery check
 * @param {number} [freeThreshold=40] - Free delivery above this total
 * @returns {number}
 */
export function calculateDeliveryFee(distanceKm, baseFee = 2.50, feePerKm = 0.80, orderTotal = 0, freeThreshold = 40) {
  if (orderTotal >= freeThreshold) return 0;
  if (distanceKm <= 0) return 0;
  return roundCurrency(baseFee + distanceKm * feePerKm);
}

/**
 * Calculates the complete order summary.
 * @param {Array<{ price: number, quantity: number }>} items - Cart items
 * @param {Object} [options]
 * @param {number} [options.serviceFeePercent=5]
 * @param {number} [options.taxPercent=10]
 * @param {number} [options.deliveryFee=0]
 * @returns {{ subtotal: number, serviceFee: number, tax: number, deliveryFee: number, total: number }}
 */
export function calculateOrderSummary(items, options = {}) {
  const { serviceFeePercent = 5, taxPercent = 10, deliveryFee = 0 } = options;

  const subtotal = calculateSubtotal(items);
  const serviceFee = calculateServiceFee(subtotal, serviceFeePercent);
  const tax = calculateTax(subtotal, serviceFee, taxPercent);
  const total = roundCurrency(subtotal + serviceFee + tax + deliveryFee);

  return { subtotal, serviceFee, tax, deliveryFee, total };
}

/**
 * Estimates delivery time based on distance.
 * @param {number} distanceKm
 * @param {number} [baseMinutes=25]
 * @param {number} [minutesPerKm=3]
 * @returns {number} Estimated minutes
 */
export function estimateDeliveryTime(distanceKm, baseMinutes = 25, minutesPerKm = 3) {
  return Math.ceil(baseMinutes + distanceKm * minutesPerKm);
}

/**
 * Calculates distance between two coordinates using the Haversine formula.
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} Distance in kilometers
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return roundCurrency(R * c);
}

/**
 * Generates a unique order number.
 * Format: NG-YYYYMMDD-XXXX (NG = Namaste Gien)
 * @returns {string}
 */
export function generateOrderNumber() {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `NG-${datePart}-${randomPart}`;
}

/**
 * Converts degrees to radians.
 * @param {number} deg
 * @returns {number}
 */
function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Rounds a number to 2 decimal places (currency precision).
 * @param {number} amount
 * @returns {number}
 */
function roundCurrency(amount) {
  return Math.round(amount * 100) / 100;
}
