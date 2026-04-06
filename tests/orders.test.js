/**
 * Tests for order processing functionality.
 */

import {
  calculateSubtotal,
  calculateServiceFee,
  calculateTax,
  calculateDeliveryFee,
  calculateOrderSummary,
  generateOrderNumber,
  haversineDistance,
  estimateDeliveryTime,
} from '../backend/utils/pricing';

import {
  validateOrderItems,
  validateMinimumOrder,
  validatePhone,
  validateAddress,
} from '../backend/utils/validation';

describe('Order Pricing', () => {
  const sampleItems = [
    { price: 18, quantity: 1 },
    { price: 22, quantity: 1 },
    { price: 9, quantity: 2 },
  ];

  test('calculateSubtotal computes correct total', () => {
    expect(calculateSubtotal(sampleItems)).toBe(58);
  });

  test('calculateServiceFee at 5%', () => {
    expect(calculateServiceFee(100, 5)).toBe(5);
    expect(calculateServiceFee(58, 5)).toBe(2.9);
  });

  test('calculateServiceFee returns 0 for zero subtotal', () => {
    expect(calculateServiceFee(0, 5)).toBe(0);
  });

  test('calculateTax at 10%', () => {
    expect(calculateTax(100, 5, 10)).toBe(10.5);
  });

  test('calculateDeliveryFee computes correctly', () => {
    expect(calculateDeliveryFee(5, 2.50, 0.80)).toBe(6.50);
  });

  test('calculateDeliveryFee is free above threshold', () => {
    expect(calculateDeliveryFee(5, 2.50, 0.80, 50, 40)).toBe(0);
  });

  test('calculateDeliveryFee charges when below threshold', () => {
    expect(calculateDeliveryFee(5, 2.50, 0.80, 30, 40)).toBe(6.50);
  });

  test('calculateOrderSummary returns complete breakdown', () => {
    const summary = calculateOrderSummary(sampleItems, {
      serviceFeePercent: 5,
      taxPercent: 10,
      deliveryFee: 4.50,
    });

    expect(summary.subtotal).toBe(58);
    expect(summary.serviceFee).toBe(2.9);
    expect(summary.tax).toBeCloseTo(6.09, 2);
    expect(summary.deliveryFee).toBe(4.50);
    expect(summary.total).toBeCloseTo(71.49, 2);
  });

  test('calculateOrderSummary with defaults', () => {
    const summary = calculateOrderSummary(sampleItems);
    expect(summary.subtotal).toBe(58);
    expect(summary.serviceFee).toBe(2.9);
    expect(summary.deliveryFee).toBe(0);
    expect(summary.total).toBeGreaterThan(0);
  });
});

describe('Order Number Generation', () => {
  test('generates order number in correct format', () => {
    const orderNum = generateOrderNumber();
    expect(orderNum).toMatch(/^NG-\d{8}-[A-Z0-9]{4}$/);
  });

  test('generates unique order numbers', () => {
    const numbers = new Set();
    for (let i = 0; i < 100; i++) {
      numbers.add(generateOrderNumber());
    }
    expect(numbers.size).toBe(100);
  });
});

describe('Order Validation', () => {
  test('validateOrderItems rejects empty array', () => {
    expect(validateOrderItems([]).valid).toBe(false);
  });

  test('validateOrderItems rejects non-array', () => {
    expect(validateOrderItems(null).valid).toBe(false);
  });

  test('validateOrderItems rejects items with missing fields', () => {
    expect(validateOrderItems([{ name: 'Test' }]).valid).toBe(false);
  });

  test('validateOrderItems accepts valid items', () => {
    const items = [
      { itemId: '1', name: 'Butter Chicken', price: 18, quantity: 1 },
    ];
    expect(validateOrderItems(items).valid).toBe(true);
  });

  test('validateOrderItems rejects negative quantity', () => {
    const items = [
      { itemId: '1', name: 'Test', price: 10, quantity: -1 },
    ];
    expect(validateOrderItems(items).valid).toBe(false);
  });

  test('validateMinimumOrder rejects below minimum', () => {
    expect(validateMinimumOrder(10, 15).valid).toBe(false);
  });

  test('validateMinimumOrder accepts at minimum', () => {
    expect(validateMinimumOrder(15, 15).valid).toBe(true);
  });

  test('validatePhone rejects invalid phone', () => {
    expect(validatePhone('abc').valid).toBe(false);
  });

  test('validatePhone accepts French phone', () => {
    expect(validatePhone('+33 2 38 12 34 56').valid).toBe(true);
  });

  test('validateAddress rejects short address', () => {
    expect(validateAddress('123').valid).toBe(false);
  });

  test('validateAddress accepts valid address', () => {
    expect(validateAddress('12 Quai de Nice, 45500 Gien, France').valid).toBe(true);
  });
});

describe('Delivery Calculations', () => {
  test('haversineDistance calculates known distance', () => {
    // Gien to Orléans is ~65 km
    const distance = haversineDistance(47.6847, 2.6286, 47.9029, 1.9039);
    expect(distance).toBeGreaterThan(50);
    expect(distance).toBeLessThan(80);
  });

  test('haversineDistance returns 0 for same point', () => {
    expect(haversineDistance(47.6847, 2.6286, 47.6847, 2.6286)).toBe(0);
  });

  test('estimateDeliveryTime computes correctly', () => {
    expect(estimateDeliveryTime(5, 25, 3)).toBe(40);
    expect(estimateDeliveryTime(0, 25, 3)).toBe(25);
    expect(estimateDeliveryTime(10, 25, 3)).toBe(55);
  });
});
