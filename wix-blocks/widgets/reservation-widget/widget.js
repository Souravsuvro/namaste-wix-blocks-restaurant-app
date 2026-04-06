/**
 * Namaste GIEN - Reservation Widget
 * Premium Indian Restaurant in Gien, France
 *
 * Multi-step table reservation system with date/time picker,
 * party size selector, occasion tags, guest form, and
 * double-booking prevention.
 *
 * Hours: Mardi-Dimanche 12h-14h30, 19h-22h30. Ferme le Lundi.
 *
 * @module reservation-widget
 */

import wixData from 'wix-data';
import { bookReservation, getAvailableSlots, joinWaitlist } from 'backend/reservations-api';

/** @enum {number} */
const STEPS = {
  DATE: 0,
  TIME: 1,
  PARTY_SIZE: 2,
  OCCASION: 3,
  GUEST_INFO: 4,
  CONFIRM: 5,
};

/** Total number of steps in the reservation flow */
const TOTAL_STEPS = Object.keys(STEPS).length;

/** Ordered list of occasion options */
const OCCASIONS = [
  { key: 'birthday', label: 'Anniversaire', icon: '\uD83C\uDF82' },
  { key: 'anniversary', label: 'Anniversaire de mariage', icon: '\uD83D\uDC95' },
  { key: 'business', label: 'Repas d\'affaires', icon: '\uD83D\uDCBC' },
  { key: 'date-night', label: 'Diner en amoureux', icon: '\uD83C\uDF74' },
  { key: 'celebration', label: 'Celebration', icon: '\uD83C\uDF89' },
];

/** Days of the week mapping (0 = Sunday) */
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Widget configuration derived from properties.
 * @typedef {Object} WidgetConfig
 * @property {number} maxPartySize - Maximum guests per reservation
 * @property {number} maxCapacity - Total restaurant capacity
 * @property {number} slotDurationMinutes - Duration of each time slot
 * @property {string} closedDays - Comma-separated closed day names
 * @property {string} lunchStart - Lunch service start (HH:MM)
 * @property {string} lunchEnd - Lunch service end (HH:MM)
 * @property {string} dinnerStart - Dinner service start (HH:MM)
 * @property {string} dinnerEnd - Dinner service end (HH:MM)
 * @property {boolean} enableWaitlist - Whether waitlist is available
 * @property {string} primaryColor - Primary brand color hex
 * @property {string} accentColor - Accent brand color hex
 */

/**
 * Reservation data structure.
 * @typedef {Object} ReservationData
 * @property {Date|null} date - Selected date
 * @property {string|null} time - Selected time slot (HH:MM)
 * @property {number} partySize - Number of guests
 * @property {string|null} occasion - Selected occasion key
 * @property {string} guestName - Guest full name
 * @property {string} guestEmail - Guest email address
 * @property {string} guestPhone - Guest phone number
 * @property {string} specialRequests - Special requests or notes
 */

/** @type {WidgetConfig} */
let config = {};

/** @type {number} */
let currentStep = STEPS.DATE;

/** @type {ReservationData} */
let reservationData = {
  date: null,
  time: null,
  partySize: 2,
  occasion: null,
  guestName: '',
  guestEmail: '',
  guestPhone: '',
  specialRequests: '',
};

/** @type {Date} */
let currentMonth = new Date();

/** @type {Object<string, number>} */
let slotAvailability = {};

/** @type {boolean} */
let isLoading = false;

/** @type {boolean} */
let isWaitlistSlot = false;

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

/**
 * Widget initialization. Called when the widget is ready.
 * Sets up configuration from widget properties and initializes the UI.
 */
$widget.onReady(() => {
  initConfig($widget.props);
  renderStep(currentStep);
  setupNavigation();
});

/**
 * Responds to property changes from the Wix Editor or runtime.
 * @param {Object} newProps - Updated widget properties
 */
$widget.onPropsChanged((oldProps, newProps) => {
  initConfig(newProps);
  applyDynamicStyles();
  // Re-render current step if config-dependent
  if (currentStep === STEPS.DATE || currentStep === STEPS.TIME) {
    renderStep(currentStep);
  }
});

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Initializes widget configuration from props.
 * @param {Object} props - Widget properties
 */
function initConfig(props) {
  config = {
    maxPartySize: props.maxPartySize || 20,
    maxCapacity: props.maxCapacity || 60,
    slotDurationMinutes: props.slotDurationMinutes || 90,
    closedDays: (props.closedDays || 'monday').toLowerCase().split(',').map(d => d.trim()),
    lunchStart: props.lunchStart || '12:00',
    lunchEnd: props.lunchEnd || '14:30',
    dinnerStart: props.dinnerStart || '19:00',
    dinnerEnd: props.dinnerEnd || '22:30',
    enableWaitlist: props.enableWaitlist !== undefined ? props.enableWaitlist : true,
    primaryColor: props.primaryColor || '#1B3A6B',
    accentColor: props.accentColor || '#E8731A',
  };
}

/**
 * Applies dynamic styles from config (primary/accent colors).
 */
function applyDynamicStyles() {
  const container = $w('#reservationContainer');
  if (container && container.style) {
    container.style.setProperty('--color-primary', config.primaryColor);
    container.style.setProperty('--color-accent', config.accentColor);
  }
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

/**
 * Sets up the back and next navigation button handlers.
 */
function setupNavigation() {
  $w('#btnBack').onClick(() => {
    if (currentStep > STEPS.DATE) {
      currentStep--;
      renderStep(currentStep);
    }
  });

  $w('#btnNext').onClick(() => {
    if (validateCurrentStep()) {
      if (currentStep < STEPS.CONFIRM) {
        currentStep++;
        renderStep(currentStep);
        onStepEnter(currentStep);
      }
    }
  });

  $w('#btnConfirm').onClick(() => {
    handleConfirmReservation();
  });
}

/**
 * Validates the current step before proceeding.
 * @returns {boolean} True if the current step is valid
 */
function validateCurrentStep() {
  switch (currentStep) {
    case STEPS.DATE:
      if (!reservationData.date) {
        showStepError('Veuillez selectionner une date.');
        return false;
      }
      return true;

    case STEPS.TIME:
      if (!reservationData.time) {
        showStepError('Veuillez selectionner un creneau horaire.');
        return false;
      }
      return true;

    case STEPS.PARTY_SIZE:
      if (reservationData.partySize < 1 || reservationData.partySize > config.maxPartySize) {
        showStepError(`Le nombre de convives doit etre entre 1 et ${config.maxPartySize}.`);
        return false;
      }
      return true;

    case STEPS.OCCASION:
      // Occasion is optional, always valid
      return true;

    case STEPS.GUEST_INFO:
      return validateGuestForm();

    default:
      return true;
  }
}

/**
 * Called when entering a new step. Loads async data if needed.
 * @param {number} step - The step being entered
 */
async function onStepEnter(step) {
  if (step === STEPS.TIME) {
    await loadAvailableSlots();
  }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/**
 * Renders the specified step, hiding all others.
 * Updates step indicator dots and navigation button visibility.
 * @param {number} step - Step index to render
 */
function renderStep(step) {
  // Hide all steps
  for (let i = 0; i < TOTAL_STEPS; i++) {
    const stepEl = $w(`#step${i}`);
    if (stepEl) {
      if (i === step) {
        stepEl.show();
      } else {
        stepEl.hide();
      }
    }
  }

  // Update step dots
  updateStepIndicator(step);

  // Toggle back button visibility
  if (step === STEPS.DATE) {
    $w('#btnBack').hide();
  } else {
    $w('#btnBack').show();
  }

  // Toggle next/confirm button
  if (step === STEPS.CONFIRM) {
    $w('#btnNext').hide();
    $w('#btnConfirm').show();
  } else {
    $w('#btnNext').show();
    $w('#btnConfirm').hide();
  }

  // Disable next until step selection is made
  updateNextButtonState();

  // Render step-specific content
  switch (step) {
    case STEPS.DATE:
      renderDatePicker();
      break;
    case STEPS.TIME:
      renderTimeSlots();
      break;
    case STEPS.PARTY_SIZE:
      renderPartySize();
      break;
    case STEPS.OCCASION:
      renderOccasionTags();
      break;
    case STEPS.GUEST_INFO:
      renderGuestForm();
      break;
    case STEPS.CONFIRM:
      renderConfirmation();
      break;
  }
}

/**
 * Updates the step indicator dots in the header.
 * @param {number} activeStep - Currently active step index
 */
function updateStepIndicator(activeStep) {
  for (let i = 0; i < TOTAL_STEPS; i++) {
    const dot = $w(`#stepDot${i}`);
    if (dot) {
      if (i < activeStep) {
        dot.className = 'reservation-header__step-dot reservation-header__step-dot--completed';
      } else if (i === activeStep) {
        dot.className = 'reservation-header__step-dot reservation-header__step-dot--active';
      } else {
        dot.className = 'reservation-header__step-dot';
      }
    }
  }
}

/**
 * Enables or disables the Next button based on current step validity.
 */
function updateNextButtonState() {
  const btn = $w('#btnNext');
  if (!btn) return;

  switch (currentStep) {
    case STEPS.DATE:
      btn.enabled = !!reservationData.date;
      break;
    case STEPS.TIME:
      btn.enabled = !!reservationData.time;
      break;
    case STEPS.PARTY_SIZE:
      btn.enabled = reservationData.partySize >= 1;
      break;
    case STEPS.OCCASION:
      btn.enabled = true; // Optional step
      break;
    case STEPS.GUEST_INFO:
      btn.enabled = isGuestFormComplete();
      break;
    default:
      btn.enabled = true;
  }
}

// ---------------------------------------------------------------------------
// Date Picker
// ---------------------------------------------------------------------------

/**
 * Renders the calendar date picker for the current month.
 * Disables Mondays (ferme le Lundi) and past dates.
 */
function renderDatePicker() {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Update month/year label
  const monthNames = [
    'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre',
  ];
  $w('#monthYearLabel').text = `${monthNames[month]} ${year}`;

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const repeater = $w('#calendarRepeater');
  const days = [];

  // Empty cells before the first day
  for (let i = 0; i < firstDay; i++) {
    days.push({ _id: `empty-${i}`, dayNumber: '', isEmpty: true });
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dayName = DAY_NAMES[date.getDay()];
    const isPast = date < today;
    const isClosed = config.closedDays.includes(dayName);
    const isDisabled = isPast || isClosed;
    const isSelected = reservationData.date &&
      reservationData.date.getFullYear() === year &&
      reservationData.date.getMonth() === month &&
      reservationData.date.getDate() === d;
    const isToday = date.getTime() === today.getTime();

    days.push({
      _id: `day-${d}`,
      dayNumber: d,
      isEmpty: false,
      isDisabled,
      isClosed,
      isSelected,
      isToday,
      date,
    });
  }

  repeater.data = days;

  repeater.onItemReady(($item, itemData) => {
    const dayBtn = $item('#dayButton');

    if (itemData.isEmpty) {
      dayBtn.label = '';
      dayBtn.className = 'date-picker__day date-picker__day--empty';
      dayBtn.disable();
      return;
    }

    dayBtn.label = String(itemData.dayNumber);

    // Build CSS class list
    let classes = 'date-picker__day';
    if (itemData.isDisabled) {
      classes += ' date-picker__day--disabled';
    } else {
      classes += ' date-picker__day--available';
    }
    if (itemData.isSelected) {
      classes += ' date-picker__day--selected';
    }
    if (itemData.isToday) {
      classes += ' date-picker__day--today';
    }
    dayBtn.className = classes;

    if (itemData.isDisabled) {
      dayBtn.disable();
    } else {
      dayBtn.enable();
      dayBtn.onClick(() => {
        selectDate(itemData.date);
      });
    }
  });

  // Month navigation
  $w('#btnPrevMonth').onClick(() => {
    currentMonth = new Date(year, month - 1, 1);
    renderDatePicker();
  });

  $w('#btnNextMonth').onClick(() => {
    currentMonth = new Date(year, month + 1, 1);
    renderDatePicker();
  });

  // Show closed-day notice
  const closedNotice = $w('#closedNotice');
  if (closedNotice) {
    closedNotice.text = 'Ferme le Lundi';
    closedNotice.show();
  }
}

/**
 * Handles date selection from the calendar.
 * @param {Date} date - The selected date
 */
function selectDate(date) {
  reservationData.date = date;
  reservationData.time = null; // Reset time when date changes
  slotAvailability = {};
  isWaitlistSlot = false;

  renderDatePicker();
  updateNextButtonState();

  // Fire dateSelected event
  $widget.fireEvent('dateSelected', {
    date: date.toISOString(),
    dayOfWeek: DAY_NAMES[date.getDay()],
  });
}

// ---------------------------------------------------------------------------
// Time Slots
// ---------------------------------------------------------------------------

/**
 * Generates time slot strings for a given service period.
 * @param {string} startTime - Start time in HH:MM format
 * @param {string} endTime - End time in HH:MM format
 * @returns {string[]} Array of time slot strings (HH:MM)
 */
function generateTimeSlots(startTime, endTime) {
  const slots = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const interval = 30; // 30-minute intervals

  // Last possible booking time accounts for slot duration
  const lastBooking = endMinutes - config.slotDurationMinutes;

  for (let m = startMinutes; m <= lastBooking; m += interval) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }

  return slots;
}

/**
 * Loads available slots from the backend for the selected date.
 * Queries the reservations collection to check capacity per slot.
 */
async function loadAvailableSlots() {
  if (!reservationData.date) return;

  setLoading(true);

  try {
    const dateStr = reservationData.date.toISOString().split('T')[0];

    // Query backend for slot availability
    const result = await getAvailableSlots(dateStr);

    slotAvailability = {};
    if (result && result.slots) {
      result.slots.forEach(slot => {
        slotAvailability[slot.time] = {
          bookedCovers: slot.bookedCovers || 0,
          available: slot.available,
          waitlistAvailable: slot.waitlistAvailable || false,
        };
      });
    }

    renderTimeSlots();
  } catch (err) {
    console.error('Error loading available slots:', err);
    showStepError('Impossible de charger les creneaux disponibles. Veuillez reessayer.');

    // Fallback: query wix-data directly
    await loadAvailableSlotsFromData();
  } finally {
    setLoading(false);
  }
}

/**
 * Fallback: queries wix-data directly to build slot availability.
 */
async function loadAvailableSlotsFromData() {
  if (!reservationData.date) return;

  try {
    const startOfDay = new Date(reservationData.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(reservationData.date);
    endOfDay.setHours(23, 59, 59, 999);

    const results = await wixData.query('Reservations')
      .ge('dateTime', startOfDay)
      .le('dateTime', endOfDay)
      .eq('status', 'confirmed')
      .find();

    slotAvailability = {};

    results.items.forEach(reservation => {
      const resTime = new Date(reservation.dateTime);
      const timeKey = `${String(resTime.getHours()).padStart(2, '0')}:${String(resTime.getMinutes()).padStart(2, '0')}`;

      if (!slotAvailability[timeKey]) {
        slotAvailability[timeKey] = { bookedCovers: 0, available: true, waitlistAvailable: false };
      }

      slotAvailability[timeKey].bookedCovers += reservation.partySize || 0;

      if (slotAvailability[timeKey].bookedCovers >= config.maxCapacity) {
        slotAvailability[timeKey].available = false;
        slotAvailability[timeKey].waitlistAvailable = config.enableWaitlist;
      }
    });

    renderTimeSlots();
  } catch (err) {
    console.error('Error querying reservations:', err);
  }
}

/**
 * Renders time slot buttons organized by lunch and dinner service.
 */
function renderTimeSlots() {
  const lunchSlots = generateTimeSlots(config.lunchStart, config.lunchEnd);
  const dinnerSlots = generateTimeSlots(config.dinnerStart, config.dinnerEnd);
  const allSlots = [];

  // Lunch section
  if (lunchSlots.length > 0) {
    allSlots.push({ _id: 'lunch-label', isLabel: true, label: 'Dejeuner' });
    lunchSlots.forEach(time => {
      allSlots.push(buildSlotItem(time, 'lunch'));
    });
  }

  // Dinner section
  if (dinnerSlots.length > 0) {
    allSlots.push({ _id: 'dinner-label', isLabel: true, label: 'Diner' });
    dinnerSlots.forEach(time => {
      allSlots.push(buildSlotItem(time, 'dinner'));
    });
  }

  const repeater = $w('#timeSlotsRepeater');
  repeater.data = allSlots;

  repeater.onItemReady(($item, itemData) => {
    if (itemData.isLabel) {
      $item('#slotButton').label = itemData.label;
      $item('#slotButton').className = 'time-slots__section-label';
      $item('#slotButton').disable();
      return;
    }

    const slotBtn = $item('#slotButton');
    slotBtn.label = itemData.time;

    let classes = 'time-slot';
    if (itemData.isSelected) {
      classes += ' time-slot--selected';
    } else if (itemData.isBooked) {
      classes += ' time-slot--booked';
    } else if (itemData.isWaitlist) {
      classes += ' time-slot--waitlist';
    } else {
      classes += ' time-slot--available';
    }
    slotBtn.className = classes;

    if (itemData.isBooked && !itemData.isWaitlist) {
      slotBtn.disable();
    } else {
      slotBtn.enable();
      slotBtn.onClick(() => {
        selectTimeSlot(itemData.time, itemData.isWaitlist);
      });
    }
  });
}

/**
 * Builds a time slot data item with availability info.
 * @param {string} time - Time string (HH:MM)
 * @param {string} service - Service period ('lunch' or 'dinner')
 * @returns {Object} Slot item data
 */
function buildSlotItem(time, service) {
  const availability = slotAvailability[time] || { bookedCovers: 0, available: true, waitlistAvailable: false };
  const isBooked = !availability.available;
  const isWaitlist = isBooked && availability.waitlistAvailable;
  const isSelected = reservationData.time === time;

  return {
    _id: `slot-${service}-${time.replace(':', '')}`,
    time,
    service,
    isBooked,
    isWaitlist,
    isSelected,
    bookedCovers: availability.bookedCovers,
  };
}

/**
 * Handles time slot selection.
 * @param {string} time - Selected time (HH:MM)
 * @param {boolean} waitlist - Whether this is a waitlist slot
 */
function selectTimeSlot(time, waitlist) {
  reservationData.time = time;
  isWaitlistSlot = waitlist;

  renderTimeSlots();
  updateNextButtonState();

  // Show waitlist notice if applicable
  const notice = $w('#waitlistNotice');
  if (notice) {
    if (waitlist) {
      notice.show();
    } else {
      notice.hide();
    }
  }
}

// ---------------------------------------------------------------------------
// Party Size
// ---------------------------------------------------------------------------

/**
 * Renders the party size selector with +/- controls.
 */
function renderPartySize() {
  const numberDisplay = $w('#partySizeNumber');
  const labelDisplay = $w('#partySizeLabel');
  const btnMinus = $w('#btnPartySizeMinus');
  const btnPlus = $w('#btnPartySizePlus');

  if (numberDisplay) {
    numberDisplay.text = String(reservationData.partySize);
  }
  if (labelDisplay) {
    labelDisplay.text = reservationData.partySize === 1 ? 'convive' : 'convives';
  }

  if (btnMinus) {
    btnMinus.enabled = reservationData.partySize > 1;
    btnMinus.onClick(() => {
      if (reservationData.partySize > 1) {
        reservationData.partySize--;
        renderPartySize();
        updateNextButtonState();
      }
    });
  }

  if (btnPlus) {
    btnPlus.enabled = reservationData.partySize < config.maxPartySize;
    btnPlus.onClick(() => {
      if (reservationData.partySize < config.maxPartySize) {
        reservationData.partySize++;
        renderPartySize();
        updateNextButtonState();
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Occasion Tags
// ---------------------------------------------------------------------------

/**
 * Renders occasion tag selection buttons.
 */
function renderOccasionTags() {
  const repeater = $w('#occasionRepeater');
  if (!repeater) return;

  const tagData = OCCASIONS.map(occ => ({
    _id: occ.key,
    key: occ.key,
    label: `${occ.icon} ${occ.label}`,
    isSelected: reservationData.occasion === occ.key,
  }));

  repeater.data = tagData;

  repeater.onItemReady(($item, itemData) => {
    const tag = $item('#occasionTag');
    tag.label = itemData.label;

    let classes = `occasion-tag occasion-tag--${itemData.key}`;
    if (itemData.isSelected) {
      classes += ' occasion-tag--selected';
    }
    tag.className = classes;

    tag.onClick(() => {
      // Toggle selection: deselect if already selected
      if (reservationData.occasion === itemData.key) {
        reservationData.occasion = null;
      } else {
        reservationData.occasion = itemData.key;
      }
      renderOccasionTags();
    });
  });
}

// ---------------------------------------------------------------------------
// Guest Form
// ---------------------------------------------------------------------------

/**
 * Renders the guest information form with validation bindings.
 */
function renderGuestForm() {
  const nameInput = $w('#guestName');
  const emailInput = $w('#guestEmail');
  const phoneInput = $w('#guestPhone');
  const requestsInput = $w('#specialRequests');

  // Populate existing values
  if (nameInput) {
    nameInput.value = reservationData.guestName;
    nameInput.onInput((event) => {
      reservationData.guestName = event.target.value;
      clearFieldError('guestName');
      updateNextButtonState();
    });
  }

  if (emailInput) {
    emailInput.value = reservationData.guestEmail;
    emailInput.onInput((event) => {
      reservationData.guestEmail = event.target.value;
      clearFieldError('guestEmail');
      updateNextButtonState();
    });
  }

  if (phoneInput) {
    phoneInput.value = reservationData.guestPhone;
    phoneInput.onInput((event) => {
      reservationData.guestPhone = event.target.value;
      clearFieldError('guestPhone');
      updateNextButtonState();
    });
  }

  if (requestsInput) {
    requestsInput.value = reservationData.specialRequests;
    requestsInput.onInput((event) => {
      reservationData.specialRequests = event.target.value;
    });
  }
}

/**
 * Validates the guest form fields.
 * @returns {boolean} True if all required fields are valid
 */
function validateGuestForm() {
  let isValid = true;

  // Name validation
  if (!reservationData.guestName || reservationData.guestName.trim().length < 2) {
    showFieldError('guestName', 'Veuillez entrer votre nom complet.');
    isValid = false;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!reservationData.guestEmail || !emailRegex.test(reservationData.guestEmail)) {
    showFieldError('guestEmail', 'Veuillez entrer une adresse email valide.');
    isValid = false;
  }

  // Phone validation (French phone format)
  const phoneRegex = /^(\+33|0)\s?[1-9](\s?\d{2}){4}$/;
  const phoneClean = (reservationData.guestPhone || '').replace(/[\s.-]/g, '');
  if (!reservationData.guestPhone || (!phoneRegex.test(reservationData.guestPhone) && phoneClean.length < 10)) {
    showFieldError('guestPhone', 'Veuillez entrer un numero de telephone valide.');
    isValid = false;
  }

  return isValid;
}

/**
 * Checks if all required guest form fields are filled (for button state).
 * @returns {boolean} True if all required fields have values
 */
function isGuestFormComplete() {
  return (
    reservationData.guestName.trim().length >= 2 &&
    reservationData.guestEmail.trim().length > 0 &&
    reservationData.guestPhone.trim().length >= 10
  );
}

/**
 * Shows an error message on a specific form field.
 * @param {string} fieldId - The field element ID
 * @param {string} message - Error message to display
 */
function showFieldError(fieldId, message) {
  const field = $w(`#${fieldId}`);
  const errorEl = $w(`#${fieldId}Error`);

  if (field) {
    field.className = (field.className || '') + ' guest-form__input--error';
  }
  if (errorEl) {
    errorEl.text = message;
    errorEl.show();
  }
}

/**
 * Clears the error state on a specific form field.
 * @param {string} fieldId - The field element ID
 */
function clearFieldError(fieldId) {
  const field = $w(`#${fieldId}`);
  const errorEl = $w(`#${fieldId}Error`);

  if (field) {
    field.className = (field.className || '').replace(' guest-form__input--error', '');
  }
  if (errorEl) {
    errorEl.hide();
  }
}

// ---------------------------------------------------------------------------
// Confirmation
// ---------------------------------------------------------------------------

/**
 * Renders the confirmation summary card with all reservation details.
 */
function renderConfirmation() {
  const dateFormatted = reservationData.date
    ? reservationData.date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const occasionLabel = reservationData.occasion
    ? OCCASIONS.find(o => o.key === reservationData.occasion)?.label || ''
    : 'Aucune';

  // Set confirmation details
  setTextIfExists('#confirmDate', dateFormatted);
  setTextIfExists('#confirmTime', reservationData.time || '');
  setTextIfExists('#confirmPartySize', `${reservationData.partySize} convive${reservationData.partySize > 1 ? 's' : ''}`);
  setTextIfExists('#confirmOccasion', occasionLabel);
  setTextIfExists('#confirmName', reservationData.guestName);
  setTextIfExists('#confirmEmail', reservationData.guestEmail);
  setTextIfExists('#confirmPhone', reservationData.guestPhone);

  if (reservationData.specialRequests) {
    setTextIfExists('#confirmRequests', reservationData.specialRequests);
    const requestsRow = $w('#confirmRequestsRow');
    if (requestsRow) requestsRow.show();
  } else {
    const requestsRow = $w('#confirmRequestsRow');
    if (requestsRow) requestsRow.hide();
  }

  // Show waitlist notice if applicable
  const waitlistNotice = $w('#confirmWaitlistNotice');
  if (waitlistNotice) {
    if (isWaitlistSlot) {
      waitlistNotice.show();
    } else {
      waitlistNotice.hide();
    }
  }
}

// ---------------------------------------------------------------------------
// Booking Submission
// ---------------------------------------------------------------------------

/**
 * Handles the final reservation confirmation.
 * Sends booking to backend with double-booking prevention.
 */
async function handleConfirmReservation() {
  if (isLoading) return;

  setLoading(true);
  disableConfirmButton();

  try {
    // Build reservation datetime
    const dateTime = new Date(reservationData.date);
    const [hours, minutes] = reservationData.time.split(':').map(Number);
    dateTime.setHours(hours, minutes, 0, 0);

    const bookingPayload = {
      dateTime: dateTime.toISOString(),
      partySize: reservationData.partySize,
      occasion: reservationData.occasion,
      guestName: reservationData.guestName.trim(),
      guestEmail: reservationData.guestEmail.trim(),
      guestPhone: reservationData.guestPhone.trim(),
      specialRequests: reservationData.specialRequests.trim(),
      slotDuration: config.slotDurationMinutes,
      isWaitlist: isWaitlistSlot,
    };

    let result;

    if (isWaitlistSlot) {
      // Join waitlist instead of direct booking
      result = await joinWaitlist(bookingPayload);

      if (result && result.success) {
        showSuccess(result.referenceId, true);

        $widget.fireEvent('waitlistJoined', {
          referenceId: result.referenceId,
          dateTime: bookingPayload.dateTime,
          partySize: bookingPayload.partySize,
          guestEmail: bookingPayload.guestEmail,
        });
      } else {
        throw new Error(result?.error || 'Erreur lors de l\'inscription sur la liste d\'attente.');
      }
    } else {
      // Attempt direct booking with double-booking prevention
      result = await bookReservation(bookingPayload);

      if (result && result.success) {
        showSuccess(result.referenceId, false);

        $widget.fireEvent('reservationBooked', {
          referenceId: result.referenceId,
          dateTime: bookingPayload.dateTime,
          partySize: bookingPayload.partySize,
          guestName: bookingPayload.guestName,
          guestEmail: bookingPayload.guestEmail,
          occasion: bookingPayload.occasion,
        });
      } else if (result && result.doubleBooked) {
        // Double-booking detected
        showBookingError(
          'Ce creneau vient d\'etre reserve. Veuillez selectionner un autre creneau.',
          true
        );
      } else {
        throw new Error(result?.error || 'Erreur lors de la reservation.');
      }
    }
  } catch (err) {
    console.error('Reservation error:', err);
    showBookingError(
      err.message || 'Une erreur est survenue. Veuillez reessayer.',
      false
    );
  } finally {
    setLoading(false);
    enableConfirmButton();
  }
}

/**
 * Displays the success state with confirmation details.
 * @param {string} referenceId - Booking reference ID
 * @param {boolean} isWaitlist - Whether this was a waitlist entry
 */
function showSuccess(referenceId, isWaitlist) {
  // Hide all steps
  for (let i = 0; i < TOTAL_STEPS; i++) {
    const stepEl = $w(`#step${i}`);
    if (stepEl) stepEl.hide();
  }

  // Hide navigation
  $w('#btnBack').hide();
  $w('#btnNext').hide();
  $w('#btnConfirm').hide();

  // Show success state
  const successEl = $w('#reservationSuccess');
  if (successEl) {
    successEl.show();
  }

  const titleEl = $w('#successTitle');
  if (titleEl) {
    titleEl.text = isWaitlist
      ? 'Inscrit sur la liste d\'attente!'
      : 'Reservation confirmee!';
  }

  const messageEl = $w('#successMessage');
  if (messageEl) {
    messageEl.text = isWaitlist
      ? 'Vous etes inscrit sur la liste d\'attente. Nous vous contacterons par email si une place se libere.'
      : 'Votre table est reservee. Un email de confirmation a ete envoye.';
  }

  const refEl = $w('#successRef');
  if (refEl) {
    refEl.text = `Ref: ${referenceId}`;
  }
}

// ---------------------------------------------------------------------------
// Error Handling
// ---------------------------------------------------------------------------

/**
 * Shows an inline error message for the current step.
 * @param {string} message - Error message
 */
function showStepError(message) {
  const errorEl = $w('#stepError');
  if (errorEl) {
    errorEl.text = message;
    errorEl.show();

    // Auto-hide after 4 seconds
    setTimeout(() => {
      errorEl.hide();
    }, 4000);
  }
}

/**
 * Shows a booking-level error with optional redirect to time slot selection.
 * @param {string} message - Error message
 * @param {boolean} goBackToTime - Whether to navigate back to time selection
 */
function showBookingError(message, goBackToTime) {
  const errorEl = $w('#bookingError');
  if (errorEl) {
    errorEl.text = message;
    errorEl.show();
  }

  if (goBackToTime) {
    // Navigate back to time selection after a brief delay
    setTimeout(() => {
      reservationData.time = null;
      currentStep = STEPS.TIME;
      renderStep(currentStep);
      loadAvailableSlots();
    }, 2500);
  }
}

// ---------------------------------------------------------------------------
// Loading State
// ---------------------------------------------------------------------------

/**
 * Toggles the loading state for the widget.
 * @param {boolean} loading - Whether the widget is in a loading state
 */
function setLoading(loading) {
  isLoading = loading;

  const loader = $w('#loadingIndicator');
  if (loader) {
    if (loading) {
      loader.show();
    } else {
      loader.hide();
    }
  }
}

/**
 * Disables the confirm button during submission.
 */
function disableConfirmButton() {
  const btn = $w('#btnConfirm');
  if (btn) {
    btn.disable();
    btn.label = 'Reservation en cours...';
  }
}

/**
 * Re-enables the confirm button after submission.
 */
function enableConfirmButton() {
  const btn = $w('#btnConfirm');
  if (btn) {
    btn.enable();
    btn.label = 'Confirmer la reservation';
  }
}

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

/**
 * Sets text on an element if it exists.
 * @param {string} selector - Wix selector string
 * @param {string} text - Text to set
 */
function setTextIfExists(selector, text) {
  const el = $w(selector);
  if (el) {
    el.text = text;
  }
}
