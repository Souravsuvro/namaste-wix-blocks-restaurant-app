/**
 * Email and SMS notification service — Velo Web Module.
 * Uses Wix Triggered Emails and wix-crm for contact management.
 * @module notifications
 */
import wixCrm from 'wix-crm';
import { formatPrice } from './utils/pricing';

/**
 * Sends an order confirmation email to the customer.
 * @param {Object} order - The order object
 * @returns {Promise<void>}
 */
export async function sendOrderConfirmation(order) {
  if (!order.customerEmail) return;

  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
  const itemList = items.map(item =>
    `${item.quantity}x ${item.name} — ${formatPrice(item.price * item.quantity)}`
  ).join('\n');

  try {
    await wixCrm.emailContact('orderConfirmation', order.customerEmail, {
      variables: {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        orderType: formatOrderType(order.orderType),
        items: itemList,
        subtotal: formatPrice(order.subtotal),
        serviceFee: formatPrice(order.serviceFee),
        deliveryFee: formatPrice(order.deliveryFee || 0),
        tax: formatPrice(order.tax),
        total: formatPrice(order.total),
        estimatedTime: `${order.estimatedTime || 30} minutes`,
        deliveryAddress: order.deliveryAddress || 'N/A',
        specialInstructions: order.specialInstructions || 'None',
      },
    });
  } catch (err) {
    console.error('Failed to send order confirmation email:', err);
  }
}

/**
 * Notifies the kitchen/staff about a new order.
 * @param {Object} order
 * @returns {Promise<void>}
 */
export async function notifyKitchen(order) {
  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;

  try {
    await wixCrm.notifications.notify(
      `New ${formatOrderType(order.orderType)} order #${order.orderNumber}`,
      ['Dashboard'],
      {
        title: `Order #${order.orderNumber}`,
        body: `${items.length} item(s) — ${formatPrice(order.total)} — ${order.customerName}`,
        actionUrl: `/dashboard/orders?id=${order._id}`,
      }
    );
  } catch (err) {
    console.error('Failed to send kitchen notification:', err);
  }
}

/**
 * Sends a reservation confirmation email.
 * @param {Object} reservation
 * @returns {Promise<void>}
 */
export async function sendReservationConfirmation(reservation) {
  if (!reservation.customerEmail) return;

  const dateStr = new Date(reservation.date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  try {
    await wixCrm.emailContact('reservationConfirmation', reservation.customerEmail, {
      variables: {
        customerName: reservation.customerName,
        date: dateStr,
        time: reservation.time,
        partySize: String(reservation.partySize),
        occasion: reservation.occasion !== 'none' ? reservation.occasion : '',
        notes: reservation.notes || 'None',
        restaurantName: 'Namaste GIEN — Restaurant Indien',
        restaurantAddress: '12 Quai de Nice, 45500 Gien, France',
        restaurantPhone: '+33 2 38 XX XX XX',
      },
    });
  } catch (err) {
    console.error('Failed to send reservation confirmation:', err);
  }
}

/**
 * Sends a waitlist notification when a spot opens up.
 * @param {Object} reservation - The waitlisted reservation
 * @returns {Promise<void>}
 */
export async function sendWaitlistNotification(reservation) {
  if (!reservation.customerEmail) return;

  try {
    await wixCrm.emailContact('waitlistConfirmation', reservation.customerEmail, {
      variables: {
        customerName: reservation.customerName,
        date: new Date(reservation.date).toLocaleDateString('fr-FR'),
        time: reservation.time,
        partySize: String(reservation.partySize),
      },
    });
  } catch (err) {
    console.error('Failed to send waitlist notification:', err);
  }
}

/**
 * Sends an order status update notification.
 * @param {Object} order
 * @param {string} newStatus
 * @returns {Promise<void>}
 */
export async function sendOrderStatusUpdate(order, newStatus) {
  if (!order.customerEmail) return;

  const statusMessages = {
    'confirmed': 'Your order has been confirmed!',
    'preparing': 'Your order is being prepared.',
    'ready': 'Your order is ready!',
    'out-for-delivery': 'Your order is on its way!',
    'delivered': 'Your order has been delivered. Bon appétit!',
    'picked-up': 'Your order has been picked up. Bon appétit!',
    'cancelled': 'Your order has been cancelled.',
  };

  try {
    await wixCrm.emailContact('orderStatusUpdate', order.customerEmail, {
      variables: {
        customerName: order.customerName,
        orderNumber: order.orderNumber,
        status: statusMessages[newStatus] || `Status updated to: ${newStatus}`,
      },
    });
  } catch (err) {
    console.error('Failed to send order status update:', err);
  }
}

/**
 * Formats order type for display.
 * @param {string} orderType
 * @returns {string}
 */
function formatOrderType(orderType) {
  const labels = {
    'delivery': 'Delivery',
    'pickup': 'Pickup',
    'dine-in': 'Dine-in',
  };
  return labels[orderType] || orderType;
}
