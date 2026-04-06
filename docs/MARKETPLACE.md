# Wix App Market Submission Guide

This document covers the process of submitting the Namaste Restaurant Manager app to the Wix App Market, including pre-submission requirements, listing details, pricing configuration, and the review process.

---

## Table of Contents

- [Pre-Submission Checklist](#pre-submission-checklist)
- [App Listing Details](#app-listing-details)
- [Pricing Configuration](#pricing-configuration)
- [Required Permissions Explanation](#required-permissions-explanation)
- [Testing Requirements](#testing-requirements)
- [Review Process Overview](#review-process-overview)
- [Post-Approval Steps](#post-approval-steps)
- [Update and Versioning](#update-and-versioning)

---

## Pre-Submission Checklist

Complete all of the following before submitting to the Wix App Market:

### Code quality

- [ ] All backend API functions have proper error handling and input validation.
- [ ] All user inputs are sanitized using the `sanitizeString` utility before storage.
- [ ] No hardcoded API keys, secrets, or credentials exist in the source code.
- [ ] All CMS collection permissions are correctly configured (see collection schemas).
- [ ] The app does not use deprecated Wix APIs.

### Functionality

- [ ] All four widgets render correctly in the Wix Editor and on the published site.
- [ ] Menu widget displays items with categories, filters, images, and dietary badges.
- [ ] Order widget supports all three order types (delivery, pickup, dine-in).
- [ ] Reservation widget handles booking, capacity checks, and waitlist functionality.
- [ ] Delivery widget shows zone information, fee calculation, and order tracking.
- [ ] Settings panel saves and loads all configuration values correctly.
- [ ] All three dashboard pages (Orders, Reservations, Analytics) function correctly.
- [ ] Email notifications send with correct template variables.

### Compatibility

- [ ] Widgets display correctly on desktop (1920px, 1440px, 1280px, 1024px).
- [ ] Widgets display correctly on tablet (768px).
- [ ] Widgets display correctly on mobile (375px, 414px).
- [ ] App works in both Wix Editor and Editor X.
- [ ] App supports both French (fr) and English (en) locales.

### Assets

- [ ] App icon prepared (512 x 512 px, PNG format).
- [ ] At least 3 screenshots prepared (1280 x 800 px minimum, PNG or JPG).
- [ ] App description written (see listing details below).
- [ ] Support email configured.
- [ ] Privacy policy URL available.

---

## App Listing Details

### Title

```
Namaste Restaurant Manager
```

Keep the title under 30 characters. Do not include version numbers or promotional language.

### Short Description

```
Complete restaurant management -- menu display, online ordering, table reservations, and delivery tracking for Wix sites.
```

Maximum 120 characters. This appears in search results and category listings.

### Full Description

```
Namaste Restaurant Manager is an all-in-one solution for restaurants on Wix.
Manage your entire restaurant operation from a single app.

MENU MANAGEMENT
Display your full menu with categories, dietary filters (vegetarian, vegan,
gluten-free, halal), allergen information, spice level indicators, and
beautiful imagery. Choose from four layout styles: Grid, List, Card, and
Editorial.

ONLINE ORDERING
Accept delivery, pickup, and dine-in orders directly through your website.
Automatic pricing calculation with configurable service fees, tax rates, and
delivery fees. Minimum order enforcement and real-time order status tracking.

TABLE RESERVATIONS
Let customers book tables online with date, time, and party size selection.
Automatic capacity management prevents overbooking. Waitlist support for
fully booked slots. Special occasion tagging for birthdays, anniversaries,
and more.

DELIVERY MANAGEMENT
Define your delivery zone by radius. Automatic fee calculation based on
distance with a free delivery threshold. Real-time delivery tracking with
step-by-step progress. Driver assignment from the admin dashboard.

DASHBOARD AND ANALYTICS
Manage orders and reservations from dedicated dashboard pages. View revenue
charts, popular items, and customer insights on the analytics dashboard.

EMAIL NOTIFICATIONS
Automatic order confirmations, reservation confirmations, waitlist updates,
and order status change notifications via Wix Triggered Emails.

FULLY CUSTOMIZABLE
Configure operating hours, closed days, pricing, delivery zones, and
appearance through an intuitive settings panel. Override styles with CSS
custom properties for advanced customization.

BILINGUAL SUPPORT
Full French and English localization. Menu items support dual-language
names and descriptions.
```

### Screenshots

Prepare screenshots that demonstrate the app's key features. Recommended set:

1. **Menu Widget** -- Full menu grid view with categories sidebar, dietary badges, and item images.
2. **Ordering Flow** -- Cart with items, order type selection, and checkout form.
3. **Reservation Widget** -- Date picker, time slot selection, and booking form.
4. **Delivery Zone** -- Map view with delivery zone overlay and fee calculator.
5. **Settings Panel** -- The configuration panel showing various settings sections.
6. **Orders Dashboard** -- Admin view with order list and status management.

Screenshot specifications:
- Minimum resolution: 1280 x 800 pixels
- Format: PNG or JPG
- No browser chrome or OS UI elements
- Show realistic sample data (not empty states)

### App Icon

- Size: 512 x 512 pixels
- Format: PNG with transparency
- The icon should feature the Namaste brand mark using the Saffron Orange (#E8731A) and Gien Indigo (#1B3A6B) colors.

### Category

Primary: **Restaurants & Food**

Tags: `restaurant`, `menu`, `ordering`, `reservations`, `delivery`, `food`

### Support Contact

- Support email: contact@namastegien.fr
- Documentation URL: Link to the hosted docs (INSTALLATION.md, CONFIGURATION.md, API.md)

---

## Pricing Configuration

The app offers three pricing tiers.

### Free -- Starter

- **Price:** $0.00/month
- **Features included:**
  - Menu widget only
  - Up to 20 menu items
  - Basic styling

This tier allows site owners to try the menu display functionality before committing to a paid plan. The order, reservation, and delivery widgets are not available on this plan.

### Standard

- **Price:** $9.99/month (USD)
- **Billing cycle:** Monthly
- **Features included:**
  - All 4 widgets (Menu, Ordering, Reservations, Delivery)
  - Unlimited menu items
  - Orders dashboard
  - Reservations dashboard
  - Email notifications (order confirmation, reservation confirmation, waitlist, status updates)

This is the recommended plan for most restaurants. It provides the full operational toolset.

### Premium

- **Price:** $24.99/month (USD)
- **Billing cycle:** Monthly
- **Features included:**
  - All Standard features
  - Analytics dashboard (revenue charts, popular items, customer insights)
  - Delivery zone management (advanced zone configuration)
  - SMS notifications (in addition to email)
  - Priority support
  - Custom branding (remove "Powered by Namaste" footer)

This tier is designed for high-volume restaurants that need analytics and advanced delivery management.

### Pricing notes

- All plans are billed monthly through the Wix App Market billing system.
- No annual billing option at launch (can be added in a future update).
- Free tier does not require payment information.
- Users can upgrade or downgrade at any time through the Wix Dashboard.

---

## Required Permissions Explanation

The app requests the following permissions during installation. Each must be justified in the submission.

| Permission | Justification |
|---|---|
| `WIX_DATA.READ` | Required to read menu items, orders, reservations, and app settings from CMS collections. The menu widget queries the `menu-items` collection, the dashboards query `orders` and `reservations`, and the settings panel reads from `app-settings`. |
| `WIX_DATA.WRITE` | Required to create orders and reservations submitted by customers, update order and reservation statuses from the admin dashboard, and save app settings. |
| `WIX_CRM.READ` | Required to access customer contact information for sending email notifications and linking orders to Wix contacts. |
| `WIX_CRM.WRITE` | Required to create new contacts when customers place orders or make reservations, and to send triggered emails through the `wix-crm.emailContact` method. |
| `WIX_NOTIFICATIONS.SEND` | Required to send dashboard notifications to site admins when new orders are placed (the `notifyKitchen` function). |
| `WIX_PAY.READ` | Required to read payment status information for order processing and to display payment status on the orders dashboard. |

### Privacy considerations

- The app does not store personal data outside of Wix CMS collections.
- All customer data (names, emails, phones, addresses) is stored in the site owner's own CMS collections.
- The app does not transmit customer data to third-party services.
- The app does not use cookies beyond standard Wix session management.

---

## Testing Requirements

The Wix App Market review team will test the following. Ensure all scenarios pass before submission.

### Installation testing

- [ ] App installs without errors on a new Wix Editor site.
- [ ] App installs without errors on a new Editor X site.
- [ ] CMS collections are created automatically on installation.
- [ ] All widgets appear in the App Widgets panel after installation.
- [ ] Settings panel opens and displays default values.
- [ ] App uninstalls cleanly without leaving orphaned elements.

### Widget testing

- [ ] Menu widget renders with sample data.
- [ ] Menu widget handles empty state (no menu items) gracefully.
- [ ] Order widget completes a full ordering flow for each order type.
- [ ] Order widget validates required fields and shows clear error messages.
- [ ] Reservation widget completes a booking flow.
- [ ] Reservation widget shows correct availability per time slot.
- [ ] Delivery widget displays zone information and calculates fees.
- [ ] All widgets are responsive across desktop, tablet, and mobile breakpoints.

### Dashboard testing

- [ ] Orders dashboard lists orders and allows status updates.
- [ ] Reservations dashboard lists reservations and allows status management.
- [ ] Analytics dashboard renders charts with sample data (Premium plan only).

### Edge cases

- [ ] Placing an order below the minimum amount shows a clear error.
- [ ] Booking a reservation for a closed day is prevented.
- [ ] Attempting to book a fully booked time slot offers the waitlist option.
- [ ] Delivery address outside the delivery zone shows a clear out-of-zone message.
- [ ] Invalid status transitions (e.g., cancelling a delivered order) are rejected with an error.

### Performance

- [ ] Menu widget with 100+ items loads within 3 seconds.
- [ ] Dashboard pages with 500+ orders load within 5 seconds.
- [ ] No memory leaks during extended use of the settings panel.

---

## Review Process Overview

### Timeline

The typical review process takes 5 to 10 business days from submission.

### Review stages

1. **Automated checks** (Day 1) -- The Wix platform runs automated tests to verify the app installs, uninstalls, and does not contain known security issues.

2. **Manual QA review** (Days 2-5) -- A Wix reviewer installs the app on a test site and verifies functionality, responsiveness, and user experience.

3. **Security review** (Days 3-7) -- The review team checks for proper data handling, input validation, and permission usage. They verify that permissions requested match actual usage.

4. **Content review** (Days 5-8) -- The listing description, screenshots, and icon are reviewed for quality, accuracy, and compliance with Wix App Market guidelines.

5. **Approval or feedback** (Days 7-10) -- You will receive either an approval notification or a list of required changes. If changes are needed, address them and resubmit.

### Common rejection reasons

- Widgets do not work on mobile viewports.
- Error messages are not user-friendly (showing raw error objects instead of readable text).
- Missing or incorrect permission justifications.
- Screenshots do not accurately represent the app.
- App description contains promotional superlatives without substantiation.
- CMS collection permissions are too permissive (e.g., allowing anyone to read orders).

### Resubmission

If the app is rejected, you will receive specific feedback. Make the required changes and resubmit through the Wix Developers Center. Resubmissions typically have a shorter review cycle (3-5 business days).

---

## Post-Approval Steps

After the app is approved and published on the Wix App Market:

### Launch checklist

1. **Verify the listing** -- Visit your app's page on the Wix App Market and confirm the title, description, screenshots, and pricing display correctly.
2. **Test a fresh install** -- Install the app on a new test site to verify the published version works as expected.
3. **Monitor initial reviews** -- Check the App Market for user reviews in the first few weeks and respond promptly to any issues.
4. **Set up support channels** -- Ensure the support email is monitored and response times are within 24 hours.

### Analytics

After publishing, you can access the following metrics in the Wix Developers Center:

- Total installations and uninstallations
- Active installations by plan tier
- Revenue reports (for paid plans)
- User reviews and ratings
- Crash and error reports

### Support expectations

- Respond to user support requests within 24 hours.
- Maintain an uptime target of 99.9% for backend functions.
- Address critical bugs within 48 hours of report.

---

## Update and Versioning

### Version numbering

Follow semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR** (e.g., 1.0.0 to 2.0.0) -- Breaking changes to the API, CMS schema changes, or significant feature overhauls.
- **MINOR** (e.g., 1.0.0 to 1.1.0) -- New features, new widgets, or new settings that are backward compatible.
- **PATCH** (e.g., 1.0.0 to 1.0.1) -- Bug fixes, performance improvements, and minor UI adjustments.

The current version is `1.0.0` as defined in `wix-blocks/app.json`.

### Submitting updates

1. Update the `version` field in `wix-blocks/app.json`.
2. Document changes in a changelog (recommended but not required by Wix).
3. Submit the updated app through the Wix Developers Center.
4. Updates go through a lighter review process (typically 2-3 business days).

### Update guidelines

- **Never remove features** in a minor or patch update. Users rely on existing functionality.
- **CMS collection schema changes** require careful migration. If adding new fields, provide default values. Never rename or remove existing fields in a minor update.
- **Settings changes** should always be backward compatible. New settings should have sensible defaults so existing installations continue to work without reconfiguration.
- **Test the upgrade path** by installing the previous version, adding data, then upgrading to the new version. Verify no data loss occurs.

### Deprecation policy

If a feature must be removed:

1. Mark it as deprecated in a MINOR release with a warning in the settings panel.
2. Maintain the deprecated feature for at least two MINOR releases.
3. Remove the feature in a MAJOR release.
4. Communicate the deprecation timeline in the app update description and support channels.

### Rollback

If a critical issue is discovered after an update:

1. Revert to the previous version in the Wix Developers Center.
2. Submit the reverted version as a new patch update.
3. Notify affected users through the support channel.

---

For installation steps, see the [Installation Guide](./INSTALLATION.md).
For configuration options, see the [Configuration Guide](./CONFIGURATION.md).
For API documentation, see the [API Reference](./API.md).
