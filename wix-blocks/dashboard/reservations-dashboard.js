/**
 * Reservations Dashboard — Velo page code for reservation management.
 * Calendar view of reservations, capacity management, and confirm/cancel actions.
 */
import wixData from 'wix-data';
import { updateReservationStatus, cancelReservation } from 'backend/reservations-api';
import { sendReservationConfirmation } from 'backend/notifications';

/** Currently selected date */
let selectedDate = new Date();

/** Active status filter */
let currentFilter = 'all';

$w.onReady(async function () {
  initDateNavigation();
  await loadReservations();
  bindFilters();
});

/**
 * Initializes the date navigation (previous/next day buttons).
 */
function initDateNavigation() {
  updateDateDisplay();

  try {
    $w('#prevDay').onClick(() => {
      selectedDate.setDate(selectedDate.getDate() - 1);
      updateDateDisplay();
      loadReservations();
    });

    $w('#nextDay').onClick(() => {
      selectedDate.setDate(selectedDate.getDate() + 1);
      updateDateDisplay();
      loadReservations();
    });

    $w('#todayButton').onClick(() => {
      selectedDate = new Date();
      updateDateDisplay();
      loadReservations();
    });

    $w('#datePicker').onChange((event) => {
      selectedDate = new Date(event.target.value);
      updateDateDisplay();
      loadReservations();
    });
  } catch (e) {
    // Navigation elements may not exist
  }
}

/**
 * Updates the date display text.
 */
function updateDateDisplay() {
  const formatted = selectedDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  try {
    $w('#currentDate').text = formatted;
    $w('#datePicker').value = selectedDate.toISOString().split('T')[0];
  } catch (e) { /* noop */ }
}

/**
 * Loads reservations for the selected date.
 */
async function loadReservations() {
  showLoading(true);

  try {
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    let query = wixData.query('reservations')
      .ge('date', startOfDay)
      .le('date', endOfDay)
      .ascending('time')
      .ascending('customerName');

    if (currentFilter !== 'all') {
      query = query.eq('status', currentFilter);
    }

    const result = await query.find();
    const reservations = result.items.map(r => ({
      ...r,
      formattedDate: new Date(r.date).toLocaleDateString('fr-FR'),
      statusBadge: getStatusBadge(r.status),
      occasionLabel: formatOccasion(r.occasion),
    }));

    if (reservations.length === 0) {
      showEmptyState(true);
    } else {
      showEmptyState(false);
      renderReservations(reservations);
    }

    updateCapacitySummary(result.items);
  } catch (err) {
    console.error('Failed to load reservations:', err);
    showError('Failed to load reservations.');
  } finally {
    showLoading(false);
  }
}

/**
 * Renders reservations in the repeater, grouped by time slot.
 * @param {Array} reservations
 */
function renderReservations(reservations) {
  // Group by time for a timeline view
  const grouped = {};
  reservations.forEach(r => {
    if (!grouped[r.time]) grouped[r.time] = [];
    grouped[r.time].push(r);
  });

  $w('#reservationsRepeater').data = reservations;
  $w('#reservationsRepeater').onItemReady(($item, itemData) => {
    $item('#resTime').text = itemData.time;
    $item('#resName').text = itemData.customerName;
    $item('#resPartySize').text = `${itemData.partySize} guests`;
    $item('#resPhone').text = itemData.customerPhone;
    $item('#resEmail').text = itemData.customerEmail;
    $item('#resOccasion').text = itemData.occasionLabel;
    $item('#resNotes').text = itemData.notes || '—';
    $item('#resStatus').text = itemData.statusBadge.label;

    // Action buttons based on status
    if (itemData.status === 'pending') {
      $item('#confirmButton').show();
      $item('#confirmButton').onClick(async () => {
        await handleConfirm(itemData._id, itemData);
      });
    } else {
      try { $item('#confirmButton').hide(); } catch (e) { /* noop */ }
    }

    if (itemData.status === 'confirmed') {
      $item('#seatButton').show();
      $item('#seatButton').onClick(async () => {
        await handleStatusUpdate(itemData._id, 'seated');
      });
    } else {
      try { $item('#seatButton').hide(); } catch (e) { /* noop */ }
    }

    if (itemData.status === 'seated') {
      $item('#completeButton').show();
      $item('#completeButton').onClick(async () => {
        await handleStatusUpdate(itemData._id, 'completed');
      });
    } else {
      try { $item('#completeButton').hide(); } catch (e) { /* noop */ }
    }

    if (['pending', 'confirmed', 'waitlisted'].includes(itemData.status)) {
      $item('#cancelResButton').show();
      $item('#cancelResButton').onClick(async () => {
        await handleCancelReservation(itemData._id);
      });
    } else {
      try { $item('#cancelResButton').hide(); } catch (e) { /* noop */ }
    }

    if (['pending', 'confirmed'].includes(itemData.status)) {
      $item('#noShowButton').show();
      $item('#noShowButton').onClick(async () => {
        await handleStatusUpdate(itemData._id, 'no-show');
      });
    } else {
      try { $item('#noShowButton').hide(); } catch (e) { /* noop */ }
    }
  });
}

/**
 * Binds status filter tabs.
 */
function bindFilters() {
  const filters = ['all', 'pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no-show', 'waitlisted'];

  filters.forEach(status => {
    const selector = `#filter_${status.replace(/-/g, '_')}`;
    try {
      $w(selector).onClick(() => {
        currentFilter = status;
        loadReservations();
      });
    } catch (e) { /* noop */ }
  });
}

/**
 * Confirms a reservation and sends confirmation email.
 * @param {string} id
 * @param {Object} reservation
 */
async function handleConfirm(id, reservation) {
  try {
    await updateReservationStatus(id, 'confirmed');
    sendReservationConfirmation(reservation).catch(console.error);
    await loadReservations();
  } catch (err) {
    showError(err.message);
  }
}

/**
 * Updates a reservation status.
 * @param {string} id
 * @param {string} status
 */
async function handleStatusUpdate(id, status) {
  try {
    await updateReservationStatus(id, status);
    await loadReservations();
  } catch (err) {
    showError(err.message);
  }
}

/**
 * Cancels a reservation.
 * @param {string} id
 */
async function handleCancelReservation(id) {
  try {
    await cancelReservation(id);
    await loadReservations();
  } catch (err) {
    showError(err.message);
  }
}

/**
 * Updates the capacity summary card for the selected date.
 * @param {Array} reservations
 */
function updateCapacitySummary(reservations) {
  const maxCapacity = 60; // Per slot default
  const active = reservations.filter(r => !['cancelled', 'no-show', 'completed'].includes(r.status));
  const totalGuests = active.reduce((sum, r) => sum + r.partySize, 0);

  // Group by time slot for capacity view
  const slotCounts = {};
  active.forEach(r => {
    slotCounts[r.time] = (slotCounts[r.time] || 0) + r.partySize;
  });

  try {
    $w('#totalReservations').text = String(active.length);
    $w('#totalGuests').text = String(totalGuests);
    $w('#reservationCount').text = `${reservations.length} total`;
  } catch (e) { /* noop */ }

  // Render slot capacity bars
  try {
    const lunchSlots = ['12:00', '12:30', '13:00', '13:30'];
    const dinnerSlots = ['19:00', '19:30', '20:00', '20:30', '21:00'];

    const lunchTotal = lunchSlots.reduce((sum, s) => sum + (slotCounts[s] || 0), 0);
    const dinnerTotal = dinnerSlots.reduce((sum, s) => sum + (slotCounts[s] || 0), 0);

    $w('#lunchCapacity').text = `Lunch: ${lunchTotal} guests`;
    $w('#dinnerCapacity').text = `Dinner: ${dinnerTotal} guests`;
  } catch (e) { /* noop */ }
}

/**
 * Returns a status badge configuration.
 * @param {string} status
 * @returns {{ label: string, color: string }}
 */
function getStatusBadge(status) {
  const badges = {
    'pending': { label: 'Pending', color: '#E8731A' },
    'confirmed': { label: 'Confirmed', color: '#1B3A6B' },
    'seated': { label: 'Seated', color: '#4CAF50' },
    'completed': { label: 'Completed', color: '#666' },
    'cancelled': { label: 'Cancelled', color: '#C23B22' },
    'no-show': { label: 'No Show', color: '#C23B22' },
    'waitlisted': { label: 'Waitlisted', color: '#D4A843' },
  };
  return badges[status] || { label: status, color: '#999' };
}

/**
 * Formats occasion for display.
 * @param {string} occasion
 * @returns {string}
 */
function formatOccasion(occasion) {
  const labels = {
    'none': '',
    'birthday': '🎂 Birthday',
    'anniversary': '💍 Anniversary',
    'business': '💼 Business',
    'date-night': '💑 Date Night',
    'celebration': '🎉 Celebration',
    'other': '✨ Special',
  };
  return labels[occasion] || '';
}

function showLoading(show) {
  try { show ? $w('#loadingIndicator').show() : $w('#loadingIndicator').hide(); } catch (e) { /* noop */ }
}

function showEmptyState(show) {
  try {
    show ? $w('#emptyState').show() : $w('#emptyState').hide();
    show ? $w('#reservationsRepeater').hide() : $w('#reservationsRepeater').show();
  } catch (e) { /* noop */ }
}

function showError(message) {
  try {
    $w('#errorMessage').text = message;
    $w('#errorMessage').show();
    setTimeout(() => { try { $w('#errorMessage').hide(); } catch (e) { /* noop */ } }, 5000);
  } catch (e) { /* noop */ }
}
