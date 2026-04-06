# Installation Guide

This guide walks you through installing, configuring, and launching the Namaste Restaurant Manager app on your Wix site.

---

## Prerequisites

Before you begin, make sure you have the following:

- **A Wix account** -- Sign up at [wix.com](https://www.wix.com) if you do not already have one.
- **A Wix Editor or Editor X site** -- The app is compatible with both the standard Wix Editor and Editor X (responsive editor). Wix Studio sites are also supported.
- **Site Owner or Admin permissions** -- You must have full editing access to the site where the app will be installed.
- **A published Wix site** (recommended) -- While you can install and configure the app on an unpublished site, testing the full ordering and reservation flows requires a live site with a connected domain or a free Wix URL.

---

## Step 1: Install from the Wix App Market

1. Open your site in the Wix Editor.
2. Click the **App Market** icon in the left sidebar (the icon resembles a grid of squares).
3. In the search bar, type **"Namaste Restaurant Manager"**.
4. Locate the app in the search results and click **Add to Site**.
5. Review the required permissions (see the Permissions section below) and click **Agree & Add**.
6. The app will be added to your site. You will see a confirmation message once installation is complete.

### Permissions requested during installation

| Permission | Purpose |
|---|---|
| `WIX_DATA.READ` | Read menu items, orders, and reservations from CMS collections |
| `WIX_DATA.WRITE` | Create and update orders, reservations, and settings |
| `WIX_CRM.READ` | Access customer contact information for notifications |
| `WIX_CRM.WRITE` | Create contacts and send triggered emails |
| `WIX_NOTIFICATIONS.SEND` | Send dashboard notifications to site admins |
| `WIX_PAY.READ` | Read payment status for order processing |

---

## Step 2: Add Widgets to Site Pages

The app includes four widgets. You can add any combination of them to your site pages.

### Restaurant Menu Widget

1. Open the page where you want to display the menu (for example, a page named "Menu").
2. Click the **Add** button (+) in the left toolbar, then select **App Widgets**.
3. Under the Namaste Restaurant Manager section, find **Restaurant Menu** and drag it onto the page.
4. Resize and position the widget as needed. The default size is 980 x 600 pixels.
5. The widget will automatically connect to the `menu-items` CMS collection.

### Online Ordering Widget

1. Navigate to the page designated for online ordering (for example, "Order Online").
2. Click **Add** (+) > **App Widgets** > **Online Ordering** and drag it onto the page.
3. The default size is 980 x 700 pixels. Adjust as needed.
4. This widget includes a cart, checkout flow, and order type selection (delivery, pickup, dine-in).

### Table Reservations Widget

1. Open the page for reservations (for example, "Reservations" or "Book a Table").
2. Click **Add** (+) > **App Widgets** > **Table Reservations** and drag it onto the page.
3. The default size is 600 x 500 pixels. This widget includes date/time selection, party size input, and a booking form.

### Delivery Zone and Tracking Widget

1. Add this widget to the ordering page or a dedicated delivery information page.
2. Click **Add** (+) > **App Widgets** > **Delivery Zone & Tracking** and drag it onto the page.
3. The default size is 700 x 500 pixels. This widget shows a delivery zone map, fee calculator, and order tracking interface.

---

## Step 3: Configure CMS Collections

The app automatically creates three CMS (Content Management System) collections when installed. Verify they exist and understand their structure.

### menu-items Collection

Stores all menu item data. Key fields:

| Field | Type | Required | Description |
|---|---|---|---|
| name | Text | Yes | Item name |
| description | Text | No | Item description |
| price | Number | Yes | Price in the configured currency |
| category | Text | Yes | One of: Entrees, Plats Principaux, Tandoori & Grillades, Biryani & Riz, Desserts, Bar & Cocktails |
| image | Image | No | Item photo |
| spiceLevel | Number | No | Spice level from 0 to 5 |
| allergens | Tags | No | Allergen identifiers (nuts, dairy, gluten, shellfish, eggs, soy, celery, mustard, sesame) |
| isVegetarian | Boolean | No | Whether the item is vegetarian |
| isVegan | Boolean | No | Whether the item is vegan |
| isGlutenFree | Boolean | No | Whether the item is gluten-free |
| isHalal | Boolean | No | Whether the item is halal |
| isAvailable | Boolean | No | Whether the item is currently available (default: true) |
| sortOrder | Number | No | Display order within its category (default: 0) |

**Permissions:** Anyone can read; only Admin can write.

### orders Collection

Stores customer orders. Key fields:

| Field | Type | Required | Description |
|---|---|---|---|
| orderNumber | Text | Yes | Auto-generated unique order number |
| items | RichContent | Yes | JSON-encoded array of cart items |
| subtotal | Number | Yes | Subtotal before fees and tax |
| serviceFee | Number | No | Calculated service fee |
| deliveryFee | Number | No | Delivery fee (0 for pickup/dine-in) |
| tax | Number | No | Tax amount |
| total | Number | Yes | Grand total |
| status | Text | Yes | One of: new, confirmed, preparing, ready, out-for-delivery, delivered, picked-up, cancelled |
| orderType | Text | Yes | One of: delivery, pickup, dine-in |
| customerName | Text | Yes | Customer full name |
| customerPhone | Text | Yes | Customer phone number |
| customerEmail | Text | No | Customer email for notifications |
| deliveryAddress | Text | No | Required for delivery orders |
| estimatedTime | Number | No | Estimated minutes until ready/delivered |
| createdAt | DateTime | Yes | Timestamp of order placement |

**Permissions:** Only Admin can read; Anyone can write (to allow order placement).

### reservations Collection

Stores table reservations. Key fields:

| Field | Type | Required | Description |
|---|---|---|---|
| date | Date | Yes | Reservation date |
| time | Text | Yes | Time slot in HH:MM format |
| partySize | Number | Yes | Number of guests (1-20) |
| customerName | Text | Yes | Guest name |
| customerEmail | Text | Yes | Guest email |
| customerPhone | Text | Yes | Guest phone number |
| occasion | Text | No | One of: none, birthday, anniversary, business, date-night, celebration, other |
| status | Text | Yes | One of: pending, confirmed, seated, completed, cancelled, no-show, waitlisted |
| notes | Text | No | Special requests |
| tableNumber | Number | No | Assigned table (set by staff) |
| createdAt | DateTime | Yes | Timestamp of booking |

**Permissions:** Only Admin can read; Anyone can write (to allow reservation booking).

---

## Step 4: Add Initial Menu Data

1. Go to your Wix Dashboard and open the **CMS** section (Content Manager).
2. Click on the **menu-items** collection.
3. Click **New Item** to add your first menu item.
4. Fill in the required fields: **name**, **price**, and **category**.
5. Optionally add a description, image, spice level, allergens, and dietary flags.
6. Set **isAvailable** to `true` to make the item visible on the menu widget.
7. Repeat for all menu items.

**Tip:** You can use the **Import** feature in the CMS to bulk-import menu items from a CSV file. Use the column headers: `name`, `description`, `price`, `category`, `spiceLevel`, `isVegetarian`, `isVegan`, `isGlutenFree`, `isHalal`, `isAvailable`, `sortOrder`.

### Recommended categories

The app supports the following six default categories:

1. Entrees
2. Plats Principaux
3. Tandoori & Grillades
4. Biryani & Riz
5. Desserts
6. Bar & Cocktails

---

## Step 5: Configure the Settings Panel

1. In the Wix Editor, click on any of the Namaste Restaurant Manager widgets.
2. Click the **Settings** icon (gear icon) that appears above or beside the widget.
3. The Restaurant Settings panel will open on the right side of the editor.
4. Configure each section:

   - **General Settings** -- Set your restaurant name, currency (EUR, USD, or GBP), and language (French or English).
   - **Operating Hours** -- Select closed days and set lunch/dinner start and end times.
   - **Menu Widget** -- Choose layout style (grid, list, card, editorial), column count, items per page, and toggle visibility for spice levels, allergens, dietary badges, and images.
   - **Ordering** -- Enable or disable delivery, pickup, and dine-in order types. Set minimum order amount, service fee percentage, and tax percentage.
   - **Delivery Zones** -- Configure maximum delivery radius, base delivery fee, per-km fee, and the free delivery threshold.
   - **Reservations** -- Set maximum party size, capacity per time slot, slot duration, and enable or disable the waitlist.
   - **Appearance** -- Choose primary color, accent color, background color, and body font.

5. All changes save automatically.

For detailed information about each setting, see the [Configuration Guide](./CONFIGURATION.md).

---

## Step 6: Set Up Email Templates

The app uses Wix Triggered Emails to send notifications. You need to create the following email templates in your Wix Dashboard.

### Creating triggered email templates

1. Go to your Wix Dashboard.
2. Navigate to **Marketing & SEO** > **Email Marketing** > **Triggered Emails**.
3. Create the following templates:

#### Order Confirmation (`orderConfirmation`)

Create a template with the ID `orderConfirmation` and include these merge variables:

- `{{orderNumber}}` -- The order number
- `{{customerName}}` -- Customer name
- `{{orderType}}` -- Order type (Delivery, Pickup, or Dine-in)
- `{{items}}` -- Formatted list of ordered items
- `{{subtotal}}` -- Subtotal amount
- `{{serviceFee}}` -- Service fee
- `{{deliveryFee}}` -- Delivery fee
- `{{tax}}` -- Tax amount
- `{{total}}` -- Grand total
- `{{estimatedTime}}` -- Estimated preparation/delivery time
- `{{deliveryAddress}}` -- Delivery address (if applicable)
- `{{specialInstructions}}` -- Any special instructions

#### Reservation Confirmation (`reservationConfirmation`)

Create a template with the ID `reservationConfirmation` and include these merge variables:

- `{{customerName}}` -- Guest name
- `{{date}}` -- Reservation date (formatted)
- `{{time}}` -- Reservation time
- `{{partySize}}` -- Number of guests
- `{{occasion}}` -- Occasion (if specified)
- `{{notes}}` -- Special requests
- `{{restaurantName}}` -- Restaurant name
- `{{restaurantAddress}}` -- Restaurant address
- `{{restaurantPhone}}` -- Restaurant phone number

#### Waitlist Confirmation (`waitlistConfirmation`)

Create a template with the ID `waitlistConfirmation` and include these merge variables:

- `{{customerName}}` -- Guest name
- `{{date}}` -- Requested date
- `{{time}}` -- Requested time
- `{{partySize}}` -- Party size

#### Order Status Update (`orderStatusUpdate`)

Create a template with the ID `orderStatusUpdate` and include these merge variables:

- `{{customerName}}` -- Customer name
- `{{orderNumber}}` -- Order number
- `{{status}}` -- Human-readable status message

---

## Step 7: Test the Live Site

Before going live, thoroughly test all features.

### Menu display

1. Preview your site or publish it.
2. Navigate to the menu page and verify that all menu items appear correctly.
3. Test category filtering by clicking on different categories.
4. Test dietary filters (Vegetarian, Vegan, Gluten-Free, Halal).
5. Verify that images, spice levels, allergens, and prices display correctly.

### Ordering flow

1. Add items to the cart from the menu.
2. Proceed to checkout.
3. Test each enabled order type (delivery, pickup, dine-in).
4. For delivery orders, enter an address within the delivery zone and verify the fee calculation.
5. Complete a test order and verify that the order appears in the Orders dashboard.
6. Verify that the order confirmation email is sent.

### Reservation flow

1. Navigate to the reservations page.
2. Select a date, time slot, and party size.
3. Fill in guest information and submit.
4. Verify that the reservation appears in the Reservations dashboard.
5. Verify that the confirmation email is sent.

### Dashboard

1. Open the Wix Dashboard and navigate to the app's dashboard pages.
2. Verify the **Orders** dashboard shows incoming orders and allows status updates.
3. Verify the **Reservations** dashboard shows bookings and allows status management.
4. If on the Premium plan, verify the **Analytics** dashboard displays charts and insights.

---

## Troubleshooting

### Widgets do not appear on the page

- Make sure the app is fully installed. Go to **Manage Apps** in the Wix Dashboard and verify Namaste Restaurant Manager is listed.
- Try removing and re-adding the widget from the App Widgets panel.
- Clear your browser cache and reload the editor.

### Menu items do not display

- Check the **menu-items** CMS collection and confirm that items exist with `isAvailable` set to `true`.
- Verify the collection permissions: Read should be set to "Anyone."
- Check the browser console for errors (right-click > Inspect > Console).

### Orders are not being saved

- Verify the **orders** collection exists and that Write permissions are set to "Anyone."
- Check that all required fields (customerName, customerPhone, items, orderType) are being provided.
- Review the browser console for validation error messages.

### Reservations fail to book

- Confirm the **reservations** collection exists with Write permissions set to "Anyone."
- Make sure the selected time slot has remaining capacity. Check the slot capacity in the settings panel.
- Verify the date is not in the past and falls on an open day (not a closed day).

### Email notifications are not sent

- Confirm that the triggered email templates exist with the correct template IDs: `orderConfirmation`, `reservationConfirmation`, `waitlistConfirmation`, `orderStatusUpdate`.
- Verify that the customer provided a valid email address.
- Check the Wix Triggered Email logs in the Dashboard under Marketing & SEO > Email Marketing.

### Delivery zone check returns unexpected results

- Verify the restaurant coordinates are correctly set (default: 47.6847, 2.6286 for Gien, France).
- Check the maximum delivery radius setting in the Settings Panel.
- Ensure the customer coordinates (latitude, longitude) are being passed correctly.

### Settings are not saving

- Make sure you have Admin permissions on the site.
- Check the browser console for errors related to the `app-settings` collection.
- Try refreshing the editor and opening the settings panel again.

### Performance issues

- If the menu loads slowly, consider reducing the "Items per Page" setting.
- Ensure images are optimized (Wix automatically optimizes uploaded images, but externally linked images may not be).
- Check that CMS collection indexes are in place (they are created automatically on installation).

---

For more detailed configuration options, see the [Configuration Guide](./CONFIGURATION.md).
For API documentation, see the [API Reference](./API.md).
