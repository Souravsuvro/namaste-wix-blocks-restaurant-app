/**
 * Input validation utilities for the restaurant app.
 * @module validation
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[\d\s\-().]{7,20}$/;

/**
 * Validates an email address format.
 * @param {string} email
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: 'Email is required.' };
  }
  const trimmed = email.trim();
  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, message: 'Please enter a valid email address.' };
  }
  return { valid: true };
}

/**
 * Validates a phone number format.
 * @param {string} phone
 * @returns {{ valid: boolean, message?: string }}
 */
export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, message: 'Phone number is required.' };
  }
  const trimmed = phone.trim();
  if (!PHONE_REGEX.test(trimmed)) {
    return { valid: false, message: 'Please enter a valid phone number.' };
  }
  return { valid: true };
}

/**
 * Validates a customer name.
 * @param {string} name
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, message: 'Name is required.' };
  }
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { valid: false, message: 'Name must be at least 2 characters.' };
  }
  if (trimmed.length > 100) {
    return { valid: false, message: 'Name must be under 100 characters.' };
  }
  return { valid: true };
}

/**
 * Validates a delivery address.
 * @param {string} address
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateAddress(address) {
  if (!address || typeof address !== 'string') {
    return { valid: false, message: 'Delivery address is required.' };
  }
  const trimmed = address.trim();
  if (trimmed.length < 10) {
    return { valid: false, message: 'Please enter a complete address.' };
  }
  if (trimmed.length > 300) {
    return { valid: false, message: 'Address is too long.' };
  }
  return { valid: true };
}

/**
 * Validates a party size for reservations.
 * @param {number} size
 * @param {number} [max=20]
 * @returns {{ valid: boolean, message?: string }}
 */
export function validatePartySize(size, max = 20) {
  if (typeof size !== 'number' || !Number.isInteger(size)) {
    return { valid: false, message: 'Party size must be a whole number.' };
  }
  if (size < 1) {
    return { valid: false, message: 'Party size must be at least 1.' };
  }
  if (size > max) {
    return { valid: false, message: `Party size cannot exceed ${max} guests.` };
  }
  return { valid: true };
}

/**
 * Validates a reservation date (not in past, not on closed day).
 * @param {Date} date
 * @param {number[]} [closedDays=[1]] - Closed day numbers (0=Sun, 1=Mon, ..., 6=Sat)
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateReservationDate(date, closedDays = [1]) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return { valid: false, message: 'Please select a valid date.' };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) {
    return { valid: false, message: 'Cannot book a date in the past.' };
  }
  if (closedDays.includes(date.getDay())) {
    return { valid: false, message: 'The restaurant is closed on this day.' };
  }
  return { valid: true };
}

/**
 * Validates a time string in HH:MM format.
 * @param {string} time
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateTimeFormat(time) {
  if (!time || typeof time !== 'string') {
    return { valid: false, message: 'Time is required.' };
  }
  const match = time.match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    return { valid: false, message: 'Time must be in HH:MM format.' };
  }
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return { valid: false, message: 'Invalid time value.' };
  }
  return { valid: true };
}

/**
 * Validates order items array.
 * @param {Array} items
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { valid: false, message: 'Order must contain at least one item.' };
  }
  for (const item of items) {
    if (!item.itemId || !item.name || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
      return { valid: false, message: 'Each order item must have itemId, name, price, and quantity.' };
    }
    if (item.quantity < 1) {
      return { valid: false, message: 'Item quantity must be at least 1.' };
    }
    if (item.price < 0) {
      return { valid: false, message: 'Item price cannot be negative.' };
    }
  }
  return { valid: true };
}

/**
 * Validates that an order meets the minimum amount.
 * @param {number} subtotal
 * @param {number} minimum
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateMinimumOrder(subtotal, minimum) {
  if (typeof subtotal !== 'number' || subtotal < minimum) {
    return { valid: false, message: `Minimum order amount is €${minimum.toFixed(2)}.` };
  }
  return { valid: true };
}

/**
 * Sanitizes a string input to prevent injection.
 * @param {string} input
 * @returns {string}
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}
