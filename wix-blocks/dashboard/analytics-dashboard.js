/**
 * Analytics Dashboard — Velo page code for restaurant analytics.
 * Revenue charts, popular items, peak hours, and customer statistics.
 */
import wixData from 'wix-data';
import { formatPrice } from 'backend/utils/pricing';

/** Date range for analytics */
let startDate = getStartOfWeek();
let endDate = new Date();

$w.onReady(async function () {
  initDateRange();
  await loadAllAnalytics();
});

/**
 * Initializes date range selector.
 */
function initDateRange() {
  try {
    $w('#rangeToday').onClick(() => { setRange(0); loadAllAnalytics(); });
    $w('#rangeWeek').onClick(() => { setRange(7); loadAllAnalytics(); });
    $w('#rangeMonth').onClick(() => { setRange(30); loadAllAnalytics(); });
    $w('#range3Months').onClick(() => { setRange(90); loadAllAnalytics(); });
  } catch (e) { /* noop */ }
}

/**
 * Sets the date range to the last N days.
 * @param {number} days
 */
function setRange(days) {
  endDate = new Date();
  startDate = new Date();
  if (days === 0) {
    startDate.setHours(0, 0, 0, 0);
  } else {
    startDate.setDate(startDate.getDate() - days);
  }
}

/**
 * Loads all analytics data.
 */
async function loadAllAnalytics() {
  showLoading(true);
  try {
    await Promise.all([
      loadRevenueStats(),
      loadPopularItems(),
      loadPeakHours(),
      loadOrderTypeBreakdown(),
      loadCustomerStats(),
      loadReservationStats(),
    ]);
  } catch (err) {
    console.error('Analytics load error:', err);
    showError('Failed to load analytics data.');
  } finally {
    showLoading(false);
  }
}

/**
 * Loads revenue statistics.
 */
async function loadRevenueStats() {
  const orders = await queryOrders();
  const completed = orders.filter(o => !['cancelled'].includes(o.status));

  const totalRevenue = completed.reduce((sum, o) => sum + o.total, 0);
  const orderCount = completed.length;
  const avgOrder = orderCount > 0 ? totalRevenue / orderCount : 0;

  const deliveryRevenue = completed.filter(o => o.orderType === 'delivery').reduce((sum, o) => sum + o.total, 0);
  const pickupRevenue = completed.filter(o => o.orderType === 'pickup').reduce((sum, o) => sum + o.total, 0);
  const dineInRevenue = completed.filter(o => o.orderType === 'dine-in').reduce((sum, o) => sum + o.total, 0);

  setTextSafe('#totalRevenue', formatPrice(totalRevenue));
  setTextSafe('#totalOrders', String(orderCount));
  setTextSafe('#avgOrderValue', formatPrice(avgOrder));
  setTextSafe('#deliveryRevenue', formatPrice(deliveryRevenue));
  setTextSafe('#pickupRevenue', formatPrice(pickupRevenue));
  setTextSafe('#dineInRevenue', formatPrice(dineInRevenue));

  // Daily revenue breakdown
  const dailyRevenue = {};
  completed.forEach(o => {
    const day = new Date(o.createdAt).toLocaleDateString('fr-FR');
    dailyRevenue[day] = (dailyRevenue[day] || 0) + o.total;
  });

  const revenueData = Object.entries(dailyRevenue).map(([date, amount]) => ({
    date,
    amount: formatPrice(amount),
    rawAmount: amount,
  }));

  try {
    $w('#revenueRepeater').data = revenueData;
    $w('#revenueRepeater').onItemReady(($item, data) => {
      $item('#revDate').text = data.date;
      $item('#revAmount').text = data.amount;
    });
  } catch (e) { /* noop */ }
}

/**
 * Loads popular menu items by order frequency.
 */
async function loadPopularItems() {
  const orders = await queryOrders();
  const itemCounts = {};

  orders.forEach(order => {
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    if (!Array.isArray(items)) return;
    items.forEach(item => {
      if (!itemCounts[item.name]) {
        itemCounts[item.name] = { name: item.name, count: 0, revenue: 0 };
      }
      itemCounts[item.name].count += item.quantity;
      itemCounts[item.name].revenue += item.price * item.quantity;
    });
  });

  const popular = Object.values(itemCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((item, index) => ({
      _id: String(index),
      ...item,
      formattedRevenue: formatPrice(item.revenue),
    }));

  try {
    $w('#popularRepeater').data = popular;
    $w('#popularRepeater').onItemReady(($item, data) => {
      $item('#itemRank').text = `#${parseInt(data._id) + 1}`;
      $item('#itemName').text = data.name;
      $item('#itemOrdered').text = `${data.count} ordered`;
      $item('#itemRevenue').text = data.formattedRevenue;
    });
  } catch (e) { /* noop */ }
}

/**
 * Loads peak hours analysis.
 */
async function loadPeakHours() {
  const orders = await queryOrders();
  const hourCounts = {};

  orders.forEach(order => {
    const hour = new Date(order.createdAt).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const peakData = Object.entries(hourCounts)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .map(([hour, count]) => ({
      _id: hour,
      hour: `${String(hour).padStart(2, '0')}:00`,
      count,
      bar: '█'.repeat(Math.min(count, 30)),
    }));

  try {
    $w('#peakHoursRepeater').data = peakData;
    $w('#peakHoursRepeater').onItemReady(($item, data) => {
      $item('#peakHour').text = data.hour;
      $item('#peakCount').text = String(data.count);
      $item('#peakBar').text = data.bar;
    });
  } catch (e) { /* noop */ }

  // Find busiest hour
  if (peakData.length > 0) {
    const busiest = peakData.reduce((max, d) => d.count > max.count ? d : max, peakData[0]);
    setTextSafe('#busiestHour', busiest.hour);
  }
}

/**
 * Loads order type breakdown.
 */
async function loadOrderTypeBreakdown() {
  const orders = await queryOrders();
  const typeCounts = { delivery: 0, pickup: 0, 'dine-in': 0 };

  orders.forEach(o => {
    if (typeCounts[o.orderType] !== undefined) {
      typeCounts[o.orderType]++;
    }
  });

  const total = orders.length || 1;
  setTextSafe('#deliveryPercent', `${Math.round(typeCounts.delivery / total * 100)}%`);
  setTextSafe('#pickupPercent', `${Math.round(typeCounts.pickup / total * 100)}%`);
  setTextSafe('#dineInPercent', `${Math.round(typeCounts['dine-in'] / total * 100)}%`);
  setTextSafe('#deliveryCount', `${typeCounts.delivery} orders`);
  setTextSafe('#pickupCount', `${typeCounts.pickup} orders`);
  setTextSafe('#dineInCount', `${typeCounts['dine-in']} orders`);
}

/**
 * Loads customer statistics.
 */
async function loadCustomerStats() {
  const orders = await queryOrders();
  const customers = new Set();
  const customerOrders = {};

  orders.forEach(o => {
    const key = o.customerPhone || o.customerName;
    customers.add(key);
    customerOrders[key] = (customerOrders[key] || 0) + 1;
  });

  const totalCustomers = customers.size;
  const returningCustomers = Object.values(customerOrders).filter(c => c > 1).length;

  setTextSafe('#totalCustomers', String(totalCustomers));
  setTextSafe('#returningCustomers', String(returningCustomers));
  setTextSafe('#returnRate', totalCustomers > 0 ? `${Math.round(returningCustomers / totalCustomers * 100)}%` : '0%');
}

/**
 * Loads reservation statistics.
 */
async function loadReservationStats() {
  const result = await wixData.query('reservations')
    .ge('date', startDate)
    .le('date', endDate)
    .find();

  const reservations = result.items;
  const confirmed = reservations.filter(r => r.status === 'confirmed' || r.status === 'completed' || r.status === 'seated');
  const cancelled = reservations.filter(r => r.status === 'cancelled');
  const noShows = reservations.filter(r => r.status === 'no-show');
  const totalGuests = confirmed.reduce((sum, r) => sum + r.partySize, 0);

  setTextSafe('#totalReservations', String(reservations.length));
  setTextSafe('#confirmedReservations', String(confirmed.length));
  setTextSafe('#cancelledReservations', String(cancelled.length));
  setTextSafe('#noShowCount', String(noShows.length));
  setTextSafe('#totalGuests', String(totalGuests));
  setTextSafe('#avgPartySize', reservations.length > 0
    ? (totalGuests / confirmed.length).toFixed(1)
    : '0');
}

/**
 * Queries orders within the current date range.
 * @returns {Promise<Array>}
 */
async function queryOrders() {
  const result = await wixData.query('orders')
    .ge('createdAt', startDate)
    .le('createdAt', endDate)
    .limit(1000)
    .find();
  return result.items;
}

/**
 * Returns the start of the current week (Monday).
 * @returns {Date}
 */
function getStartOfWeek() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

/**
 * Safely sets text on a UI element.
 * @param {string} selector
 * @param {string} text
 */
function setTextSafe(selector, text) {
  try { $w(selector).text = text; } catch (e) { /* noop */ }
}

function showLoading(show) {
  try { show ? $w('#loadingIndicator').show() : $w('#loadingIndicator').hide(); } catch (e) { /* noop */ }
}

function showError(message) {
  try {
    $w('#errorMessage').text = message;
    $w('#errorMessage').show();
  } catch (e) { /* noop */ }
}
