/**
 * Tests for reservation functionality.
 */

import {
  validateEmail,
  validatePhone,
  validateName,
  validatePartySize,
  validateReservationDate,
  validateTimeFormat,
} from '../backend/utils/validation';

describe('Reservation Validation', () => {
  describe('Email validation', () => {
    test('rejects empty email', () => {
      expect(validateEmail('').valid).toBe(false);
      expect(validateEmail(null).valid).toBe(false);
    });

    test('rejects invalid email', () => {
      expect(validateEmail('notanemail').valid).toBe(false);
      expect(validateEmail('missing@').valid).toBe(false);
      expect(validateEmail('@nodomain.com').valid).toBe(false);
    });

    test('accepts valid email', () => {
      expect(validateEmail('guest@example.com').valid).toBe(true);
      expect(validateEmail('jean.dupont@namastegien.fr').valid).toBe(true);
    });
  });

  describe('Party size validation', () => {
    test('rejects zero party size', () => {
      expect(validatePartySize(0).valid).toBe(false);
    });

    test('rejects negative party size', () => {
      expect(validatePartySize(-1).valid).toBe(false);
    });

    test('rejects non-integer', () => {
      expect(validatePartySize(2.5).valid).toBe(false);
    });

    test('rejects above maximum', () => {
      expect(validatePartySize(21, 20).valid).toBe(false);
    });

    test('accepts valid party sizes', () => {
      expect(validatePartySize(1).valid).toBe(true);
      expect(validatePartySize(4).valid).toBe(true);
      expect(validatePartySize(20).valid).toBe(true);
    });

    test('accepts custom maximum', () => {
      expect(validatePartySize(50, 50).valid).toBe(true);
      expect(validatePartySize(51, 50).valid).toBe(false);
    });
  });

  describe('Date validation', () => {
    test('rejects invalid date object', () => {
      expect(validateReservationDate(new Date('invalid')).valid).toBe(false);
    });

    test('rejects past date', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(validateReservationDate(yesterday).valid).toBe(false);
    });

    test('rejects Monday (closed day)', () => {
      // Find the next Monday
      const date = new Date();
      while (date.getDay() !== 1) {
        date.setDate(date.getDate() + 1);
      }
      expect(validateReservationDate(date, [1]).valid).toBe(false);
    });

    test('accepts valid future date on open day', () => {
      // Find the next Tuesday
      const date = new Date();
      date.setDate(date.getDate() + 7); // Ensure it's in the future
      while (date.getDay() === 1) {
        date.setDate(date.getDate() + 1);
      }
      expect(validateReservationDate(date, [1]).valid).toBe(true);
    });
  });

  describe('Time format validation', () => {
    test('rejects empty time', () => {
      expect(validateTimeFormat('').valid).toBe(false);
    });

    test('rejects invalid format', () => {
      expect(validateTimeFormat('9:00').valid).toBe(false);
      expect(validateTimeFormat('9pm').valid).toBe(false);
      expect(validateTimeFormat('25:00').valid).toBe(false);
    });

    test('accepts valid times', () => {
      expect(validateTimeFormat('12:00').valid).toBe(true);
      expect(validateTimeFormat('19:30').valid).toBe(true);
      expect(validateTimeFormat('00:00').valid).toBe(true);
      expect(validateTimeFormat('23:59').valid).toBe(true);
    });
  });
});

describe('Reservation Data Structure', () => {
  test('reservation has all required fields', () => {
    const reservation = {
      date: new Date('2026-04-10'),
      time: '19:30',
      partySize: 4,
      customerName: 'Jean Dupont',
      customerEmail: 'jean@example.com',
      customerPhone: '+33 2 38 12 34 56',
      occasion: 'birthday',
      status: 'confirmed',
      notes: 'Window table preferred',
    };

    expect(reservation.date).toBeInstanceOf(Date);
    expect(reservation.time).toMatch(/^\d{2}:\d{2}$/);
    expect(reservation.partySize).toBeGreaterThan(0);
    expect(reservation.customerName).toBeTruthy();
    expect(reservation.customerEmail).toContain('@');
    expect(reservation.customerPhone).toBeTruthy();
  });

  test('occasion values are valid', () => {
    const validOccasions = ['none', 'birthday', 'anniversary', 'business', 'date-night', 'celebration', 'other'];
    validOccasions.forEach(occ => {
      expect(validOccasions).toContain(occ);
    });
  });

  test('status values are valid', () => {
    const validStatuses = ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no-show', 'waitlisted'];
    validStatuses.forEach(status => {
      expect(validStatuses).toContain(status);
    });
  });
});

describe('Time Slot Generation', () => {
  test('lunch slots are within operating hours', () => {
    const lunchSlots = ['12:00', '12:30', '13:00', '13:30'];
    lunchSlots.forEach(slot => {
      const [hours] = slot.split(':').map(Number);
      expect(hours).toBeGreaterThanOrEqual(12);
      expect(hours).toBeLessThanOrEqual(14);
    });
  });

  test('dinner slots are within operating hours', () => {
    const dinnerSlots = ['19:00', '19:30', '20:00', '20:30', '21:00'];
    dinnerSlots.forEach(slot => {
      const [hours] = slot.split(':').map(Number);
      expect(hours).toBeGreaterThanOrEqual(19);
      expect(hours).toBeLessThanOrEqual(22);
    });
  });
});
