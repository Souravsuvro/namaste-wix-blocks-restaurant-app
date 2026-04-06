# Wix App Market Submission Guide

This document covers the process for submitting the Namaste Restaurant Manager to the Wix App Market.

---

## Pre-Submission Checklist

- [ ] All widgets render correctly in Wix Editor and Preview
- [ ] Settings panel saves and applies all configuration options
- [ ] Dashboard pages load data and perform CRUD operations
- [ ] CMS collections are properly defined with correct field types
- [ ] Email notification templates are configured in Wix Triggered Emails
- [ ] App works in both French and English locales
- [ ] Responsive design verified on desktop, tablet, and mobile
- [ ] RTL layout tested
- [ ] Dark mode tested
- [ ] Error states and empty states display correctly
- [ ] Loading indicators appear during data fetches
- [ ] All backend APIs handle errors gracefully
- [ ] Input validation prevents XSS and injection
- [ ] Pricing calculations are accurate (subtotal, fees, tax, total)
- [ ] Order number generation produces unique values
- [ ] Reservation double-booking prevention works
- [ ] Delivery zone calculations are correct
- [ ] Test suite passes with acceptable coverage

---

## App Listing Details

### Title
Namaste Restaurant Manager

### Subtitle
Complete restaurant management with menu display, online ordering, reservations, and delivery tracking.

### Category
Restaurants & Food

### Description

```
Namaste Restaurant Manager is a complete restaurant management solution for Wix sites. Add professional menu displays, accept online orders, manage table reservations, and track deliveries — all from your Wix dashboard.

Key Features:

Menu Display
- Beautiful grid, list, card, and editorial layouts
- Category tabs and dietary filters (vegetarian, vegan, gluten-free, halal)
- Spice level indicators and allergen information
- Fully responsive with dark mode support

Online Ordering
- Full cart experience with running totals
- Support for delivery, pickup, and dine-in orders
- Service fee and tax calculation
- Real-time order status tracking

Table Reservations
- Date and time picker respecting restaurant hours
- Party size selection (1-20 guests)
- Special occasion tags
- Automatic double-booking prevention
- Waitlist for fully booked slots

Delivery Management
- Zone-based delivery with configurable radius
- Automatic fee calculation by distance
- Free delivery threshold
- Live order tracking with step-by-step timeline

Dashboard
- Real-time order management with status updates
- Reservation calendar with capacity overview
- Analytics: revenue charts, popular items, peak hours, customer stats
- Kitchen ticket printing

Fully configurable via the settings panel. Works with any restaurant type — from casual to fine dining. Bilingual support for French and English.
```

### Screenshots Required

1. Menu Widget — Grid layout with category tabs and dietary filters
2. Order Widget — Cart sidebar with order summary
3. Reservation Widget — Date/time picker with form
4. Delivery Widget — Zone display with tracking timeline
5. Orders Dashboard — Order list with status management
6. Analytics Dashboard — Revenue and popular items
7. Settings Panel — Configuration options

### App Icon

Use the Namaste GIEN circular logo (logo-icon-circular-1024.png) at 1024x1024.

---

## Pricing Configuration

### Free Tier — Starter
- **Price:** Free
- Menu Widget only
- Up to 20 menu items
- Basic styling options
- No ordering, reservations, or delivery

### Standard Tier
- **Price:** $9.99/month (USD)
- All 4 widgets
- Unlimited menu items
- Orders and Reservations dashboards
- Email notifications
- Full settings panel access

### Premium Tier
- **Price:** $24.99/month (USD)
- All Standard features
- Analytics dashboard
- Delivery zone management
- SMS notifications (via Wix CRM)
- Custom branding options
- Priority support

---

## Required Permissions

The app requests the following Wix permissions:

| Permission | Purpose |
|------------|---------|
| WIX_DATA.READ | Read menu items, orders, reservations from CMS |
| WIX_DATA.WRITE | Create/update orders, reservations, menu items |
| WIX_CRM.READ | Access customer contact information |
| WIX_CRM.WRITE | Create contacts from orders and reservations |
| WIX_NOTIFICATIONS.SEND | Send email confirmations and status updates |
| WIX_PAY.READ | Access payment information for orders |

---

## Testing Requirements

Before submission, verify the following:

### Functional Testing
1. Add a menu widget and verify it displays items from the CMS collection
2. Place a test order through the order widget (all three order types)
3. Book a reservation and verify double-booking prevention
4. Check delivery zone validation with in-zone and out-of-zone addresses
5. Use the dashboard to manage order statuses
6. Verify notification emails are sent for orders and reservations

### Edge Cases
- Empty menu (no items in collection)
- Sold-out items (isAvailable = false)
- Past date selection in reservation picker
- Monday selection (closed day)
- Below minimum order amount
- Out of delivery zone address
- Full capacity time slot (waitlist flow)

### Responsive Testing
- Desktop (1280px+)
- Tablet (768px-1279px)
- Mobile (320px-767px)
- RTL layout direction

---

## Review Process

1. **Submit** the app through the Wix Developers Center
2. **Initial Review** (1-3 business days): Wix team checks app functionality and listing
3. **Technical Review** (3-5 business days): Code review, security audit, performance check
4. **Listing Review**: Screenshots, description, pricing verified
5. **Approval/Feedback**: Either approved for the market or returned with revision requests

### Common Rejection Reasons
- Missing error handling or loading states
- Broken responsive layout
- Permissions broader than necessary
- Missing or inaccurate listing screenshots
- Pricing inconsistency between listing and app

---

## Post-Approval

### Monitoring
- Monitor the Wix Developers dashboard for reviews and ratings
- Respond to user support requests promptly
- Track install and uninstall rates

### Updates
- Increment the version in `app.json` and `package.json`
- Document changes in a changelog
- Submit update through the Developers Center
- Updates go through a lighter review process

### Versioning
Follow semantic versioning:
- **Patch** (1.0.x): Bug fixes, minor UI tweaks
- **Minor** (1.x.0): New features, new settings options
- **Major** (x.0.0): Breaking changes, major redesigns
