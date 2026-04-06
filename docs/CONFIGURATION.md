# Configuration Guide

This document covers all configurable settings for the Namaste Restaurant Manager app. Settings are managed through the app's Settings Panel in the Wix Editor, and are stored in the `app-settings` CMS collection.

---

## Table of Contents

- [General Settings](#general-settings)
- [Operating Hours](#operating-hours)
- [Menu Widget Settings](#menu-widget-settings)
- [Ordering Settings](#ordering-settings)
- [Delivery Settings](#delivery-settings)
- [Reservation Settings](#reservation-settings)
- [Appearance Settings](#appearance-settings)
- [Design Presets](#design-presets)
- [Custom CSS Variables Reference](#custom-css-variables-reference)

---

## General Settings

Configure the basic identity and localization of your restaurant.

| Setting | Key | Type | Default | Description |
|---|---|---|---|---|
| Restaurant Name | `restaurantName` | Text | `Namaste GIEN` | The name displayed throughout the app, including headers, emails, and receipts. |
| Currency | `currency` | Select | `EUR` | The currency used for prices and totals. Options: `EUR`, `USD`, `GBP`. This affects how prices are formatted across all widgets. |
| Language | `locale` | Select | `fr` | The primary display language. Options: `fr` (French), `en` (English). When set to French, the app uses the `nameFr` and `descriptionFr` fields from menu items where available. |

### Notes

- Changing the currency does not convert existing prices. You must update all menu item prices manually after changing the currency.
- The locale setting affects date formatting, price formatting (comma vs. period as decimal separator), and the display language for labels and status messages.

---

## Operating Hours

Define when the restaurant is open for service.

| Setting | Key | Type | Default | Description |
|---|---|---|---|---|
| Closed Days | `closedDays` | Multi-select | `Monday` | Days of the week when the restaurant is closed. Reservations and orders cannot be placed for closed days. Options: Monday through Sunday. |
| Lunch Start | `lunchStart` | Time | `12:00` | Start time for the lunch service period. |
| Lunch End | `lunchEnd` | Time | `14:30` | End time for the lunch service period. |
| Dinner Start | `dinnerStart` | Time | `19:00` | Start time for the dinner service period. |
| Dinner End | `dinnerEnd` | Time | `22:30` | End time for the dinner service period. |

### How operating hours affect the app

- **Reservation widget:** Only generates time slots within the lunch and dinner service periods. Slots are generated at 30-minute intervals.
  - Default lunch slots: 12:00, 12:30, 13:00, 13:30
  - Default dinner slots: 19:00, 19:30, 20:00, 20:30, 21:00
- **Order widget:** Orders can only be placed during active service periods.
- **Closed days:** The reservation and ordering widgets will not allow bookings or orders on closed days.

---

## Menu Widget Settings

Control the layout and visible features of the Restaurant Menu widget.

| Setting | Key | Type | Default | Options | Description |
|---|---|---|---|---|---|
| Layout | `menuLayout` | Select | `grid` | `grid`, `list`, `card`, `editorial` | The visual layout for menu items. See the Design Presets section below for details on each layout. |
| Columns (Desktop) | `menuColumns` | Number | `3` | 1-4 | Number of columns in the grid/card layout on desktop screens. Mobile views always use a single column. |
| Items per Page | `itemsPerPage` | Number | `12` | 4-50 | Maximum number of items displayed before pagination controls appear. |
| Show Spice Level | `showSpiceLevel` | Toggle | `true` | -- | When enabled, displays a spice level indicator (0-5 chili icons) on each menu item. |
| Show Allergens | `showAllergens` | Toggle | `true` | -- | When enabled, displays allergen tags on each menu item. Supported allergens: nuts, dairy, gluten, shellfish, eggs, soy, celery, mustard, sesame. |
| Show Dietary Badges | `showDietaryBadges` | Toggle | `true` | -- | When enabled, shows Vegetarian, Vegan, Gluten-Free, and Halal badges on qualifying items. |
| Show Images | `showImages` | Toggle | `true` | -- | When enabled, displays item images. Disable this for a text-only menu layout. Items without an uploaded image will show a placeholder. |

### Layout behavior

- **Grid:** Items are arranged in a multi-column grid. Best for menus with images.
- **List:** Items are displayed in a single-column vertical list with the image on the left and details on the right.
- **Card:** Each item is displayed as a card with a prominent image, name, description, and price. Cards are arranged in the configured number of columns.
- **Editorial:** A magazine-style layout with alternating large and small item presentations. Best for highlighting featured dishes.

---

## Ordering Settings

Configure online ordering behavior, fees, and enabled order types.

| Setting | Key | Type | Default | Range | Description |
|---|---|---|---|---|---|
| Enable Delivery | `enableDelivery` | Toggle | `true` | -- | Allow customers to place delivery orders. When disabled, the delivery option is hidden from the order type selector. |
| Enable Pickup | `enablePickup` | Toggle | `true` | -- | Allow customers to place pickup orders. |
| Enable Dine-in | `enableDineIn` | Toggle | `true` | -- | Allow customers to place dine-in orders from the online ordering widget. |
| Minimum Order | `minimumOrder` | Number | `15` | 0+ | Minimum order subtotal (before fees and tax) required to place an order. Set to 0 to remove the minimum. Currency follows the General Settings currency. |
| Service Fee | `serviceFeePercent` | Number | `5` | 0-30 | Service fee as a percentage of the subtotal. Applied to all order types. Set to 0 to disable. |
| Tax | `taxPercent` | Number | `10` | 0-30 | Tax rate as a percentage of the subtotal. Applied to all order types. |

### Order status lifecycle

Orders follow a defined status progression:

```
new --> confirmed --> preparing --> ready --> out-for-delivery --> delivered
                                         --> picked-up
Any of [new, confirmed] --> cancelled
```

- `new` -- Order placed by the customer, awaiting staff confirmation.
- `confirmed` -- Staff has accepted the order.
- `preparing` -- Kitchen is preparing the order.
- `ready` -- Order is ready for pickup or delivery.
- `out-for-delivery` -- Driver has picked up the order (delivery only).
- `delivered` -- Order has been delivered to the customer.
- `picked-up` -- Customer has picked up the order.
- `cancelled` -- Order was cancelled. Only possible from `new` or `confirmed` status.

### Pricing calculation

The order total is calculated as follows:

```
Subtotal     = sum of (item price * quantity) for all items
Service Fee  = Subtotal * (serviceFeePercent / 100)
Delivery Fee = calculated based on delivery settings (0 for pickup/dine-in)
Tax          = Subtotal * (taxPercent / 100)
Total        = Subtotal + Service Fee + Delivery Fee + Tax
```

---

## Delivery Settings

Configure the delivery zone, fee structure, and coverage area.

| Setting | Key | Type | Default | Description |
|---|---|---|---|---|
| Max Delivery Radius | `maxDeliveryRadius` | Number | `10` | Maximum distance from the restaurant (in km) for deliveries. Addresses beyond this radius will be rejected. |
| Base Delivery Fee | `baseFee` | Number | `2.50` | Fixed base charge applied to all delivery orders. |
| Fee per km | `feePerKm` | Number | `0.80` | Additional charge per kilometer of distance from the restaurant. |
| Free Delivery Threshold | `freeDeliveryThreshold` | Number | `40` | Order total (in configured currency) above which delivery is free. |

### Delivery fee calculation

```
If orderTotal >= freeDeliveryThreshold:
    deliveryFee = 0
Else:
    deliveryFee = baseFee + (distanceKm * feePerKm)
```

### Default delivery zones

The app pre-calculates three delivery zones for display purposes:

| Zone | Distance | Default Fee | Default Estimated Time |
|---|---|---|---|
| Zone 1 | 0-3 km | Base fee + 3 * per-km fee | ~34 minutes |
| Zone 2 | 3-6 km | Base fee + 6 * per-km fee | ~43 minutes |
| Zone 3 | 6-10 km | Base fee + 10 * per-km fee | ~55 minutes |

Estimated delivery time is calculated as:

```
estimatedMinutes = basePreparationMinutes + (distanceKm * estimatedTimePerKm)
```

Default values: `basePreparationMinutes = 25`, `estimatedTimePerKm = 3`.

### Restaurant coordinates

The delivery zone is centered on the restaurant's coordinates. The default location is:

- **Latitude:** 47.6847
- **Longitude:** 2.6286
- **Address:** 12 Quai de Nice, 45500 Gien, France

To change the restaurant location, update the `RESTAURANT_LAT` and `RESTAURANT_LNG` constants in `backend/delivery-api.js`.

---

## Reservation Settings

Configure table reservation behavior and capacity management.

| Setting | Key | Type | Default | Range | Description |
|---|---|---|---|---|---|
| Max Party Size | `maxPartySize` | Number | `20` | 1-50 | The maximum number of guests allowed per reservation. Requests exceeding this are rejected. |
| Max Capacity per Slot | `maxCapacity` | Number | `60` | 1+ | Total seating capacity available per time slot. When a slot's booked party sizes reach this limit, the slot shows as unavailable. |
| Slot Duration | `slotDuration` | Number | `90` | 30-180 | Duration of each reservation slot in minutes. This determines how long a table is reserved for a party. |
| Enable Waitlist | `enableWaitlist` | Toggle | `true` | -- | When enabled, customers can join a waitlist for fully booked time slots. They receive a notification if a spot opens up. |

### Time slot generation

Time slots are generated based on operating hours at 30-minute intervals:

- **Lunch slots:** 12:00, 12:30, 13:00, 13:30
- **Dinner slots:** 19:00, 19:30, 20:00, 20:30, 21:00

Each slot has a capacity equal to the `maxCapacity` setting. As reservations are booked, the remaining capacity for each slot decreases. When remaining capacity reaches zero, the slot is shown as unavailable (or a waitlist option is offered if enabled).

### Reservation status lifecycle

```
confirmed --> seated --> completed
confirmed --> cancelled
confirmed --> no-show
waitlisted --> confirmed (when a spot opens)
waitlisted --> cancelled
```

### Occasion options

Customers can optionally select an occasion when booking:

- None (default)
- Birthday
- Anniversary
- Business
- Date Night
- Celebration
- Other

---

## Appearance Settings

Customize the visual appearance of all widgets.

| Setting | Key | Type | Default | Description |
|---|---|---|---|---|
| Primary Color | `primaryColor` | Color | `#1B3A6B` (Gien Indigo) | Main color used for headers, buttons, and navigation elements. |
| Accent Color | `accentColor` | Color | `#E8731A` (Saffron Orange) | Highlight color used for calls to action, active states, and badges. |
| Background Color | `backgroundColor` | Color | `#FDF6EC` (Cream White) | Background color for widget containers. |
| Body Font | `fontFamily` | Select | `DM Sans` | Font used for body text. Options: `DM Sans`, `Roboto`, `Open Sans`, `Lato`. |

### Brand color palette

The app includes a curated color palette designed for the Namaste brand:

| Name | Hex Code | Usage |
|---|---|---|
| Saffron Orange | `#E8731A` | Default accent color, CTAs |
| Gien Indigo | `#1B3A6B` | Default primary color, headers |
| Tandoori Red | `#C23B22` | Error states, spice indicators |
| Loire Gold | `#D4A843` | Premium badges, highlights |
| Cream White | `#FDF6EC` | Default background |
| Charcoal | `#2D2926` | Body text |
| Warm Sand | `#F5EDE0` | Card backgrounds, secondary surfaces |
| Deep Navy | `#0F1F3D` | Dark mode backgrounds, footers |

### Font stack

| Purpose | Default Font | Fallback |
|---|---|---|
| Display headings | Playfair Display | serif |
| Body text | DM Sans | sans-serif |
| Accent text | Cormorant Garamond | serif |

---

## Design Presets

The app ships with four design presets that adjust the menu layout and overall visual style. Select a preset from the Menu Widget Layout setting.

### Card Layout (`grid`)

The default layout. Menu items are displayed as individual cards arranged in a multi-column grid.

- Best for: Menus with item photos
- Columns: Configurable (1-4)
- Image position: Top of card
- Shows: Name, description (truncated), price, dietary badges, spice level

### Compact List (`list`)

A dense, text-focused layout ideal for menus with many items.

- Best for: Large menus, text-focused presentation
- Columns: Always 1
- Image position: Small thumbnail on the left
- Shows: Name, price, and optionally a short description

### Editorial (`editorial`)

A magazine-style layout with alternating large and small item presentations.

- Best for: Featured dishes, curated menus, visual storytelling
- Columns: Mixed (alternates between full-width and 2-column sections)
- Image position: Alternating left/right with overlapping text
- Shows: Full description, allergens, dietary info, spice level

### Mobile Layout

On screens narrower than 768px, all layouts automatically switch to a single-column, vertically stacked view optimized for touch interaction. Cards become full-width with larger tap targets.

---

## Custom CSS Variables Reference

For advanced customization, the app exposes CSS custom properties that can be overridden using Wix's custom CSS feature (available on Wix Business plans and above).

### Color variables

```css
--namaste-primary: #1B3A6B;
--namaste-accent: #E8731A;
--namaste-background: #FDF6EC;
--namaste-text: #2D2926;
--namaste-text-secondary: #5A5550;
--namaste-surface: #F5EDE0;
--namaste-error: #C23B22;
--namaste-success: #2E7D32;
--namaste-gold: #D4A843;
--namaste-border: rgba(0, 0, 0, 0.1);
```

### Typography variables

```css
--namaste-font-display: 'Playfair Display', serif;
--namaste-font-body: 'DM Sans', sans-serif;
--namaste-font-accent: 'Cormorant Garamond', serif;
--namaste-font-size-base: 16px;
--namaste-font-size-sm: 14px;
--namaste-font-size-lg: 18px;
--namaste-font-size-xl: 24px;
--namaste-font-size-2xl: 32px;
--namaste-font-size-3xl: 40px;
--namaste-line-height-base: 1.5;
--namaste-line-height-heading: 1.2;
```

### Spacing variables

```css
--namaste-spacing-xs: 4px;
--namaste-spacing-sm: 8px;
--namaste-spacing-md: 16px;
--namaste-spacing-lg: 24px;
--namaste-spacing-xl: 32px;
--namaste-spacing-2xl: 48px;
```

### Component variables

```css
--namaste-card-radius: 8px;
--namaste-card-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
--namaste-card-hover-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
--namaste-button-radius: 6px;
--namaste-button-height: 44px;
--namaste-input-radius: 6px;
--namaste-input-height: 44px;
--namaste-badge-radius: 12px;
```

### Example: Overriding CSS variables

To override variables, use the Wix Editor's custom CSS section or add a style block in your page code:

```css
/* Dark mode override example */
:root {
  --namaste-primary: #E8731A;
  --namaste-accent: #D4A843;
  --namaste-background: #0F1F3D;
  --namaste-text: #FDF6EC;
  --namaste-surface: #1B3A6B;
}
```

---

For installation steps, see the [Installation Guide](./INSTALLATION.md).
For API documentation, see the [API Reference](./API.md).
