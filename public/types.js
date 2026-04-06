/**
 * @typedef {Object} MenuItem
 * @property {string} _id - Unique identifier
 * @property {string} name - Item name
 * @property {string} description - Item description
 * @property {number} price - Price in EUR
 * @property {string} category - Menu category
 * @property {string} [image] - Image URL
 * @property {number} [spiceLevel] - Spice level (0-5)
 * @property {string[]} [allergens] - Allergen identifiers
 * @property {boolean} [isVegetarian] - Vegetarian flag
 * @property {boolean} [isVegan] - Vegan flag
 * @property {boolean} [isGlutenFree] - Gluten-free flag
 * @property {boolean} [isHalal] - Halal flag
 * @property {boolean} [isAvailable] - Availability flag
 * @property {number} [sortOrder] - Display sort order
 * @property {string} [nameFr] - French name
 * @property {string} [descriptionFr] - French description
 */

/**
 * @typedef {Object} CartItem
 * @property {string} itemId - Reference to MenuItem._id
 * @property {string} name - Item display name
 * @property {number} price - Unit price
 * @property {number} quantity - Quantity ordered
 * @property {string} [instructions] - Special instructions
 */

/**
 * @typedef {Object} Order
 * @property {string} _id - Unique identifier
 * @property {string} orderNumber - Human-readable order number
 * @property {CartItem[]} items - Ordered items
 * @property {number} subtotal - Subtotal before fees
 * @property {number} serviceFee - Service fee amount
 * @property {number} deliveryFee - Delivery fee (0 for pickup/dine-in)
 * @property {number} tax - Tax amount
 * @property {number} total - Grand total
 * @property {string} status - Order status
 * @property {string} orderType - 'delivery' | 'pickup' | 'dine-in'
 * @property {string} customerName
 * @property {string} customerPhone
 * @property {string} [customerEmail]
 * @property {string} [deliveryAddress]
 * @property {string} [specialInstructions]
 * @property {string} [paymentMethod] - 'card' | 'cash' | 'online'
 * @property {number} [estimatedTime] - Minutes until ready/delivered
 * @property {Date} createdAt
 */

/**
 * @typedef {Object} Reservation
 * @property {string} _id - Unique identifier
 * @property {Date} date - Reservation date
 * @property {string} time - Time slot (HH:MM format)
 * @property {number} partySize - Number of guests
 * @property {string} customerName
 * @property {string} customerEmail
 * @property {string} customerPhone
 * @property {string} [occasion] - Occasion type
 * @property {string} status - Reservation status
 * @property {string} [notes] - Special requests
 * @property {number} [tableNumber] - Assigned table
 * @property {Date} createdAt
 */

/**
 * @typedef {Object} DeliveryZoneResult
 * @property {boolean} isInZone - Whether address is in delivery zone
 * @property {number} distanceKm - Distance from restaurant in km
 * @property {number} deliveryFee - Calculated delivery fee
 * @property {number} estimatedMinutes - Estimated delivery time in minutes
 * @property {string} [message] - Status message
 */

/**
 * @typedef {Object} TimeSlot
 * @property {string} time - Time in HH:MM format
 * @property {boolean} available - Whether slot is available
 * @property {number} remainingCapacity - Seats still available
 */

/**
 * @typedef {Object} OrderSummary
 * @property {number} subtotal
 * @property {number} serviceFee
 * @property {number} deliveryFee
 * @property {number} tax
 * @property {number} total
 */

/**
 * @typedef {Object} PricingConfig
 * @property {string} currency - Currency code
 * @property {string} locale - Locale for formatting
 * @property {number} serviceFeePercent
 * @property {number} taxPercent
 * @property {number} minimumOrder
 */
