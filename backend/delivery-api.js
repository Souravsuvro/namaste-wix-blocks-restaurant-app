/**
 * Delivery zone calculation and tracking backend API — Velo Web Module.
 * @module delivery-api
 */
import wixData from 'wix-data';
import { haversineDistance, calculateDeliveryFee, estimateDeliveryTime } from './utils/pricing';
import { sanitizeString } from './utils/validation';

/** Restaurant coordinates — 12 Quai de Nice, 45500 Gien, France */
const RESTAURANT_LAT = 47.6847;
const RESTAURANT_LNG = 2.6286;

/** Default delivery configuration */
const DEFAULT_CONFIG = {
  maxRadiusKm: 10,
  baseFee: 2.50,
  feePerKm: 0.80,
  freeDeliveryThreshold: 40,
  basePreparationMinutes: 25,
  estimatedTimePerKm: 3,
};

/**
 * Checks whether a given address/coordinates are within the delivery zone.
 * @param {number} lat - Customer latitude
 * @param {number} lng - Customer longitude
 * @param {Object} [config] - Delivery configuration overrides
 * @returns {{ inZone: boolean, distanceKm: number, deliveryFee: number, estimatedMinutes: number, message: string }}
 */
export function checkDeliveryZone(lat, lng, config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  const distance = haversineDistance(RESTAURANT_LAT, RESTAURANT_LNG, lat, lng);

  if (distance > cfg.maxRadiusKm) {
    return {
      inZone: false,
      distanceKm: distance,
      deliveryFee: 0,
      estimatedMinutes: 0,
      message: `Sorry, this address is ${distance.toFixed(1)} km away. We deliver within ${cfg.maxRadiusKm} km of the restaurant.`,
    };
  }

  const fee = calculateDeliveryFee(distance, cfg.baseFee, cfg.feePerKm, 0, cfg.freeDeliveryThreshold);
  const eta = estimateDeliveryTime(distance, cfg.basePreparationMinutes, cfg.estimatedTimePerKm);

  return {
    inZone: true,
    distanceKm: distance,
    deliveryFee: fee,
    estimatedMinutes: eta,
    message: `Delivery available! Estimated ${eta} minutes.`,
  };
}

/**
 * Calculates the delivery fee for a given distance and order total.
 * @param {number} distanceKm
 * @param {number} orderTotal
 * @param {Object} [config]
 * @returns {{ fee: number, isFree: boolean, message: string }}
 */
export function calculateFee(distanceKm, orderTotal, config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (orderTotal >= cfg.freeDeliveryThreshold) {
    return {
      fee: 0,
      isFree: true,
      message: `Free delivery on orders over €${cfg.freeDeliveryThreshold}!`,
    };
  }

  const fee = calculateDeliveryFee(distanceKm, cfg.baseFee, cfg.feePerKm, orderTotal, cfg.freeDeliveryThreshold);
  const remaining = cfg.freeDeliveryThreshold - orderTotal;

  return {
    fee,
    isFree: false,
    message: `Add €${remaining.toFixed(2)} more for free delivery.`,
  };
}

/**
 * Gets the delivery status for an order.
 * @param {string} orderNumber
 * @returns {Promise<Object>} Delivery tracking info
 */
export async function getDeliveryStatus(orderNumber) {
  const result = await wixData.query('orders')
    .eq('orderNumber', orderNumber)
    .eq('orderType', 'delivery')
    .find();

  if (result.items.length === 0) {
    throw new Error('Delivery order not found.');
  }

  const order = result.items[0];

  const statusSteps = [
    { key: 'confirmed', label: 'Order Confirmed', labelFr: 'Commande confirmée' },
    { key: 'preparing', label: 'Preparing', labelFr: 'En préparation' },
    { key: 'ready', label: 'Ready for Pickup', labelFr: 'Prête' },
    { key: 'out-for-delivery', label: 'On the Way', labelFr: 'En route' },
    { key: 'delivered', label: 'Delivered', labelFr: 'Livrée' },
  ];

  const currentIndex = statusSteps.findIndex(s => s.key === order.status);

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    estimatedTime: order.estimatedTime,
    steps: statusSteps.map((step, i) => ({
      ...step,
      completed: i < currentIndex,
      active: i === currentIndex,
      pending: i > currentIndex,
    })),
    deliveryAddress: order.deliveryAddress,
    customerName: order.customerName,
  };
}

/**
 * Assigns a driver to a delivery order. Admin dashboard use.
 * @param {string} orderId
 * @param {Object} driverInfo
 * @param {string} driverInfo.name
 * @param {string} driverInfo.phone
 * @returns {Promise<Object>}
 */
export async function assignDriver(orderId, driverInfo) {
  const order = await wixData.get('orders', orderId);
  if (!order) throw new Error('Order not found.');
  if (order.orderType !== 'delivery') throw new Error('Not a delivery order.');

  order.driverName = sanitizeString(driverInfo.name);
  order.driverPhone = sanitizeString(driverInfo.phone);
  order.status = 'out-for-delivery';

  return wixData.update('orders', order);
}

/**
 * Gets delivery zone information for display.
 * @param {Object} [config]
 * @returns {Object} Zone display info
 */
export function getDeliveryZoneInfo(config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  return {
    center: { lat: RESTAURANT_LAT, lng: RESTAURANT_LNG },
    radiusKm: cfg.maxRadiusKm,
    baseFee: cfg.baseFee,
    feePerKm: cfg.feePerKm,
    freeDeliveryThreshold: cfg.freeDeliveryThreshold,
    zones: [
      { label: 'Zone 1 (0-3 km)', fee: cfg.baseFee + 3 * cfg.feePerKm, time: estimateDeliveryTime(3, cfg.basePreparationMinutes, cfg.estimatedTimePerKm) },
      { label: 'Zone 2 (3-6 km)', fee: cfg.baseFee + 6 * cfg.feePerKm, time: estimateDeliveryTime(6, cfg.basePreparationMinutes, cfg.estimatedTimePerKm) },
      { label: 'Zone 3 (6-10 km)', fee: cfg.baseFee + 10 * cfg.feePerKm, time: estimateDeliveryTime(10, cfg.basePreparationMinutes, cfg.estimatedTimePerKm) },
    ],
  };
}
