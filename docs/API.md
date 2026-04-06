# Backend API Reference

This document describes all backend API functions provided by the Namaste Restaurant Manager app. These are implemented as Wix Velo Web Modules and can be called from frontend page code or other backend modules.

---

## Table of Contents

- [Overview](#overview)
- [Menu API](#menu-api)
- [Orders API](#orders-api)
- [Reservations API](#reservations-api)
- [Delivery API](#delivery-api)
- [Notifications API](#notifications-api)

---

## Overview

### Velo Web Modules

All backend functions are exported from Velo Web Modules (files in the `backend/` directory). They run server-side and are accessible from client-side Velo code via standard ES module imports.

```javascript
import { getMenuItems } from 'backend/menu-api';
import { placeOrder } from 'backend/orders-api';
import { bookReservation } from 'backend/reservations-api';
import { checkDeliveryZone } from 'backend/delivery-api';
```

### Data layer

All functions interact with Wix CMS collections through the `wix-data` API. The three primary collections are:

- `menu-items` -- Menu item records
- `orders` -- Customer order records
- `reservations` -- Table reservation records

### Error handling

All functions throw standard JavaScript `Error` objects with descriptive messages when validation fails or a resource is not found. Client code should wrap calls in try/catch blocks.

```javascript
try {
  const order = await placeOrder(orderData);
} catch (error) {
  console.error(error.message);
}
```

---

## Menu API

**Module:** `backend/menu-api.js`

Functions for reading, creating, updating, and deleting menu items.

---

### getMenuItems(category, filters)

Retrieves all available menu items, optionally filtered by category and dietary preferences.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `category` | `string` | No | Filter by menu category (e.g., `"Entrees"`, `"Desserts"`). If omitted, returns items from all categories. |
| `filters` | `Object` | No | Dietary filter options. |
| `filters.isVegetarian` | `boolean` | No | If `true`, only return vegetarian items. |
| `filters.isVegan` | `boolean` | No | If `true`, only return vegan items. |
| `filters.isGlutenFree` | `boolean` | No | If `true`, only return gluten-free items. |
| `filters.isHalal` | `boolean` | No | If `true`, only return halal items. |

**Returns:** `Promise<Array<MenuItem>>` -- Array of menu item objects sorted by `sortOrder` then `name`.

**Example:**

```javascript
import { getMenuItems } from 'backend/menu-api';

// Get all available items
const allItems = await getMenuItems();

// Get vegetarian main courses
const vegMains = await getMenuItems('Plats Principaux', { isVegetarian: true });
```

---

### getMenuItem(id)

Retrieves a single menu item by its unique ID.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | The `_id` of the menu item. |

**Returns:** `Promise<MenuItem>` -- The menu item object.

**Throws:** `Error` if the item is not found.

**Example:**

```javascript
import { getMenuItem } from 'backend/menu-api';

const item = await getMenuItem('abc123');
console.log(item.name, item.price);
```

---

### createMenuItem(data)

Creates a new menu item. Requires admin context.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `data` | `Object` | Yes | Menu item data. |
| `data.name` | `string` | Yes | Item name. |
| `data.price` | `number` | Yes | Price (must be >= 0). |
| `data.category` | `string` | Yes | Menu category. |
| `data.description` | `string` | No | Item description. |
| `data.image` | `string` | No | Image URL. |
| `data.spiceLevel` | `number` | No | Spice level (0-5). Clamped to range. |
| `data.allergens` | `string[]` | No | Array of allergen identifiers. |
| `data.isVegetarian` | `boolean` | No | Vegetarian flag. |
| `data.isVegan` | `boolean` | No | Vegan flag. |
| `data.isGlutenFree` | `boolean` | No | Gluten-free flag. |
| `data.isHalal` | `boolean` | No | Halal flag. |
| `data.isAvailable` | `boolean` | No | Availability (default: `true`). |
| `data.sortOrder` | `number` | No | Sort order (default: `0`). |
| `data.nameFr` | `string` | No | French name for localization. |
| `data.descriptionFr` | `string` | No | French description for localization. |

**Returns:** `Promise<MenuItem>` -- The created item with its generated `_id`.

**Throws:** `Error` if `name` is empty or `price` is negative.

**Example:**

```javascript
import { createMenuItem } from 'backend/menu-api';

const newItem = await createMenuItem({
  name: 'Chicken Tikka Masala',
  description: 'Tender chicken in a rich, creamy tomato sauce.',
  price: 16.50,
  category: 'Plats Principaux',
  spiceLevel: 3,
  allergens: ['dairy'],
  isHalal: true,
  nameFr: 'Poulet Tikka Masala',
  descriptionFr: 'Poulet tendre dans une sauce tomate cremueuse.',
});
```

---

### updateMenuItem(id, data)

Updates an existing menu item. Only the fields provided in `data` are changed; all other fields are preserved. Requires admin context.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | The `_id` of the menu item to update. |
| `data` | `Object` | Yes | Partial object with fields to update. Accepts any of the fields from `createMenuItem`. |

**Returns:** `Promise<MenuItem>` -- The updated item.

**Throws:** `Error` if the item is not found.

**Example:**

```javascript
import { updateMenuItem } from 'backend/menu-api';

const updated = await updateMenuItem('abc123', {
  price: 17.00,
  spiceLevel: 4,
});
```

---

### deleteMenuItem(id)

Permanently deletes a menu item. Requires admin context.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | The `_id` of the menu item to delete. |

**Returns:** `Promise<void>`

**Example:**

```javascript
import { deleteMenuItem } from 'backend/menu-api';

await deleteMenuItem('abc123');
```

---

### getCategories()

Retrieves all distinct categories from available menu items.

**Parameters:** None.

**Returns:** `Promise<string[]>` -- Array of category names.

**Example:**

```javascript
import { getCategories } from 'backend/menu-api';

const categories = await getCategories();
// ["Entrees", "Plats Principaux", "Tandoori & Grillades", ...]
```

---

### setItemAvailability(id, isAvailable)

Toggles the availability of a menu item. Convenience wrapper around `updateMenuItem`.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | The `_id` of the menu item. |
| `isAvailable` | `boolean` | Yes | `true` to make available, `false` to hide. |

**Returns:** `Promise<MenuItem>` -- The updated item.

**Example:**

```javascript
import { setItemAvailability } from 'backend/menu-api';

// Mark item as sold out
await setItemAvailability('abc123', false);
```

---

### updateSortOrder(items)

Bulk updates the sort order for multiple menu items.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `items` | `Array<{ id: string, sortOrder: number }>` | Yes | Array of objects with `id` and `sortOrder` properties. |

**Returns:** `Promise<void>`

**Example:**

```javascript
import { updateSortOrder } from 'backend/menu-api';

await updateSortOrder([
  { id: 'item1', sortOrder: 1 },
  { id: 'item2', sortOrder: 2 },
  { id: 'item3', sortOrder: 3 },
]);
```

---

## Orders API

**Module:** `backend/orders-api.js`

Functions for placing and managing customer orders.

---

### placeOrder(data, options)

Places a new customer order. Validates all inputs, calculates pricing, generates an order number, and sends confirmation notifications.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `data` | `Object` | Yes | Order data. |
| `data.items` | `Array<CartItem>` | Yes | Array of cart items. Each item must have `itemId`, `name`, `price`, and `quantity`. |
| `data.orderType` | `string` | Yes | One of: `"delivery"`, `"pickup"`, `"dine-in"`. |
| `data.customerName` | `string` | Yes | Customer full name. |
| `data.customerPhone` | `string` | Yes | Customer phone number. |
| `data.customerEmail` | `string` | No | Customer email for order confirmation. |
| `data.deliveryAddress` | `string` | Conditional | Required when `orderType` is `"delivery"`. |
| `data.specialInstructions` | `string` | No | Special preparation instructions. |
| `data.paymentMethod` | `string` | No | One of: `"card"`, `"cash"`, `"online"`. Default: `"card"`. |
| `options` | `Object` | No | Pricing configuration overrides. |
| `options.serviceFeePercent` | `number` | No | Override service fee percentage (default: `5`). |
| `options.taxPercent` | `number` | No | Override tax percentage (default: `10`). |
| `options.deliveryFee` | `number` | No | Override delivery fee amount (default: `0`). |
| `options.minimumOrder` | `number` | No | Override minimum order amount (default: `15`). |

**Returns:** `Promise<Order>` -- The created order including `orderNumber`, calculated pricing, and status `"new"`.

**Throws:**
- `Error` if items are invalid or empty.
- `Error` if customer name or phone is invalid.
- `Error` if delivery address is missing for delivery orders.
- `Error` if subtotal is below the minimum order amount.

**Side effects:** Sends an order confirmation email and a kitchen dashboard notification (non-blocking).

**Example:**

```javascript
import { placeOrder } from 'backend/orders-api';

const order = await placeOrder({
  items: [
    { itemId: 'item1', name: 'Chicken Tikka Masala', price: 16.50, quantity: 2 },
    { itemId: 'item2', name: 'Garlic Naan', price: 3.50, quantity: 3 },
  ],
  orderType: 'delivery',
  customerName: 'Jean Dupont',
  customerPhone: '+33 6 12 34 56 78',
  customerEmail: 'jean@example.com',
  deliveryAddress: '5 Rue de la Loire, 45500 Gien',
  specialInstructions: 'Extra spicy please',
  paymentMethod: 'card',
}, {
  serviceFeePercent: 5,
  taxPercent: 10,
  deliveryFee: 4.90,
  minimumOrder: 15,
});

console.log(order.orderNumber); // e.g., "NM-1234-5678"
console.log(order.total);       // e.g., 52.63
```

---

### getOrder(orderNumber)

Retrieves a complete order by its human-readable order number.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `orderNumber` | `string` | Yes | The order number (e.g., `"NM-1234-5678"`). |

**Returns:** `Promise<Order>` -- The order object with `items` parsed from JSON.

**Throws:** `Error` if the order is not found.

**Example:**

```javascript
import { getOrder } from 'backend/orders-api';

const order = await getOrder('NM-1234-5678');
console.log(order.status, order.total);
```

---

### getOrderStatus(orderNumber)

Retrieves the current status and estimated time for an order.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `orderNumber` | `string` | Yes | The order number. |

**Returns:** `Promise<{ status: string, estimatedTime: number, orderType: string }>`

**Throws:** `Error` if the order is not found.

**Example:**

```javascript
import { getOrderStatus } from 'backend/orders-api';

const { status, estimatedTime } = await getOrderStatus('NM-1234-5678');
// status: "preparing", estimatedTime: 45
```

---

### updateOrderStatus(id, status, estimatedTime)

Updates the status of an order. Enforces valid status transitions. Admin only.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | The `_id` of the order (not the order number). |
| `status` | `string` | Yes | New status. Must be a valid transition from the current status. |
| `estimatedTime` | `number` | No | Updated estimated time in minutes. |

**Valid status transitions:**

| Current Status | Allowed Next Statuses |
|---|---|
| `new` | `confirmed`, `cancelled` |
| `confirmed` | `preparing`, `cancelled` |
| `preparing` | `ready`, `cancelled` |
| `ready` | `out-for-delivery`, `picked-up`, `delivered` |
| `out-for-delivery` | `delivered` |

**Returns:** `Promise<Order>` -- The updated order.

**Throws:**
- `Error` if the order is not found.
- `Error` if the status transition is invalid.

**Example:**

```javascript
import { updateOrderStatus } from 'backend/orders-api';

await updateOrderStatus('order_id_abc', 'confirmed');
await updateOrderStatus('order_id_abc', 'preparing', 30);
```

---

### getOrders(status, limit, skip)

Retrieves orders with optional status filtering and pagination. Ordered by creation date, newest first.

**Parameters:**

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `status` | `string` | No | -- | Filter by status. If omitted, returns orders of all statuses. |
| `limit` | `number` | No | `50` | Maximum number of orders to return. |
| `skip` | `number` | No | `0` | Number of orders to skip (for pagination). |

**Returns:** `Promise<{ items: Array<Order>, totalCount: number }>` -- Paginated result with total count.

**Example:**

```javascript
import { getOrders } from 'backend/orders-api';

// Get first page of all orders
const { items, totalCount } = await getOrders(null, 20, 0);

// Get only preparing orders
const preparing = await getOrders('preparing', 50, 0);
```

---

### getTodaysOrders()

Retrieves all orders created today (since midnight). Designed for the kitchen dashboard.

**Parameters:** None.

**Returns:** `Promise<Array<Order>>` -- Array of today's orders, newest first.

**Example:**

```javascript
import { getTodaysOrders } from 'backend/orders-api';

const todaysOrders = await getTodaysOrders();
console.log(`${todaysOrders.length} orders today`);
```

---

### cancelOrder(id)

Cancels an order if it is in a cancellable state (`new` or `confirmed`).

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | The `_id` of the order. |

**Returns:** `Promise<Order>` -- The cancelled order.

**Throws:**
- `Error` if the order is not found.
- `Error` if the order status is beyond `confirmed` (e.g., `preparing`, `ready`).

**Example:**

```javascript
import { cancelOrder } from 'backend/orders-api';

const cancelled = await cancelOrder('order_id_abc');
console.log(cancelled.status); // "cancelled"
```

---

## Reservations API

**Module:** `backend/reservations-api.js`

Functions for booking and managing table reservations.

---

### bookReservation(data, maxCapacity)

Books a new table reservation. Validates all inputs, checks slot capacity, and sends a confirmation email.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `data` | `Object` | Yes | Reservation data. |
| `data.date` | `string` | Yes | ISO date string (e.g., `"2026-04-15"`). Must be a future date. |
| `data.time` | `string` | Yes | Time in HH:MM format (e.g., `"19:30"`). |
| `data.partySize` | `number` | Yes | Number of guests. |
| `data.customerName` | `string` | Yes | Guest name. |
| `data.customerEmail` | `string` | Yes | Guest email. |
| `data.customerPhone` | `string` | Yes | Guest phone number. |
| `data.occasion` | `string` | No | Occasion type: `"none"`, `"birthday"`, `"anniversary"`, `"business"`, `"date-night"`, `"celebration"`, `"other"`. Default: `"none"`. |
| `data.notes` | `string` | No | Special requests or notes. |
| `maxCapacity` | `number` | No | Override max capacity per slot (default: `60`). |

**Returns:** `Promise<Reservation>` -- The created reservation with status `"confirmed"`.

**Throws:**
- `Error` if the date is in the past.
- `Error` if the time format is invalid.
- `Error` if the party size is invalid.
- `Error` if customer name, email, or phone is invalid.
- `Error` if the time slot does not have enough remaining capacity.

**Side effects:** Sends a reservation confirmation email (non-blocking).

**Example:**

```javascript
import { bookReservation } from 'backend/reservations-api';

const reservation = await bookReservation({
  date: '2026-04-15',
  time: '19:30',
  partySize: 4,
  customerName: 'Marie Laurent',
  customerEmail: 'marie@example.com',
  customerPhone: '+33 6 98 76 54 32',
  occasion: 'birthday',
  notes: 'Window table preferred',
});
```

---

### joinWaitlist(data)

Adds a customer to the waitlist for a fully booked time slot.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `data` | `Object` | Yes | Same fields as `bookReservation` data parameter. |

**Returns:** `Promise<Reservation>` -- The waitlisted reservation with status `"waitlisted"`.

**Side effects:** Sends a waitlist confirmation email (non-blocking).

**Example:**

```javascript
import { joinWaitlist } from 'backend/reservations-api';

const waitlisted = await joinWaitlist({
  date: '2026-04-15',
  time: '19:30',
  partySize: 2,
  customerName: 'Pierre Martin',
  customerEmail: 'pierre@example.com',
  customerPhone: '+33 6 11 22 33 44',
});
```

---

### getAvailableSlots(date, maxCapacity)

Gets all time slots for a given date with availability information.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `date` | `string` | Yes | ISO date string (e.g., `"2026-04-15"`). Must be a future date. |
| `maxCapacity` | `number` | No | Override max capacity per slot (default: `60`). |

**Returns:** `Promise<Array<TimeSlot>>` -- Array of time slot objects.

Each slot contains:

| Property | Type | Description |
|---|---|---|
| `time` | `string` | Time in HH:MM format. |
| `available` | `boolean` | Whether the slot has remaining capacity. |
| `remainingCapacity` | `number` | Number of seats still available. |

**Example:**

```javascript
import { getAvailableSlots } from 'backend/reservations-api';

const slots = await getAvailableSlots('2026-04-15');
// [
//   { time: "12:00", available: true, remainingCapacity: 60 },
//   { time: "12:30", available: true, remainingCapacity: 48 },
//   { time: "19:00", available: false, remainingCapacity: 0 },
//   ...
// ]
```

---

### getReservation(id)

Retrieves a single reservation by its ID.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | The `_id` of the reservation. |

**Returns:** `Promise<Reservation>` -- The reservation object.

**Throws:** `Error` if the reservation is not found.

**Example:**

```javascript
import { getReservation } from 'backend/reservations-api';

const res = await getReservation('res_id_abc');
console.log(res.customerName, res.time, res.partySize);
```

---

### updateReservationStatus(id, status)

Updates the status of a reservation. Admin only.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | The `_id` of the reservation. |
| `status` | `string` | Yes | New status. One of: `"pending"`, `"confirmed"`, `"seated"`, `"completed"`, `"cancelled"`, `"no-show"`, `"waitlisted"`. |

**Returns:** `Promise<Reservation>` -- The updated reservation.

**Throws:** `Error` if the reservation is not found.

**Example:**

```javascript
import { updateReservationStatus } from 'backend/reservations-api';

await updateReservationStatus('res_id_abc', 'seated');
```

---

### getReservations(start, end, status)

Retrieves reservations within a date range, optionally filtered by status. Sorted by date then time in ascending order.

**Parameters:**

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `start` | `string` | Yes | -- | Start date as ISO string (e.g., `"2026-04-01"`). |
| `end` | `string` | Yes | -- | End date as ISO string (e.g., `"2026-04-30"`). |
| `status` | `string` | No | -- | Filter by status. If omitted, returns reservations of all statuses. |

**Returns:** `Promise<Array<Reservation>>` -- Array of reservations.

**Example:**

```javascript
import { getReservations } from 'backend/reservations-api';

// Get all April reservations
const all = await getReservations('2026-04-01', '2026-04-30');

// Get only confirmed reservations for this week
const confirmed = await getReservations('2026-04-06', '2026-04-12', 'confirmed');
```

---

### cancelReservation(id)

Cancels a reservation if it is in a cancellable state (`pending`, `confirmed`, or `waitlisted`).

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | The `_id` of the reservation. |

**Returns:** `Promise<Reservation>` -- The cancelled reservation.

**Throws:**
- `Error` if the reservation is not found.
- `Error` if the reservation is in a non-cancellable state (e.g., `seated`, `completed`).

**Example:**

```javascript
import { cancelReservation } from 'backend/reservations-api';

const cancelled = await cancelReservation('res_id_abc');
console.log(cancelled.status); // "cancelled"
```

---

## Delivery API

**Module:** `backend/delivery-api.js`

Functions for checking delivery zones, calculating fees, tracking deliveries, and assigning drivers.

---

### checkDeliveryZone(lat, lng, config)

Checks whether a given coordinate is within the restaurant's delivery zone and returns fee and time estimates.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `lat` | `number` | Yes | Customer latitude. |
| `lng` | `number` | Yes | Customer longitude. |
| `config` | `Object` | No | Delivery configuration overrides. |
| `config.maxRadiusKm` | `number` | No | Override max radius (default: `10`). |
| `config.baseFee` | `number` | No | Override base fee (default: `2.50`). |
| `config.feePerKm` | `number` | No | Override per-km fee (default: `0.80`). |
| `config.freeDeliveryThreshold` | `number` | No | Override free delivery threshold (default: `40`). |
| `config.basePreparationMinutes` | `number` | No | Override base prep time (default: `25`). |
| `config.estimatedTimePerKm` | `number` | No | Override time per km (default: `3`). |

**Returns:** `Object` with the following properties:

| Property | Type | Description |
|---|---|---|
| `inZone` | `boolean` | Whether the address is within the delivery radius. |
| `distanceKm` | `number` | Distance from the restaurant in kilometers. |
| `deliveryFee` | `number` | Calculated delivery fee (0 if out of zone). |
| `estimatedMinutes` | `number` | Estimated delivery time in minutes (0 if out of zone). |
| `message` | `string` | Human-readable status message. |

**Note:** This is a synchronous function (no Promise).

**Example:**

```javascript
import { checkDeliveryZone } from 'backend/delivery-api';

const result = checkDeliveryZone(47.690, 2.635);
if (result.inZone) {
  console.log(`Delivery fee: ${result.deliveryFee} EUR`);
  console.log(`Estimated time: ${result.estimatedMinutes} min`);
} else {
  console.log(result.message); // "Sorry, this address is 12.3 km away..."
}
```

---

### calculateFee(distance, total, config)

Calculates the delivery fee for a given distance and order total, accounting for the free delivery threshold.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `distance` | `number` | Yes | Distance from the restaurant in kilometers. |
| `total` | `number` | Yes | Current order total. |
| `config` | `Object` | No | Delivery configuration overrides (same as `checkDeliveryZone`). |

**Returns:** `Object` with the following properties:

| Property | Type | Description |
|---|---|---|
| `fee` | `number` | The calculated delivery fee. |
| `isFree` | `boolean` | Whether delivery is free (order total exceeds threshold). |
| `message` | `string` | Human-readable message about delivery pricing. |

**Note:** This is a synchronous function (no Promise).

**Example:**

```javascript
import { calculateFee } from 'backend/delivery-api';

const result = calculateFee(5.2, 35);
// { fee: 6.66, isFree: false, message: "Add 5.00 EUR more for free delivery." }

const free = calculateFee(5.2, 42);
// { fee: 0, isFree: true, message: "Free delivery on orders over 40 EUR!" }
```

---

### getDeliveryStatus(orderNumber)

Gets the delivery tracking status for a delivery order, including step-by-step progress.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `orderNumber` | `string` | Yes | The order number. |

**Returns:** `Promise<Object>` with the following properties:

| Property | Type | Description |
|---|---|---|
| `orderNumber` | `string` | The order number. |
| `status` | `string` | Current order status. |
| `estimatedTime` | `number` | Estimated time in minutes. |
| `steps` | `Array` | Array of delivery step objects (see below). |
| `deliveryAddress` | `string` | The delivery address. |
| `customerName` | `string` | Customer name. |

Each step in `steps` contains:

| Property | Type | Description |
|---|---|---|
| `key` | `string` | Step identifier. |
| `label` | `string` | English label. |
| `labelFr` | `string` | French label. |
| `completed` | `boolean` | Whether this step is done. |
| `active` | `boolean` | Whether this is the current step. |
| `pending` | `boolean` | Whether this step is upcoming. |

**Throws:** `Error` if the delivery order is not found.

**Example:**

```javascript
import { getDeliveryStatus } from 'backend/delivery-api';

const tracking = await getDeliveryStatus('NM-1234-5678');
const currentStep = tracking.steps.find(s => s.active);
console.log(`Current step: ${currentStep.label}`); // "Preparing"
```

---

### assignDriver(orderId, driverInfo)

Assigns a delivery driver to an order and sets its status to `out-for-delivery`. Admin dashboard use.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `orderId` | `string` | Yes | The `_id` of the order. |
| `driverInfo` | `Object` | Yes | Driver details. |
| `driverInfo.name` | `string` | Yes | Driver name. |
| `driverInfo.phone` | `string` | Yes | Driver phone number. |

**Returns:** `Promise<Order>` -- The updated order with driver info and status `"out-for-delivery"`.

**Throws:**
- `Error` if the order is not found.
- `Error` if the order is not a delivery order.

**Example:**

```javascript
import { assignDriver } from 'backend/delivery-api';

await assignDriver('order_id_abc', {
  name: 'Ravi Kumar',
  phone: '+33 6 55 44 33 22',
});
```

---

### getDeliveryZoneInfo(config)

Returns delivery zone information for display on the frontend, including zone breakdowns with fees and estimated times.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `config` | `Object` | No | Delivery configuration overrides (same as `checkDeliveryZone`). |

**Returns:** `Object` with the following properties:

| Property | Type | Description |
|---|---|---|
| `center` | `{ lat: number, lng: number }` | Restaurant coordinates. |
| `radiusKm` | `number` | Maximum delivery radius. |
| `baseFee` | `number` | Base delivery fee. |
| `feePerKm` | `number` | Fee per kilometer. |
| `freeDeliveryThreshold` | `number` | Order total for free delivery. |
| `zones` | `Array` | Breakdown of delivery zones (see below). |

Each zone in `zones` contains:

| Property | Type | Description |
|---|---|---|
| `label` | `string` | Zone description (e.g., "Zone 1 (0-3 km)"). |
| `fee` | `number` | Estimated delivery fee for this zone. |
| `time` | `number` | Estimated delivery time in minutes. |

**Note:** This is a synchronous function (no Promise).

**Example:**

```javascript
import { getDeliveryZoneInfo } from 'backend/delivery-api';

const info = getDeliveryZoneInfo();
console.log(info.zones);
// [
//   { label: "Zone 1 (0-3 km)", fee: 4.90, time: 34 },
//   { label: "Zone 2 (3-6 km)", fee: 7.30, time: 43 },
//   { label: "Zone 3 (6-10 km)", fee: 10.50, time: 55 },
// ]
```

---

## Notifications API

**Module:** `backend/notifications.js`

Functions for sending email and dashboard notifications. These use Wix Triggered Emails (`wix-crm`) and Wix Dashboard Notifications.

All notification functions are non-blocking and catch their own errors internally (logging to console). They will not throw even if sending fails.

---

### sendOrderConfirmation(order)

Sends an order confirmation email to the customer using the `orderConfirmation` triggered email template.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `order` | `Order` | Yes | The order object. Must include `customerEmail`, `orderNumber`, `customerName`, `items`, pricing fields, and `orderType`. |

**Returns:** `Promise<void>`

**Template variables sent:**

| Variable | Source |
|---|---|
| `orderNumber` | `order.orderNumber` |
| `customerName` | `order.customerName` |
| `orderType` | Formatted order type ("Delivery", "Pickup", "Dine-in") |
| `items` | Formatted item list with quantities and prices |
| `subtotal` | Formatted subtotal |
| `serviceFee` | Formatted service fee |
| `deliveryFee` | Formatted delivery fee |
| `tax` | Formatted tax |
| `total` | Formatted total |
| `estimatedTime` | Estimated time string (e.g., "45 minutes") |
| `deliveryAddress` | Delivery address or "N/A" |
| `specialInstructions` | Special instructions or "None" |

**Example:**

```javascript
import { sendOrderConfirmation } from 'backend/notifications';

await sendOrderConfirmation(orderObject);
```

---

### notifyKitchen(order)

Sends a dashboard notification to site admins/staff about a new order.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `order` | `Order` | Yes | The order object. |

**Returns:** `Promise<void>`

**Notification content:**
- Title: `Order #<orderNumber>`
- Body: Item count, total, and customer name
- Action URL: Links to `/dashboard/orders?id=<orderId>`

**Example:**

```javascript
import { notifyKitchen } from 'backend/notifications';

await notifyKitchen(orderObject);
```

---

### sendReservationConfirmation(reservation)

Sends a reservation confirmation email to the customer using the `reservationConfirmation` triggered email template.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `reservation` | `Reservation` | Yes | The reservation object. Must include `customerEmail`, `customerName`, `date`, `time`, `partySize`. |

**Returns:** `Promise<void>`

**Template variables sent:**

| Variable | Source |
|---|---|
| `customerName` | `reservation.customerName` |
| `date` | Formatted date (French locale, e.g., "mercredi 15 avril 2026") |
| `time` | `reservation.time` |
| `partySize` | `reservation.partySize` (as string) |
| `occasion` | Occasion string (empty if "none") |
| `notes` | Special requests or "None" |
| `restaurantName` | "Namaste GIEN -- Restaurant Indien" |
| `restaurantAddress` | "12 Quai de Nice, 45500 Gien, France" |
| `restaurantPhone` | "+33 2 38 XX XX XX" |

**Example:**

```javascript
import { sendReservationConfirmation } from 'backend/notifications';

await sendReservationConfirmation(reservationObject);
```

---

### sendWaitlistNotification(reservation)

Sends a waitlist confirmation email to the customer using the `waitlistConfirmation` triggered email template.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `reservation` | `Reservation` | Yes | The waitlisted reservation object. |

**Returns:** `Promise<void>`

**Template variables sent:**

| Variable | Source |
|---|---|
| `customerName` | `reservation.customerName` |
| `date` | Formatted date (French locale) |
| `time` | `reservation.time` |
| `partySize` | `reservation.partySize` (as string) |

**Example:**

```javascript
import { sendWaitlistNotification } from 'backend/notifications';

await sendWaitlistNotification(waitlistedReservation);
```

---

### sendOrderStatusUpdate(order, status)

Sends an order status update email to the customer using the `orderStatusUpdate` triggered email template.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `order` | `Order` | Yes | The order object. Must include `customerEmail`, `customerName`, `orderNumber`. |
| `status` | `string` | Yes | The new status string. |

**Returns:** `Promise<void>`

**Status message mapping:**

| Status | Message |
|---|---|
| `confirmed` | "Your order has been confirmed!" |
| `preparing` | "Your order is being prepared." |
| `ready` | "Your order is ready!" |
| `out-for-delivery` | "Your order is on its way!" |
| `delivered` | "Your order has been delivered. Bon appetit!" |
| `picked-up` | "Your order has been picked up. Bon appetit!" |
| `cancelled` | "Your order has been cancelled." |

**Example:**

```javascript
import { sendOrderStatusUpdate } from 'backend/notifications';

await sendOrderStatusUpdate(orderObject, 'preparing');
```

---

For installation steps, see the [Installation Guide](./INSTALLATION.md).
For configuration options, see the [Configuration Guide](./CONFIGURATION.md).
