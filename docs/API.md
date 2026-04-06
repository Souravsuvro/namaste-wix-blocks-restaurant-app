# Backend API Documentation

All backend APIs are implemented as Velo Web Modules in the `backend/` directory. They use `wix-data` for database operations and `wix-crm` for notifications.

---

## Menu API (`backend/menu-api.js`)

### getMenuItems(category?, filters?)

Retrieves available menu items with optional category and dietary filters.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| category | string | No | Filter by category name |
| filters | object | No | Dietary filter flags |
| filters.isVegetarian | boolean | No | Filter vegetarian items |
| filters.isVegan | boolean | No | Filter vegan items |
| filters.isGlutenFree | boolean | No | Filter gluten-free items |
| filters.isHalal | boolean | No | Filter halal items |

**Returns:** `Promise<Array<MenuItem>>`

```javascript
import { getMenuItems } from 'backend/menu-api';

// All items
const items = await getMenuItems();

// Vegetarian items in Plats Principaux
const vegItems = await getMenuItems('Plats Principaux', { isVegetarian: true });
```

### getMenuItem(itemId)

Retrieves a single menu item by ID.

| Parameter | Type | Required |
|-----------|------|----------|
| itemId | string | Yes |

**Returns:** `Promise<MenuItem>`

### createMenuItem(itemData)

Creates a new menu item. Admin context required.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| itemData.name | string | Yes | Item name |
| itemData.price | number | Yes | Price in EUR |
| itemData.category | string | Yes | Category name |
| itemData.description | string | No | Description |
| itemData.image | string | No | Image URL |
| itemData.spiceLevel | number | No | 0-5 |
| itemData.allergens | string[] | No | Allergen identifiers |
| itemData.isVegetarian | boolean | No | Default: false |
| itemData.isVegan | boolean | No | Default: false |
| itemData.isGlutenFree | boolean | No | Default: false |
| itemData.isHalal | boolean | No | Default: false |
| itemData.isAvailable | boolean | No | Default: true |
| itemData.sortOrder | number | No | Default: 0 |

**Returns:** `Promise<MenuItem>`

### updateMenuItem(itemId, updates)

Updates an existing menu item. Admin context required.

**Returns:** `Promise<MenuItem>`

### deleteMenuItem(itemId)

Removes a menu item. Admin context required.

**Returns:** `Promise<void>`

### getCategories()

Returns all distinct categories from available menu items.

**Returns:** `Promise<string[]>`

### setItemAvailability(itemId, isAvailable)

Toggles an item's availability.

**Returns:** `Promise<MenuItem>`

### updateSortOrder(items)

Bulk updates display order for menu items.

| Parameter | Type | Description |
|-----------|------|-------------|
| items | Array<{id, sortOrder}> | Items with new sort positions |

**Returns:** `Promise<void>`

---

## Orders API (`backend/orders-api.js`)

### placeOrder(orderData, pricingOptions?)

Places a new order with validation, pricing calculation, and notifications.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| orderData.items | CartItem[] | Yes | Cart items array |
| orderData.orderType | string | Yes | 'delivery', 'pickup', 'dine-in' |
| orderData.customerName | string | Yes | Customer name |
| orderData.customerPhone | string | Yes | Phone number |
| orderData.customerEmail | string | No | Email for notifications |
| orderData.deliveryAddress | string | Delivery only | Delivery address |
| orderData.specialInstructions | string | No | Special notes |
| orderData.paymentMethod | string | No | 'card', 'cash', 'online' |
| pricingOptions.serviceFeePercent | number | No | Default: 5 |
| pricingOptions.taxPercent | number | No | Default: 10 |
| pricingOptions.deliveryFee | number | No | Default: 0 |
| pricingOptions.minimumOrder | number | No | Default: 15 |

**Returns:** `Promise<Order>` (with generated orderNumber)

```javascript
import { placeOrder } from 'backend/orders-api';

const order = await placeOrder({
  items: [{ itemId: '1', name: 'Butter Chicken', price: 18, quantity: 2 }],
  orderType: 'delivery',
  customerName: 'Jean Dupont',
  customerPhone: '+33 2 38 12 34 56',
  customerEmail: 'jean@example.com',
  deliveryAddress: '5 Rue de Paris, 45500 Gien',
}, { deliveryFee: 4.90 });
```

### getOrder(orderNumber)

Retrieves an order by its human-readable order number.

**Returns:** `Promise<Order>`

### getOrderStatus(orderNumber)

Gets the current status and estimated time for an order.

**Returns:** `Promise<{ status, estimatedTime, orderType }>`

### updateOrderStatus(orderId, newStatus, estimatedTime?)

Updates order status with transition validation. Admin only.

Valid transitions:
- `new` -> `confirmed`, `cancelled`
- `confirmed` -> `preparing`, `cancelled`
- `preparing` -> `ready`, `cancelled`
- `ready` -> `out-for-delivery`, `picked-up`, `delivered`
- `out-for-delivery` -> `delivered`

**Returns:** `Promise<Order>`

### getOrders(status?, limit?, skip?)

Lists orders with optional status filter and pagination.

**Returns:** `Promise<{ items: Order[], totalCount: number }>`

### getTodaysOrders()

Returns all orders from today. Dashboard use.

**Returns:** `Promise<Order[]>`

### cancelOrder(orderId)

Cancels an order if in a cancellable state (`new` or `confirmed`).

**Returns:** `Promise<Order>`

---

## Reservations API (`backend/reservations-api.js`)

### bookReservation(data, maxCapacity?)

Books a reservation with validation and double-booking prevention.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| data.date | string | Yes | ISO date string |
| data.time | string | Yes | HH:MM format |
| data.partySize | number | Yes | 1-20 |
| data.customerName | string | Yes | Guest name |
| data.customerEmail | string | Yes | Email address |
| data.customerPhone | string | Yes | Phone number |
| data.occasion | string | No | Occasion type |
| data.notes | string | No | Special requests |
| maxCapacity | number | No | Default: 60 |

**Returns:** `Promise<Reservation>`

```javascript
import { bookReservation } from 'backend/reservations-api';

const reservation = await bookReservation({
  date: '2026-04-12',
  time: '19:30',
  partySize: 4,
  customerName: 'Marie Laurent',
  customerEmail: 'marie@example.com',
  customerPhone: '+33 6 12 34 56 78',
  occasion: 'birthday',
  notes: 'Window table, please',
});
```

### joinWaitlist(data)

Adds a reservation to the waitlist for a fully booked slot.

**Returns:** `Promise<Reservation>` (with status: 'waitlisted')

### getAvailableSlots(dateStr, maxCapacity?)

Returns all time slots for a date with availability information.

**Returns:** `Promise<Array<{ time, available, remainingCapacity }>>`

### getReservation(reservationId)

Retrieves a single reservation by ID.

**Returns:** `Promise<Reservation>`

### updateReservationStatus(reservationId, newStatus)

Updates reservation status. Admin only.

**Returns:** `Promise<Reservation>`

### getReservations(startDate, endDate, status?)

Lists reservations in a date range with optional status filter. Dashboard use.

**Returns:** `Promise<Reservation[]>`

### cancelReservation(reservationId)

Cancels a reservation if in a cancellable state.

**Returns:** `Promise<Reservation>`

---

## Delivery API (`backend/delivery-api.js`)

### checkDeliveryZone(lat, lng, config?)

Checks if coordinates are within the delivery zone.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| lat | number | Yes | Customer latitude |
| lng | number | Yes | Customer longitude |
| config.maxRadiusKm | number | No | Default: 10 |
| config.baseFee | number | No | Default: 2.50 |
| config.feePerKm | number | No | Default: 0.80 |

**Returns:** `{ inZone, distanceKm, deliveryFee, estimatedMinutes, message }`

### calculateFee(distanceKm, orderTotal, config?)

Calculates delivery fee with free delivery threshold check.

**Returns:** `{ fee, isFree, message }`

### getDeliveryStatus(orderNumber)

Gets delivery tracking information with step-by-step timeline.

**Returns:** `Promise<{ orderNumber, status, estimatedTime, steps[], deliveryAddress, customerName }>`

### assignDriver(orderId, driverInfo)

Assigns a driver to a delivery order. Admin dashboard use.

**Returns:** `Promise<Order>`

### getDeliveryZoneInfo(config?)

Returns delivery zone display info with fee tiers.

**Returns:** `{ center, radiusKm, baseFee, feePerKm, freeDeliveryThreshold, zones[] }`

---

## Notifications (`backend/notifications.js`)

### sendOrderConfirmation(order)

Sends order confirmation email to customer. Uses `orderConfirmation` triggered email template.

### notifyKitchen(order)

Sends dashboard notification to staff about a new order.

### sendReservationConfirmation(reservation)

Sends reservation confirmation email. Uses `reservationConfirmation` template.

### sendWaitlistNotification(reservation)

Sends waitlist confirmation email. Uses `waitlistConfirmation` template.

### sendOrderStatusUpdate(order, newStatus)

Sends status change notification to customer. Uses `orderStatusUpdate` template.

---

## Utility Modules

### Pricing (`backend/utils/pricing.js`)

- `formatPrice(amount, currency?, locale?)` - Currency formatting
- `calculateSubtotal(items)` - Sum of item prices
- `calculateServiceFee(subtotal, feePercent?)` - Service fee
- `calculateTax(subtotal, serviceFee, taxPercent?)` - Tax amount
- `calculateDeliveryFee(distanceKm, baseFee?, feePerKm?, orderTotal?, freeThreshold?)` - Delivery fee
- `calculateOrderSummary(items, options?)` - Complete order breakdown
- `estimateDeliveryTime(distanceKm, baseMinutes?, minutesPerKm?)` - ETA
- `haversineDistance(lat1, lng1, lat2, lng2)` - Distance calculation
- `generateOrderNumber()` - Unique order number (format: NG-YYYYMMDD-XXXX)

### Validation (`backend/utils/validation.js`)

- `validateEmail(email)` - Email format validation
- `validatePhone(phone)` - Phone format validation
- `validateName(name)` - Name validation (2-100 chars)
- `validateAddress(address)` - Address validation (10-300 chars)
- `validatePartySize(size, max?)` - Party size validation
- `validateReservationDate(date, closedDays?)` - Date validation (not past, not closed)
- `validateTimeFormat(time)` - HH:MM format validation
- `validateOrderItems(items)` - Cart items validation
- `validateMinimumOrder(subtotal, minimum)` - Minimum order check
- `sanitizeString(input)` - HTML entity escaping
