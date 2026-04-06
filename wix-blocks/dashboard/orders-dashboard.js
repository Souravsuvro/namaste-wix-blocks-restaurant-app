/**
 * Orders Dashboard — Velo page code for the order management dashboard.
 * Lists all orders, filters by status, allows status changes, and prints kitchen tickets.
 */
import wixData from 'wix-data';
import { updateOrderStatus, cancelOrder } from 'backend/orders-api';
import { sendOrderStatusUpdate } from 'backend/notifications';
import { formatPrice } from 'backend/utils/pricing';

/** Active status filter */
let currentFilter = 'all';

/** Polling interval ID */
let pollInterval = null;

$w.onReady(async function () {
  await loadOrders();
  bindFilters();
  bindActions();
  startPolling();
});

/**
 * Loads orders from the database and populates the dashboard table.
 * @param {string} [status='all'] - Filter by status
 */
async function loadOrders(status = 'all') {
  showLoading(true);

  try {
    let query = wixData.query('orders')
      .descending('createdAt')
      .limit(100);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const result = await query.find();
    const orders = result.items.map(order => ({
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
      formattedTotal: formatPrice(order.total),
      formattedDate: new Date(order.createdAt).toLocaleString('fr-FR'),
      statusBadge: getStatusBadge(order.status),
      itemSummary: formatItemSummary(order.items),
    }));

    if (orders.length === 0) {
      showEmptyState(true);
    } else {
      showEmptyState(false);
      renderOrdersTable(orders);
    }

    updateStatusCounts(result.items);
  } catch (err) {
    console.error('Failed to load orders:', err);
    showError('Failed to load orders. Please refresh.');
  } finally {
    showLoading(false);
  }
}

/**
 * Renders orders into the repeater/table.
 * @param {Array} orders
 */
function renderOrdersTable(orders) {
  $w('#ordersRepeater').data = orders;
  $w('#ordersRepeater').onItemReady(($item, itemData) => {
    $item('#orderNumber').text = `#${itemData.orderNumber}`;
    $item('#orderType').text = formatOrderType(itemData.orderType);
    $item('#customerName').text = itemData.customerName;
    $item('#customerPhone').text = itemData.customerPhone;
    $item('#orderItems').text = itemData.itemSummary;
    $item('#orderTotal').text = itemData.formattedTotal;
    $item('#orderDate').text = itemData.formattedDate;
    $item('#orderStatus').text = itemData.statusBadge.label;

    // Status action buttons
    const nextStatuses = getNextStatuses(itemData.status);
    if (nextStatuses.length > 0) {
      $item('#actionButton').label = nextStatuses[0].label;
      $item('#actionButton').show();
      $item('#actionButton').onClick(async () => {
        await handleStatusChange(itemData._id, nextStatuses[0].value, itemData);
      });
    } else {
      $item('#actionButton').hide();
    }

    // Cancel button
    if (['new', 'confirmed'].includes(itemData.status)) {
      $item('#cancelButton').show();
      $item('#cancelButton').onClick(async () => {
        await handleCancel(itemData._id);
      });
    } else {
      $item('#cancelButton').hide();
    }

    // Print ticket
    $item('#printButton').onClick(() => printKitchenTicket(itemData));
  });
}

/**
 * Binds status filter tab clicks.
 */
function bindFilters() {
  const filters = ['all', 'new', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled'];

  filters.forEach(status => {
    const selector = `#filter_${status.replace(/-/g, '_')}`;
    try {
      $w(selector).onClick(() => {
        currentFilter = status;
        highlightActiveFilter(selector);
        loadOrders(status);
      });
    } catch (e) {
      // Filter button may not exist
    }
  });
}

/**
 * Binds action button handlers.
 */
function bindActions() {
  try {
    $w('#refreshButton').onClick(() => loadOrders(currentFilter));
  } catch (e) {
    // Button may not exist
  }
}

/**
 * Handles order status change.
 * @param {string} orderId
 * @param {string} newStatus
 * @param {Object} order
 */
async function handleStatusChange(orderId, newStatus, order) {
  try {
    await updateOrderStatus(orderId, newStatus);
    sendOrderStatusUpdate(order, newStatus).catch(console.error);
    await loadOrders(currentFilter);
  } catch (err) {
    showError(err.message);
  }
}

/**
 * Handles order cancellation.
 * @param {string} orderId
 */
async function handleCancel(orderId) {
  try {
    await cancelOrder(orderId);
    await loadOrders(currentFilter);
  } catch (err) {
    showError(err.message);
  }
}

/**
 * Prints a kitchen ticket for an order.
 * @param {Object} order
 */
function printKitchenTicket(order) {
  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
  const ticketHtml = `
    <div style="font-family: monospace; padding: 20px; max-width: 300px;">
      <h2 style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px;">
        NAMASTE GIEN
      </h2>
      <p><strong>Order:</strong> #${order.orderNumber}</p>
      <p><strong>Type:</strong> ${formatOrderType(order.orderType)}</p>
      <p><strong>Customer:</strong> ${order.customerName}</p>
      <p><strong>Phone:</strong> ${order.customerPhone}</p>
      ${order.deliveryAddress ? `<p><strong>Address:</strong> ${order.deliveryAddress}</p>` : ''}
      <hr>
      ${items.map(item => `
        <p><strong>${item.quantity}x</strong> ${item.name} — ${formatPrice(item.price * item.quantity)}
        ${item.instructions ? `<br><em>Note: ${item.instructions}</em>` : ''}</p>
      `).join('')}
      <hr>
      <p><strong>Total: ${formatPrice(order.total)}</strong></p>
      ${order.specialInstructions ? `<p><em>Instructions: ${order.specialInstructions}</em></p>` : ''}
      <p style="text-align: center; font-size: 11px; margin-top: 20px;">
        ${new Date(order.createdAt).toLocaleString('fr-FR')}
      </p>
    </div>
  `;

  const printWindow = window.open('', '_blank', 'width=350,height=600');
  printWindow.document.write(ticketHtml);
  printWindow.document.close();
  printWindow.print();
}

/**
 * Returns the next possible statuses for a given current status.
 * @param {string} status
 * @returns {Array<{ value: string, label: string }>}
 */
function getNextStatuses(status) {
  const transitions = {
    'new': [{ value: 'confirmed', label: 'Confirm' }],
    'confirmed': [{ value: 'preparing', label: 'Start Preparing' }],
    'preparing': [{ value: 'ready', label: 'Mark Ready' }],
    'ready': [
      { value: 'out-for-delivery', label: 'Out for Delivery' },
      { value: 'picked-up', label: 'Picked Up' },
    ],
    'out-for-delivery': [{ value: 'delivered', label: 'Delivered' }],
  };
  return transitions[status] || [];
}

/**
 * Returns a status badge object.
 * @param {string} status
 * @returns {{ label: string, color: string }}
 */
function getStatusBadge(status) {
  const badges = {
    'new': { label: 'New', color: '#E8731A' },
    'confirmed': { label: 'Confirmed', color: '#1B3A6B' },
    'preparing': { label: 'Preparing', color: '#D4A843' },
    'ready': { label: 'Ready', color: '#4CAF50' },
    'out-for-delivery': { label: 'On the Way', color: '#2196F3' },
    'delivered': { label: 'Delivered', color: '#4CAF50' },
    'picked-up': { label: 'Picked Up', color: '#4CAF50' },
    'cancelled': { label: 'Cancelled', color: '#C23B22' },
  };
  return badges[status] || { label: status, color: '#999' };
}

/**
 * Formats an item list into a brief summary string.
 * @param {Array|string} items
 * @returns {string}
 */
function formatItemSummary(items) {
  const parsed = typeof items === 'string' ? JSON.parse(items) : items;
  if (!Array.isArray(parsed)) return '';
  return parsed.map(i => `${i.quantity}x ${i.name}`).join(', ');
}

/**
 * Formats order type for display.
 * @param {string} type
 * @returns {string}
 */
function formatOrderType(type) {
  return { delivery: '🚗 Delivery', pickup: '🏃 Pickup', 'dine-in': '🍽️ Dine-in' }[type] || type;
}

/**
 * Updates the count badges on status filter tabs.
 * @param {Array} allOrders
 */
function updateStatusCounts(allOrders) {
  const counts = {};
  allOrders.forEach(o => {
    counts[o.status] = (counts[o.status] || 0) + 1;
  });

  Object.entries(counts).forEach(([status, count]) => {
    try {
      $w(`#count_${status.replace(/-/g, '_')}`).text = String(count);
    } catch (e) { /* noop */ }
  });
}

function highlightActiveFilter(activeSelector) {
  try { $w(activeSelector).style.fontWeight = 'bold'; } catch (e) { /* noop */ }
}

function showLoading(show) {
  try { show ? $w('#loadingIndicator').show() : $w('#loadingIndicator').hide(); } catch (e) { /* noop */ }
}

function showEmptyState(show) {
  try {
    show ? $w('#emptyState').show() : $w('#emptyState').hide();
    show ? $w('#ordersRepeater').hide() : $w('#ordersRepeater').show();
  } catch (e) { /* noop */ }
}

function showError(message) {
  try {
    $w('#errorMessage').text = message;
    $w('#errorMessage').show();
    setTimeout(() => { try { $w('#errorMessage').hide(); } catch (e) { /* noop */ } }, 5000);
  } catch (e) { /* noop */ }
}

/**
 * Starts polling for new orders every 30 seconds.
 */
function startPolling() {
  pollInterval = setInterval(() => loadOrders(currentFilter), 30000);
}
