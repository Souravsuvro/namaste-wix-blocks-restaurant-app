/**
 * Settings Panel — Velo code for the custom settings panel.
 * Allows site builders to configure restaurant app settings.
 */

import wixData from 'wix-data';

const SETTINGS_COLLECTION = 'app-settings';
const SETTINGS_DOC_ID = 'restaurant-settings';

$w.onReady(async function () {
  await loadSettings();
  bindEventHandlers();
});

/**
 * Loads current settings from the database and populates the panel.
 */
async function loadSettings() {
  try {
    const settings = await wixData.get(SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    if (settings) {
      populateFields(settings);
    }
  } catch (err) {
    // First time — use defaults from panel.json
    console.log('No saved settings found, using defaults.');
  }
}

/**
 * Populates panel fields with saved values.
 * @param {Object} settings
 */
function populateFields(settings) {
  // General
  setFieldValue('#restaurantName', settings.restaurantName);
  setFieldValue('#currency', settings.currency);
  setFieldValue('#locale', settings.locale);

  // Hours
  setFieldValue('#lunchStart', settings.lunchStart);
  setFieldValue('#lunchEnd', settings.lunchEnd);
  setFieldValue('#dinnerStart', settings.dinnerStart);
  setFieldValue('#dinnerEnd', settings.dinnerEnd);

  // Menu
  setFieldValue('#menuLayout', settings.menuLayout);
  setFieldValue('#menuColumns', settings.menuColumns);
  setFieldValue('#itemsPerPage', settings.itemsPerPage);
  setToggle('#showSpiceLevel', settings.showSpiceLevel);
  setToggle('#showAllergens', settings.showAllergens);
  setToggle('#showDietaryBadges', settings.showDietaryBadges);
  setToggle('#showImages', settings.showImages);

  // Ordering
  setToggle('#enableDelivery', settings.enableDelivery);
  setToggle('#enablePickup', settings.enablePickup);
  setToggle('#enableDineIn', settings.enableDineIn);
  setFieldValue('#minimumOrder', settings.minimumOrder);
  setFieldValue('#serviceFeePercent', settings.serviceFeePercent);
  setFieldValue('#taxPercent', settings.taxPercent);

  // Delivery
  setFieldValue('#maxDeliveryRadius', settings.maxDeliveryRadius);
  setFieldValue('#baseFee', settings.baseFee);
  setFieldValue('#feePerKm', settings.feePerKm);
  setFieldValue('#freeDeliveryThreshold', settings.freeDeliveryThreshold);

  // Reservations
  setFieldValue('#maxPartySize', settings.maxPartySize);
  setFieldValue('#maxCapacity', settings.maxCapacity);
  setFieldValue('#slotDuration', settings.slotDuration);
  setToggle('#enableWaitlist', settings.enableWaitlist);

  // Appearance
  setFieldValue('#primaryColor', settings.primaryColor);
  setFieldValue('#accentColor', settings.accentColor);
  setFieldValue('#backgroundColor', settings.backgroundColor);
  setFieldValue('#fontFamily', settings.fontFamily);
}

/**
 * Binds change event handlers to all panel fields.
 */
function bindEventHandlers() {
  // Save on any field change
  const fieldIds = [
    '#restaurantName', '#currency', '#locale',
    '#lunchStart', '#lunchEnd', '#dinnerStart', '#dinnerEnd',
    '#menuLayout', '#menuColumns', '#itemsPerPage',
    '#minimumOrder', '#serviceFeePercent', '#taxPercent',
    '#maxDeliveryRadius', '#baseFee', '#feePerKm', '#freeDeliveryThreshold',
    '#maxPartySize', '#maxCapacity', '#slotDuration',
    '#primaryColor', '#accentColor', '#backgroundColor', '#fontFamily',
  ];

  const toggleIds = [
    '#showSpiceLevel', '#showAllergens', '#showDietaryBadges', '#showImages',
    '#enableDelivery', '#enablePickup', '#enableDineIn', '#enableWaitlist',
  ];

  fieldIds.forEach(id => {
    try {
      $w(id).onChange(() => saveSettings());
    } catch (e) {
      // Field may not exist in all panel layouts
    }
  });

  toggleIds.forEach(id => {
    try {
      $w(id).onChange(() => saveSettings());
    } catch (e) {
      // Toggle may not exist
    }
  });
}

/**
 * Collects all current field values and saves to the database.
 */
async function saveSettings() {
  const settings = {
    _id: SETTINGS_DOC_ID,
    restaurantName: getFieldValue('#restaurantName'),
    currency: getFieldValue('#currency'),
    locale: getFieldValue('#locale'),
    lunchStart: getFieldValue('#lunchStart'),
    lunchEnd: getFieldValue('#lunchEnd'),
    dinnerStart: getFieldValue('#dinnerStart'),
    dinnerEnd: getFieldValue('#dinnerEnd'),
    menuLayout: getFieldValue('#menuLayout'),
    menuColumns: getFieldValue('#menuColumns'),
    itemsPerPage: getFieldValue('#itemsPerPage'),
    showSpiceLevel: getToggleValue('#showSpiceLevel'),
    showAllergens: getToggleValue('#showAllergens'),
    showDietaryBadges: getToggleValue('#showDietaryBadges'),
    showImages: getToggleValue('#showImages'),
    enableDelivery: getToggleValue('#enableDelivery'),
    enablePickup: getToggleValue('#enablePickup'),
    enableDineIn: getToggleValue('#enableDineIn'),
    minimumOrder: getFieldValue('#minimumOrder'),
    serviceFeePercent: getFieldValue('#serviceFeePercent'),
    taxPercent: getFieldValue('#taxPercent'),
    maxDeliveryRadius: getFieldValue('#maxDeliveryRadius'),
    baseFee: getFieldValue('#baseFee'),
    feePerKm: getFieldValue('#feePerKm'),
    freeDeliveryThreshold: getFieldValue('#freeDeliveryThreshold'),
    maxPartySize: getFieldValue('#maxPartySize'),
    maxCapacity: getFieldValue('#maxCapacity'),
    slotDuration: getFieldValue('#slotDuration'),
    enableWaitlist: getToggleValue('#enableWaitlist'),
    primaryColor: getFieldValue('#primaryColor'),
    accentColor: getFieldValue('#accentColor'),
    backgroundColor: getFieldValue('#backgroundColor'),
    fontFamily: getFieldValue('#fontFamily'),
    updatedAt: new Date(),
  };

  try {
    await wixData.save(SETTINGS_COLLECTION, settings);
    showSaveConfirmation();
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

/**
 * Shows a brief save confirmation message.
 */
function showSaveConfirmation() {
  try {
    $w('#saveStatus').text = 'Settings saved!';
    $w('#saveStatus').show();
    setTimeout(() => {
      try { $w('#saveStatus').hide(); } catch (e) { /* noop */ }
    }, 2000);
  } catch (e) {
    // Status element may not exist
  }
}

/**
 * Safely gets a field value.
 * @param {string} selector
 * @returns {*}
 */
function getFieldValue(selector) {
  try { return $w(selector).value; } catch (e) { return undefined; }
}

/**
 * Safely gets a toggle/checkbox value.
 * @param {string} selector
 * @returns {boolean}
 */
function getToggleValue(selector) {
  try { return $w(selector).checked; } catch (e) { return undefined; }
}

/**
 * Safely sets a field value.
 * @param {string} selector
 * @param {*} value
 */
function setFieldValue(selector, value) {
  if (value === undefined) return;
  try { $w(selector).value = value; } catch (e) { /* noop */ }
}

/**
 * Safely sets a toggle/checkbox value.
 * @param {string} selector
 * @param {boolean} value
 */
function setToggle(selector, value) {
  if (value === undefined) return;
  try { $w(selector).checked = value; } catch (e) { /* noop */ }
}
