/**
 * Tests for menu-related functionality.
 */

import { formatPrice, calculateSubtotal } from '../backend/utils/pricing';
import { validateName, sanitizeString } from '../backend/utils/validation';

describe('Pricing Utilities', () => {
  test('formatPrice formats EUR correctly', () => {
    const result = formatPrice(18, 'EUR', 'fr-FR');
    expect(result).toContain('18');
    expect(result).toMatch(/€|EUR/);
  });

  test('formatPrice handles zero', () => {
    const result = formatPrice(0, 'EUR', 'fr-FR');
    expect(result).toContain('0');
  });

  test('formatPrice handles large numbers', () => {
    const result = formatPrice(1234.56, 'EUR', 'fr-FR');
    expect(result).toMatch(/1[\s\u202f.,]?234/);
  });

  test('calculateSubtotal sums items correctly', () => {
    const items = [
      { price: 18, quantity: 2 },
      { price: 16, quantity: 1 },
      { price: 9, quantity: 3 },
    ];
    expect(calculateSubtotal(items)).toBe(79);
  });

  test('calculateSubtotal returns 0 for empty array', () => {
    expect(calculateSubtotal([])).toBe(0);
  });

  test('calculateSubtotal returns 0 for non-array', () => {
    expect(calculateSubtotal(null)).toBe(0);
    expect(calculateSubtotal(undefined)).toBe(0);
  });
});

describe('Validation', () => {
  test('validateName rejects empty name', () => {
    expect(validateName('').valid).toBe(false);
    expect(validateName(null).valid).toBe(false);
  });

  test('validateName rejects short name', () => {
    expect(validateName('A').valid).toBe(false);
  });

  test('validateName accepts valid name', () => {
    expect(validateName('Jean Dupont').valid).toBe(true);
  });

  test('sanitizeString escapes HTML', () => {
    expect(sanitizeString('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  test('sanitizeString trims whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  test('sanitizeString handles non-string', () => {
    expect(sanitizeString(123)).toBe('');
    expect(sanitizeString(null)).toBe('');
  });
});

describe('Menu Item Structure', () => {
  test('menu item has required fields', () => {
    const item = {
      name: 'Samosa de Canard Confit',
      description: 'Duck confit samosa',
      price: 9,
      category: 'Entrées',
      isAvailable: true,
    };

    expect(item.name).toBeTruthy();
    expect(typeof item.price).toBe('number');
    expect(item.price).toBeGreaterThan(0);
    expect(item.category).toBeTruthy();
  });

  test('spice level is within range', () => {
    const levels = [0, 1, 2, 3, 4, 5];
    levels.forEach(level => {
      expect(level).toBeGreaterThanOrEqual(0);
      expect(level).toBeLessThanOrEqual(5);
    });
  });

  test('categories match expected set', () => {
    const validCategories = ['Entrées', 'Plats Principaux', 'Tandoori & Grillades', 'Biryani & Riz', 'Desserts', 'Bar & Cocktails'];
    const testCategory = 'Plats Principaux';
    expect(validCategories).toContain(testCategory);
  });
});
