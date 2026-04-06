# Namaste Restaurant Manager

**Complete restaurant management for Wix sites**

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Version: 1.0.0](https://img.shields.io/badge/Version-1.0.0-brightgreen.svg)
![Wix Blocks 2.0](https://img.shields.io/badge/Wix%20Blocks-2.0-blueviolet.svg)

---

## Overview

Namaste Restaurant Manager is a Wix Blocks application that provides a complete restaurant management solution for Wix-powered websites. Built by **Namaste GIEN -- Restaurant Indien**, a premium casual Indian restaurant in Gien, Loire Valley, France, this app brings professional-grade restaurant tools to the Wix App Market and its 258M+ users.

The app delivers four customer-facing widgets and a full management dashboard:

- **Menu Display** -- Showcase your menu with multiple layout options and rich dietary information.
- **Online Ordering** -- Accept delivery, pickup, and dine-in orders with real-time status tracking.
- **Table Reservations** -- Let guests book tables with smart scheduling and double-booking prevention.
- **Delivery Management** -- Configure delivery zones, calculate fees, and provide estimated delivery times.

All widgets include bilingual support (French / English) out of the box, with additional languages configurable through the settings panel.

---

## Screenshots

<!-- Screenshot placeholders -->

### Menu Widget
<!-- Screenshot: Menu widget in grid layout showing category tabs and dietary filters -->

### Order Widget
<!-- Screenshot: Order widget with cart summary, delivery options, and running total -->

### Reservation Widget
<!-- Screenshot: Reservation widget with date/time picker and party size selector -->

### Delivery Widget
<!-- Screenshot: Delivery widget showing zone map and fee calculation -->

### Dashboard
<!-- Screenshot: Dashboard overview with orders list, reservation calendar, and analytics charts -->

---

## Features

### Menu Widget

- Four display layouts: grid, list, card, and editorial
- Category tabs for organized navigation (Starters, Mains, Desserts, Drinks, etc.)
- Dietary filters: vegetarian, vegan, gluten-free, halal, nut-free
- Spice level indicator (1-5 scale) with visual icon display
- Allergen icons conforming to EU allergen labeling standards
- Fully responsive design across desktop, tablet, and mobile
- RTL (right-to-left) language support

### Order Widget

- Shopping cart with running total and item quantity controls
- Three order types: delivery, pickup, and dine-in
- Minimum order validation per order type
- Real-time order status updates (placed, confirmed, preparing, ready, delivered)
- Automatic service fee and tax calculation
- Special instructions field per item
- Order confirmation with email and SMS notifications

### Reservation Widget

- Interactive date and time picker with availability display
- Party size selection from 1 to 20 guests
- Occasion tags: birthday, anniversary, business, date night, celebration
- Double-booking prevention with intelligent table allocation
- Waitlist management for fully booked time slots
- Automated reservation confirmation and reminder notifications

### Delivery Widget

- Zone-based delivery coverage configuration
- Dynamic fee calculation based on distance and order value
- Estimated delivery time display
- Live order tracking for customers
- Configurable delivery hours and blackout periods

### Dashboard

- **Orders Management** -- View, filter, and update all incoming orders in real time
- **Reservation Calendar** -- Visual calendar with daily, weekly, and monthly views
- **Analytics** -- Revenue tracking, popular items ranking, peak hours analysis, and customer trends

---

## Pricing Tiers

| Feature | Free | Standard ($9.99/mo) | Premium ($24.99/mo) |
|---|:---:|:---:|:---:|
| Menu Widget | Yes | Yes | Yes |
| Menu Items Limit | 20 | 100 | Unlimited |
| Order Widget | -- | Yes | Yes |
| Reservation Widget | -- | Yes | Yes |
| Delivery Widget | -- | -- | Yes |
| Dashboard | Basic | Full | Full |
| Analytics | -- | 30-day history | Unlimited history |
| Notifications | Email only | Email + SMS | Email + SMS + Push |
| Support | Community | Email support | Priority support |

---

## Installation

1. Visit the **Wix App Market** and search for "Namaste Restaurant Manager."
2. Click **Add to Site** and authorize the app permissions.
3. Drag the desired widgets (Menu, Order, Reservation, Delivery) onto your site pages using the Wix Editor.
4. Open the **Settings Panel** from any widget to configure your restaurant details, hours, menu items, and preferences.

For detailed installation instructions and troubleshooting, see [docs/INSTALLATION.md](docs/INSTALLATION.md).

---

## Configuration

The Settings Panel provides the following configuration sections:

| Section | Description |
|---|---|
| **General** | Restaurant name, address, phone, logo, brand colors |
| **Hours** | Operating hours, holiday closures, special schedules |
| **Menu** | Categories, items, pricing, descriptions, dietary tags |
| **Ordering** | Order types, minimum order values, service fees, tax rates |
| **Delivery** | Delivery zones, fee rules, estimated times, driver notes |
| **Reservations** | Table inventory, time slots, party size limits, buffer times |
| **Appearance** | Layout selection, color overrides, font choices, custom CSS |

For the full configuration reference, see [docs/CONFIGURATION.md](docs/CONFIGURATION.md).

---

## Project Structure

```
namaste-wix-blocks-restaurant-app/
|-- assets/
|   |-- icons/
|       |-- delivery.svg
|       |-- gluten-free.svg
|       |-- halal.svg
|       |-- menu.svg
|       |-- order.svg
|       |-- reservation.svg
|       |-- spice.svg
|       |-- vegetarian.svg
|-- backend/
|   |-- delivery-api.js
|   |-- menu-api.js
|   |-- notifications.js
|   |-- orders-api.js
|   |-- reservations-api.js
|   |-- utils/
|       |-- pricing.js
|       |-- validation.js
|-- docs/
|-- public/
|   |-- constants.js
|   |-- types.js
|-- tests/
|   |-- menu.test.js
|   |-- orders.test.js
|   |-- reservations.test.js
|-- wix-blocks/
|   |-- app.json
|   |-- collections/
|   |   |-- menu-items.json
|   |   |-- orders.json
|   |   |-- reservations.json
|   |-- dashboard/
|   |   |-- analytics-dashboard.js
|   |   |-- orders-dashboard.js
|   |   |-- reservations-dashboard.js
|   |-- panels/
|   |   |-- settings-panel/
|   |       |-- panel.js
|   |       |-- panel.json
|   |-- widgets/
|       |-- delivery-widget/
|       |   |-- widget.css
|       |   |-- widget.js
|       |   |-- widget.json
|       |-- menu-widget/
|       |   |-- widget.css
|       |   |-- widget.js
|       |   |-- widget.json
|       |-- order-widget/
|       |   |-- widget.css
|       |   |-- widget.js
|       |   |-- widget.json
|       |-- reservation-widget/
|           |-- widget.css
|           |-- widget.js
|           |-- widget.json
|-- .gitignore
|-- LICENSE
|-- package.json
|-- README.md
```

---

## Technology

| Technology | Purpose |
|---|---|
| **Wix Blocks 2.0** | App framework for building installable Wix applications |
| **Velo by Wix** | Server-side and client-side JavaScript runtime |
| **Wix Data API** | Database collections for menu items, orders, and reservations |
| **Wix CRM** | Customer management and contact data integration |
| **CSS Custom Properties** | Theming and brand color customization (Saffron Orange `#E8731A`, Gien Indigo Blue `#1B3A6B`) |
| **Responsive Design** | Mobile-first layouts with breakpoints for all device sizes |

---

## Development Setup

```bash
git clone https://github.com/user/namaste-wix-blocks-restaurant-app.git
cd namaste-wix-blocks-restaurant-app
npm install
npm test
```

**Requirements:**

- Node.js >= 18.0.0
- npm >= 9.0.0

**Available scripts:**

| Command | Description |
|---|---|
| `npm test` | Run the test suite with coverage reporting |
| `npm run test:watch` | Run tests in watch mode during development |
| `npm run lint` | Run ESLint across the codebase |
| `npm run validate` | Validate Wix Blocks collection and widget schemas |

---

## API Documentation

The backend exposes the following APIs through Velo web modules:

| API Module | File | Description |
|---|---|---|
| **Menu API** | `backend/menu-api.js` | CRUD operations for menu categories and items, dietary tag filtering, search |
| **Orders API** | `backend/orders-api.js` | Order creation, status updates, order history, cart validation |
| **Reservations API** | `backend/reservations-api.js` | Table booking, availability checks, waitlist management, cancellations |
| **Delivery API** | `backend/delivery-api.js` | Zone configuration, fee calculation, delivery time estimation, tracking |
| **Notifications** | `backend/notifications.js` | Email, SMS, and push notification dispatch for orders and reservations |

Utility modules:

| Module | File | Description |
|---|---|---|
| **Pricing** | `backend/utils/pricing.js` | Tax calculation, service fee logic, delivery fee rules |
| **Validation** | `backend/utils/validation.js` | Input validation for orders, reservations, and menu data |

For the complete API reference with request/response schemas, see [docs/API.md](docs/API.md).

---

## Contributing

Contributions are welcome. To get started:

1. **Fork** the repository.
2. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following the existing code style and conventions.
4. **Add or update tests** for any new functionality.
5. **Update documentation** if your changes affect the public API or configuration.
6. **Commit** with a clear, descriptive message:
   ```bash
   git commit -m "Add: brief description of your change"
   ```
7. **Push** your branch and open a **Pull Request** against `main`.

Please ensure all tests pass (`npm test`) and linting is clean (`npm run lint`) before submitting your PR.

---

## License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for the full text.

Copyright (c) 2026 Namaste GIEN -- Restaurant Indien

---

## Support

- **Bug Reports and Feature Requests** -- [Open an issue](../../issues) on this repository.
- **Email** -- [contact@namastegien.fr](mailto:contact@namastegien.fr)
- **Documentation** -- See the [docs/](docs/) directory for detailed guides.
