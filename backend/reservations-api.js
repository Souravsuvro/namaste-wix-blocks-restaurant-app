/**
 * Reservation backend API — Velo Web Module.
 * @module reservations-api
 */
import wixData from 'wix-data';
import { validateName, validateEmail, validatePhone, validatePartySize, validateReservationDate, validateTimeFormat, sanitizeString } from './utils/validation';
import { sendReservationConfirmation, sendWaitlistNotification } from './notifications';

const COLLECTION = 'reservations';

/** Default restaurant capacity per slot */
const DEFAULT_CAPACITY = 60;

/** Slot duration in minutes */
const SLOT_DURATION = 90;

/**
 * Books a new reservation.
 * @param {Object} data
 * @param {string} data.date - ISO date string
 * @param {string} data.time - HH:MM format
 * @param {number} data.partySize
 * @param {string} data.customerName
 * @param {string} data.customerEmail
 * @param {string} data.customerPhone
 * @param {string} [data.occasion]
 * @param {string} [data.notes]
 * @param {number} [maxCapacity]
 * @returns {Promise<Object>} Created reservation
 */
export async function bookReservation(data, maxCapacity = DEFAULT_CAPACITY) {
  // Validate inputs
  const dateObj = new Date(data.date);
  const dateCheck = validateReservationDate(dateObj);
  if (!dateCheck.valid) throw new Error(dateCheck.message);

  const timeCheck = validateTimeFormat(data.time);
  if (!timeCheck.valid) throw new Error(timeCheck.message);

  const sizeCheck = validatePartySize(data.partySize);
  if (!sizeCheck.valid) throw new Error(sizeCheck.message);

  const nameCheck = validateName(data.customerName);
  if (!nameCheck.valid) throw new Error(nameCheck.message);

  const emailCheck = validateEmail(data.customerEmail);
  if (!emailCheck.valid) throw new Error(emailCheck.message);

  const phoneCheck = validatePhone(data.customerPhone);
  if (!phoneCheck.valid) throw new Error(phoneCheck.message);

  // Check capacity for the time slot
  const capacity = await getSlotCapacity(data.date, data.time);
  if (capacity.remaining < data.partySize) {
    throw new Error(`Not enough capacity for ${data.partySize} guests at ${data.time}. ${capacity.remaining} seats available.`);
  }

  const reservation = {
    date: dateObj,
    time: data.time,
    partySize: data.partySize,
    customerName: sanitizeString(data.customerName),
    customerEmail: sanitizeString(data.customerEmail),
    customerPhone: sanitizeString(data.customerPhone),
    occasion: data.occasion || 'none',
    status: 'confirmed',
    notes: sanitizeString(data.notes || ''),
    createdAt: new Date(),
  };

  const result = await wixData.insert(COLLECTION, reservation);

  // Send confirmation email (non-blocking)
  sendReservationConfirmation(result).catch(console.error);

  return result;
}

/**
 * Joins the waitlist for a fully booked slot.
 * @param {Object} data - Same as bookReservation
 * @returns {Promise<Object>} Waitlisted reservation
 */
export async function joinWaitlist(data) {
  const dateObj = new Date(data.date);
  const dateCheck = validateReservationDate(dateObj);
  if (!dateCheck.valid) throw new Error(dateCheck.message);

  const nameCheck = validateName(data.customerName);
  if (!nameCheck.valid) throw new Error(nameCheck.message);

  const emailCheck = validateEmail(data.customerEmail);
  if (!emailCheck.valid) throw new Error(emailCheck.message);

  const reservation = {
    date: dateObj,
    time: data.time,
    partySize: data.partySize,
    customerName: sanitizeString(data.customerName),
    customerEmail: sanitizeString(data.customerEmail),
    customerPhone: sanitizeString(data.customerPhone || ''),
    occasion: data.occasion || 'none',
    status: 'waitlisted',
    notes: sanitizeString(data.notes || ''),
    createdAt: new Date(),
  };

  const result = await wixData.insert(COLLECTION, reservation);
  sendWaitlistNotification(result).catch(console.error);
  return result;
}

/**
 * Gets available time slots for a given date.
 * @param {string} dateStr - ISO date string
 * @param {number} [maxCapacity]
 * @returns {Promise<Array<{ time: string, available: boolean, remainingCapacity: number }>>}
 */
export async function getAvailableSlots(dateStr, maxCapacity = DEFAULT_CAPACITY) {
  const date = new Date(dateStr);
  const dateCheck = validateReservationDate(date);
  if (!dateCheck.valid) throw new Error(dateCheck.message);

  // Generate all possible time slots
  const slots = generateTimeSlots();

  // Query existing reservations for this date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const result = await wixData.query(COLLECTION)
    .ge('date', startOfDay)
    .le('date', endOfDay)
    .ne('status', 'cancelled')
    .ne('status', 'no-show')
    .find();

  // Calculate remaining capacity per slot
  const booked = {};
  for (const reservation of result.items) {
    if (!booked[reservation.time]) booked[reservation.time] = 0;
    booked[reservation.time] += reservation.partySize;
  }

  return slots.map(time => {
    const used = booked[time] || 0;
    const remaining = Math.max(0, maxCapacity - used);
    return {
      time,
      available: remaining > 0,
      remainingCapacity: remaining,
    };
  });
}

/**
 * Generates time slots based on restaurant operating hours.
 * Lunch: 12:00-14:30, Dinner: 19:00-22:30, 30-minute intervals.
 * @returns {string[]}
 */
function generateTimeSlots() {
  const slots = [];
  // Lunch slots: 12:00, 12:30, 13:00, 13:30
  for (let h = 12; h <= 13; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  // Dinner slots: 19:00, 19:30, 20:00, 20:30, 21:00
  for (let h = 19; h <= 21; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 21) {
      slots.push(`${String(h).padStart(2, '0')}:30`);
    }
  }
  return slots;
}

/**
 * Gets capacity info for a specific slot.
 * @param {string} dateStr
 * @param {string} time
 * @param {number} [maxCapacity]
 * @returns {Promise<{ total: number, booked: number, remaining: number }>}
 */
async function getSlotCapacity(dateStr, time, maxCapacity = DEFAULT_CAPACITY) {
  const date = new Date(dateStr);
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const result = await wixData.query(COLLECTION)
    .ge('date', startOfDay)
    .le('date', endOfDay)
    .eq('time', time)
    .ne('status', 'cancelled')
    .ne('status', 'no-show')
    .find();

  const booked = result.items.reduce((sum, r) => sum + r.partySize, 0);
  return {
    total: maxCapacity,
    booked,
    remaining: Math.max(0, maxCapacity - booked),
  };
}

/**
 * Retrieves a reservation by ID.
 * @param {string} reservationId
 * @returns {Promise<Object>}
 */
export async function getReservation(reservationId) {
  const item = await wixData.get(COLLECTION, reservationId);
  if (!item) throw new Error('Reservation not found.');
  return item;
}

/**
 * Updates reservation status. Admin only.
 * @param {string} reservationId
 * @param {string} newStatus
 * @returns {Promise<Object>}
 */
export async function updateReservationStatus(reservationId, newStatus) {
  const reservation = await wixData.get(COLLECTION, reservationId);
  if (!reservation) throw new Error('Reservation not found.');
  reservation.status = newStatus;
  return wixData.update(COLLECTION, reservation);
}

/**
 * Gets reservations for a date range. Admin dashboard use.
 * @param {string} startDate - ISO date string
 * @param {string} endDate - ISO date string
 * @param {string} [status]
 * @returns {Promise<Array>}
 */
export async function getReservations(startDate, endDate, status) {
  let query = wixData.query(COLLECTION)
    .ge('date', new Date(startDate))
    .le('date', new Date(endDate))
    .ascending('date')
    .ascending('time');

  if (status) {
    query = query.eq('status', status);
  }

  const result = await query.find();
  return result.items;
}

/**
 * Cancels a reservation.
 * @param {string} reservationId
 * @returns {Promise<Object>}
 */
export async function cancelReservation(reservationId) {
  const reservation = await wixData.get(COLLECTION, reservationId);
  if (!reservation) throw new Error('Reservation not found.');

  const cancellable = ['pending', 'confirmed', 'waitlisted'];
  if (!cancellable.includes(reservation.status)) {
    throw new Error('This reservation can no longer be cancelled.');
  }

  reservation.status = 'cancelled';
  return wixData.update(COLLECTION, reservation);
}
