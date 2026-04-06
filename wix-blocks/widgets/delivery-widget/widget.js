/**
 * Namaste GIEN -- Delivery Zone & Tracking Widget
 * Premium Indian Restaurant - 12 Quai de Nice, 45500 Gien, France
 *
 * Provides delivery zone validation, fee calculation, estimated
 * delivery time, and live order tracking with status timeline.
 *
 * @module delivery-widget
 */

import wixData from 'wix-data';
import { checkDeliveryZone, calculateDeliveryFee, getDeliveryStatus } from 'backend/delivery-api';

/* ============================================================
   Constants
   ============================================================ */

/** Tracking status steps in order */
const TRACKING_STEPS = [
  { id: 'confirmed',  label: 'Order Confirmed',     icon: '\u2713' },
  { id: 'preparing',  label: 'Preparing Your Meal',  icon: '\uD83D\uDC68\u200D\uD83C\uDF73' },
  { id: 'ready',      label: 'Ready for Pickup',     icon: '\uD83D\uDCE6' },
  { id: 'picked-up',  label: 'Picked Up by Driver',  icon: '\uD83D\uDE97' },
  { id: 'on-way',     label: 'On the Way',           icon: '\uD83D\uDEF5' },
  { id: 'delivered',  label: 'Delivered',             icon: '\uD83C\uDFE0' }
];

/** Earth radius in kilometres (for Haversine) */
const EARTH_RADIUS_KM = 6371;

/** Polling interval for active delivery tracking (ms) */
const TRACKING_POLL_INTERVAL = 30000;

/** Minimum address length to attempt validation */
const MIN_ADDRESS_LENGTH = 5;

/* ============================================================
   Module State
   ============================================================ */

/** @type {object} Current widget configuration from properties */
let config = {};

/** @type {number|null} Interval ID for tracking polling */
let trackingIntervalId = null;

/** @type {string|null} Current active order ID being tracked */
let activeOrderId = null;

/** @type {{ lat: number, lng: number } | null} Validated customer coordinates */
let customerCoords = null;

/* ============================================================
   Lifecycle
   ============================================================ */

/**
 * Widget initialisation -- called when the widget loads on the page.
 * Reads initial property values and sets up event listeners.
 */
$widget.onReady(() => {
  initConfig($widget.props);
  setupAddressInput();
  renderZoneLegend();
  renderEmptyState();

  // Listen for property changes in the Blocks editor / site settings
  $widget.onPropsChanged((oldProps, newProps) => {
    initConfig(newProps);
    renderZoneLegend();
    resetDeliveryState();
  });
});

/* ============================================================
   Configuration
   ============================================================ */

/**
 * Merge widget properties into module-level config.
 *
 * @param {object} props - Widget property bag from Wix Blocks
 */
function initConfig(props) {
  config = {
    restaurantLat:         props.restaurantLat         ?? 47.6847,
    restaurantLng:         props.restaurantLng         ?? 2.6286,
    maxDeliveryRadiusKm:   props.maxDeliveryRadiusKm   ?? 10,
    baseFee:               props.baseFee               ?? 2.50,
    feePerKm:              props.feePerKm              ?? 0.80,
    freeDeliveryThreshold: props.freeDeliveryThreshold ?? 40,
    estimatedTimePerKm:    props.estimatedTimePerKm    ?? 3,
    basePreparationMinutes: props.basePreparationMinutes ?? 25,
    primaryColor:          props.primaryColor          ?? '#1B3A6B',
    accentColor:           props.accentColor           ?? '#E8731A'
  };
}

/* ============================================================
   Haversine Distance (Client-Side Approximation)
   ============================================================ */

/**
 * Calculate the great-circle distance between two points on Earth
 * using the Haversine formula.
 *
 * @param {number} lat1 - Latitude of point A (degrees)
 * @param {number} lng1 - Longitude of point A (degrees)
 * @param {number} lat2 - Latitude of point B (degrees)
 * @param {number} lng2 - Longitude of point B (degrees)
 * @returns {number} Distance in kilometres
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/* ============================================================
   Delivery Zone Check
   ============================================================ */

/**
 * Determine whether a customer location is within the delivery zone
 * and which fee tier applies.
 *
 * @param {number} distanceKm - Distance from restaurant in km
 * @returns {{ inZone: boolean, tier: string, tierLabel: string }}
 */
function getDeliveryZoneTier(distanceKm) {
  const maxRadius = config.maxDeliveryRadiusKm;

  if (distanceKm <= maxRadius * 0.33) {
    return { inZone: true, tier: 'free',     tierLabel: 'Close Range' };
  }
  if (distanceKm <= maxRadius * 0.66) {
    return { inZone: true, tier: 'standard', tierLabel: 'Standard Zone' };
  }
  if (distanceKm <= maxRadius) {
    return { inZone: true, tier: 'extended', tierLabel: 'Extended Zone' };
  }

  return { inZone: false, tier: 'outside', tierLabel: 'Outside Delivery Zone' };
}

/* ============================================================
   Fee Calculation
   ============================================================ */

/**
 * Calculate delivery fee based on distance and current config.
 *
 * Fee = baseFee + (distance * feePerKm).
 * Fee is waived when the order subtotal meets or exceeds the
 * free delivery threshold.
 *
 * @param {number} distanceKm       - Distance from restaurant in km
 * @param {number} [orderSubtotal=0] - Current order subtotal in EUR
 * @returns {{ baseFee: number, distanceFee: number, totalFee: number, isFree: boolean, freeThreshold: number }}
 */
function computeDeliveryFee(distanceKm, orderSubtotal = 0) {
  const baseFee     = config.baseFee;
  const distanceFee = Math.round(distanceKm * config.feePerKm * 100) / 100;
  const rawTotal    = Math.round((baseFee + distanceFee) * 100) / 100;
  const isFree      = orderSubtotal >= config.freeDeliveryThreshold;

  return {
    baseFee,
    distanceFee,
    totalFee: isFree ? 0 : rawTotal,
    isFree,
    freeThreshold: config.freeDeliveryThreshold
  };
}

/* ============================================================
   Estimated Delivery Time
   ============================================================ */

/**
 * Calculate the estimated total delivery time.
 *
 * Total = basePreparation + (distance * timePerKm)
 *
 * @param {number} distanceKm - Distance from restaurant in km
 * @returns {{ preparationMin: number, travelMin: number, totalMin: number, displayRange: string }}
 */
function computeDeliveryTime(distanceKm) {
  const preparationMin = config.basePreparationMinutes;
  const travelMin      = Math.ceil(distanceKm * config.estimatedTimePerKm);
  const totalMin       = preparationMin + travelMin;

  // Show a +/- 5 minute range for realism
  const low  = Math.max(totalMin - 5, preparationMin);
  const high = totalMin + 5;

  return {
    preparationMin,
    travelMin,
    totalMin,
    displayRange: `${low}\u2013${high} min`
  };
}

/* ============================================================
   Address Input & Validation
   ============================================================ */

/**
 * Set up the address input field with basic validation behaviour
 * and debounced lookup triggering.
 */
function setupAddressInput() {
  const $input = $w('#addressInput');
  const $btn   = $w('#validateAddressBtn');

  if ($input) {
    let debounceTimer = null;

    $input.onInput((event) => {
      const value = event.target.value.trim();

      clearTimeout(debounceTimer);

      if (value.length >= MIN_ADDRESS_LENGTH) {
        debounceTimer = setTimeout(() => {
          showAddressSuggestions(value);
        }, 400);
      } else {
        hideAddressSuggestions();
      }
    });

    $input.onKeyPress((event) => {
      if (event.key === 'Enter') {
        clearTimeout(debounceTimer);
        handleAddressValidation($input.value.trim());
      }
    });
  }

  if ($btn) {
    $btn.onClick(() => {
      const address = $input ? $input.value.trim() : '';
      handleAddressValidation(address);
    });
  }
}

/**
 * Display address suggestions based on partial input.
 * Uses wixData lookup for known addresses in the "DeliveryAddresses"
 * collection (if available), otherwise falls back to a simple echo.
 *
 * @param {string} query - Partial address string
 */
async function showAddressSuggestions(query) {
  try {
    const $suggestions = $w('#addressSuggestions');
    if (!$suggestions) return;

    // Attempt to find matching addresses from the CMS
    const results = await wixData.query('DeliveryAddresses')
      .contains('formattedAddress', query)
      .limit(5)
      .find();

    if (results.items.length > 0) {
      const items = results.items.map((item) => ({
        label: item.formattedAddress,
        lat:   item.latitude,
        lng:   item.longitude
      }));

      renderSuggestionsList($suggestions, items);
    } else {
      // If no CMS results, show the query itself as a suggestion
      renderSuggestionsList($suggestions, [{ label: query, lat: null, lng: null }]);
    }
  } catch (err) {
    console.warn('[Delivery Widget] Suggestions lookup failed:', err.message);
    hideAddressSuggestions();
  }
}

/**
 * Render suggestion items into the dropdown.
 *
 * @param {object} $container - Wix repeater / container element
 * @param {Array<{ label: string, lat: number|null, lng: number|null }>} items
 */
function renderSuggestionsList($container, items) {
  $container.data = items;
  $container.show();

  // Bind click handlers on each suggestion
  const $repeater = $w('#suggestionsRepeater');
  if ($repeater) {
    $repeater.onItemReady(($item, itemData) => {
      $item('#suggestionText').text = itemData.label;
      $item('#suggestionText').onClick(() => {
        $w('#addressInput').value = itemData.label;
        hideAddressSuggestions();
        handleAddressValidation(itemData.label, itemData.lat, itemData.lng);
      });
    });
    $repeater.data = items.map((item, idx) => ({ _id: String(idx), ...item }));
  }
}

/**
 * Hide the address suggestions dropdown.
 */
function hideAddressSuggestions() {
  const $suggestions = $w('#addressSuggestions');
  if ($suggestions) {
    $suggestions.hide();
  }
}

/**
 * Validate an address and determine delivery eligibility.
 * If coordinates are not provided, falls back to the backend
 * geocoding service.
 *
 * @param {string}      address - Full address string
 * @param {number|null} [lat]   - Pre-resolved latitude
 * @param {number|null} [lng]   - Pre-resolved longitude
 */
async function handleAddressValidation(address, lat = null, lng = null) {
  if (!address || address.length < MIN_ADDRESS_LENGTH) {
    showValidationError('Please enter a valid delivery address.');
    return;
  }

  showLoadingState();

  try {
    let resolvedLat = lat;
    let resolvedLng = lng;

    // If no coords provided, call backend to validate / geocode
    if (resolvedLat === null || resolvedLng === null) {
      const zoneResult = await checkDeliveryZone(address);

      if (!zoneResult || !zoneResult.lat || !zoneResult.lng) {
        showValidationError('We could not locate that address. Please try a more specific address.');
        return;
      }

      resolvedLat = zoneResult.lat;
      resolvedLng = zoneResult.lng;
    }

    // Store validated coordinates
    customerCoords = { lat: resolvedLat, lng: resolvedLng };

    // Calculate distance using Haversine
    const distance = haversineDistance(
      config.restaurantLat, config.restaurantLng,
      resolvedLat, resolvedLng
    );

    // Determine zone tier
    const zoneTier = getDeliveryZoneTier(distance);

    if (!zoneTier.inZone) {
      renderOutOfZone(address, distance);
      fireEvent('addressValidated', { address, inZone: false, distance });
      return;
    }

    // Calculate fee and time
    const fee  = computeDeliveryFee(distance);
    const time = computeDeliveryTime(distance);

    // Render results
    renderAddressResult(address, distance, zoneTier);
    renderFeeBreakdown(fee, distance);
    renderDeliveryTime(time);

    // Fire custom events
    fireEvent('addressValidated', {
      address,
      inZone: true,
      distance: Math.round(distance * 10) / 10,
      tier: zoneTier.tier
    });

    fireEvent('deliveryFeeCalculated', {
      fee: fee.totalFee,
      isFree: fee.isFree,
      distance: Math.round(distance * 10) / 10,
      estimatedTime: time.displayRange
    });

  } catch (err) {
    console.error('[Delivery Widget] Address validation error:', err);
    showValidationError('Something went wrong. Please try again.');
  }
}

/* ============================================================
   Zone Visualization (Text-Based)
   ============================================================ */

/**
 * Render the delivery zone legend with fee tiers.
 * Since no map API is available, we use a text-based legend
 * alongside CSS circles for visual indication.
 */
function renderZoneLegend() {
  const maxRadius = config.maxDeliveryRadiusKm;
  const $legend   = $w('#zoneLegend');

  if (!$legend) return;

  const tiers = [
    {
      label: `0\u2013${Math.round(maxRadius * 0.33)} km`,
      fee:   'Reduced fee',
      className: 'free'
    },
    {
      label: `${Math.round(maxRadius * 0.33)}\u2013${Math.round(maxRadius * 0.66)} km`,
      fee:   `From \u20AC${config.baseFee.toFixed(2)}`,
      className: 'standard'
    },
    {
      label: `${Math.round(maxRadius * 0.66)}\u2013${maxRadius} km`,
      fee:   `From \u20AC${(config.baseFee + config.feePerKm * maxRadius * 0.66).toFixed(2)}`,
      className: 'extended'
    }
  ];

  const $repeater = $w('#zoneLegendRepeater');
  if ($repeater) {
    $repeater.onItemReady(($item, itemData) => {
      $item('#legendLabel').text = `${itemData.label} -- ${itemData.fee}`;
    });
    $repeater.data = tiers.map((t, i) => ({ _id: String(i), ...t }));
  }

  // Update the map placeholder text
  const $mapPlaceholder = $w('#mapPlaceholder');
  if ($mapPlaceholder) {
    $mapPlaceholder.text = `Delivery within ${maxRadius} km of Namaste GIEN\n12 Quai de Nice, 45500 Gien`;
  }
}

/* ============================================================
   Rendering Helpers
   ============================================================ */

/**
 * Show the initial empty state prompting the user to enter an address.
 */
function renderEmptyState() {
  hideElement('#addressResult');
  hideElement('#feeDisplay');
  hideElement('#deliveryTimeDisplay');
  hideElement('#outOfZoneMessage');
  hideElement('#deliveryTracker');
  hideElement('#validationError');
  showElement('#emptyState');
}

/**
 * Show a loading spinner while validating.
 */
function showLoadingState() {
  hideElement('#emptyState');
  hideElement('#addressResult');
  hideElement('#feeDisplay');
  hideElement('#deliveryTimeDisplay');
  hideElement('#outOfZoneMessage');
  hideElement('#validationError');
  showElement('#loadingState');
}

/**
 * Display a validation error message.
 *
 * @param {string} message - Error message to display
 */
function showValidationError(message) {
  hideElement('#loadingState');
  hideElement('#emptyState');
  hideElement('#addressResult');
  hideElement('#feeDisplay');
  hideElement('#outOfZoneMessage');

  const $error = $w('#validationError');
  if ($error) {
    $error.text = message;
    $error.show();
  }
}

/**
 * Render the validated address result card.
 *
 * @param {string} address  - Validated address string
 * @param {number} distance - Distance in km
 * @param {object} zoneTier - Zone tier information
 */
function renderAddressResult(address, distance, zoneTier) {
  hideElement('#loadingState');
  hideElement('#emptyState');
  hideElement('#outOfZoneMessage');
  hideElement('#validationError');

  const $result = $w('#addressResult');
  if (!$result) return;

  const $address  = $w('#resultAddress');
  const $distance = $w('#resultDistance');
  const $tier     = $w('#resultTier');

  if ($address)  $address.text  = address;
  if ($distance) $distance.text = `${distance.toFixed(1)} km from Namaste GIEN`;
  if ($tier)     $tier.text     = zoneTier.tierLabel;

  showElement('#addressResult');

  // Wire up the "change address" button
  const $changeBtn = $w('#changeAddressBtn');
  if ($changeBtn) {
    $changeBtn.onClick(() => {
      resetDeliveryState();
      const $input = $w('#addressInput');
      if ($input) {
        $input.value = '';
        $input.focus();
      }
    });
  }
}

/**
 * Render the delivery fee breakdown card.
 *
 * @param {object} fee      - Fee calculation result
 * @param {number} distance - Distance in km
 */
function renderFeeBreakdown(fee, distance) {
  const $feeBase     = $w('#feeBase');
  const $feeDistance  = $w('#feeDistance');
  const $feeTotal    = $w('#feeTotal');
  const $freeHint    = $w('#freeThresholdHint');
  const $freeBadge   = $w('#freeBadge');

  if ($feeBase)    $feeBase.text    = `\u20AC${fee.baseFee.toFixed(2)}`;
  if ($feeDistance) $feeDistance.text = `\u20AC${fee.distanceFee.toFixed(2)} (${distance.toFixed(1)} km)`;
  if ($feeTotal)   $feeTotal.text   = fee.isFree ? 'FREE' : `\u20AC${fee.totalFee.toFixed(2)}`;

  if ($freeHint) {
    $freeHint.text = fee.isFree
      ? 'Free delivery applied!'
      : `Free delivery on orders over \u20AC${fee.freeThreshold.toFixed(2)}`;
  }

  if ($freeBadge) {
    if (fee.isFree) {
      $freeBadge.show();
    } else {
      $freeBadge.hide();
    }
  }

  showElement('#feeDisplay');
}

/**
 * Render the estimated delivery time card.
 *
 * @param {object} time - Time calculation result
 */
function renderDeliveryTime(time) {
  const $timeValue     = $w('#deliveryTimeValue');
  const $timeBreakdown = $w('#deliveryTimeBreakdown');

  if ($timeValue)     $timeValue.text     = time.displayRange;
  if ($timeBreakdown) $timeBreakdown.text = `Preparation: ${time.preparationMin} min | Travel: ${time.travelMin} min`;

  showElement('#deliveryTimeDisplay');
}

/**
 * Render the "outside delivery zone" message.
 *
 * @param {string} address  - The address that was checked
 * @param {number} distance - Distance in km
 */
function renderOutOfZone(address, distance) {
  hideElement('#loadingState');
  hideElement('#emptyState');
  hideElement('#addressResult');
  hideElement('#feeDisplay');
  hideElement('#deliveryTimeDisplay');
  hideElement('#validationError');

  const $message  = $w('#outOfZoneMessage');
  const $distance = $w('#outOfZoneDistance');
  const $text     = $w('#outOfZoneText');

  if ($distance) {
    $distance.text = `${distance.toFixed(1)} km away`;
  }

  if ($text) {
    $text.text = `Unfortunately, ${address} is outside our ${config.maxDeliveryRadiusKm} km delivery zone. You can still place an order for pickup at 12 Quai de Nice, 45500 Gien.`;
  }

  showElement('#outOfZoneMessage');
}

/**
 * Reset the delivery state back to empty.
 */
function resetDeliveryState() {
  customerCoords = null;
  stopTrackingPolling();
  renderEmptyState();
}

/* ============================================================
   Order Tracking
   ============================================================ */

/**
 * Start tracking a delivery order by its ID.
 * Polls the backend every 30 seconds for status updates.
 *
 * @param {string} orderId - The order ID to track
 */
function startOrderTracking(orderId) {
  if (!orderId) {
    console.warn('[Delivery Widget] No order ID provided for tracking.');
    return;
  }

  activeOrderId = orderId;

  // Fetch initial status
  fetchAndRenderTrackingStatus(orderId);

  // Set up polling
  stopTrackingPolling();
  trackingIntervalId = setInterval(() => {
    fetchAndRenderTrackingStatus(orderId);
  }, TRACKING_POLL_INTERVAL);
}

/**
 * Stop the tracking status polling interval.
 */
function stopTrackingPolling() {
  if (trackingIntervalId !== null) {
    clearInterval(trackingIntervalId);
    trackingIntervalId = null;
  }
  activeOrderId = null;
}

/**
 * Fetch order status from the backend and render the timeline.
 *
 * @param {string} orderId - The order ID to query
 */
async function fetchAndRenderTrackingStatus(orderId) {
  try {
    const status = await getDeliveryStatus(orderId);

    if (!status) {
      console.warn('[Delivery Widget] No status returned for order:', orderId);
      return;
    }

    renderTrackingTimeline(status);

    fireEvent('trackingUpdated', {
      orderId,
      currentStep: status.currentStep,
      eta: status.estimatedArrival || null,
      driver: status.driver || null
    });

    // Stop polling when delivered
    if (status.currentStep === 'delivered') {
      stopTrackingPolling();
    }

  } catch (err) {
    console.error('[Delivery Widget] Tracking fetch error:', err);
  }
}

/**
 * Render the tracking timeline based on current order status.
 *
 * @param {object} status - Order status from backend
 * @param {string} status.currentStep  - Current step ID
 * @param {string} [status.estimatedArrival] - ETA display string
 * @param {object} [status.driver] - Driver info { name, phone }
 * @param {object} [status.stepTimes] - Map of step ID to timestamp
 */
function renderTrackingTimeline(status) {
  const $tracker = $w('#deliveryTracker');
  if (!$tracker) return;

  showElement('#deliveryTracker');

  // Render order ID
  const $orderId = $w('#trackingOrderId');
  if ($orderId && activeOrderId) {
    $orderId.text = `#${activeOrderId}`;
  }

  // Render timeline steps
  const $repeater = $w('#trackingStepsRepeater');
  if ($repeater) {
    const currentStepIndex = TRACKING_STEPS.findIndex(
      (s) => s.id === status.currentStep
    );

    $repeater.onItemReady(($item, itemData, index) => {
      const $label     = $item('#stepLabel');
      const $icon      = $item('#stepIcon');
      const $time      = $item('#stepTime');
      const $indicator = $item('#stepIndicator');

      if ($label)     $label.text = itemData.label;
      if ($icon)      $icon.text  = itemData.icon;

      // Set step time if available
      if ($time && status.stepTimes && status.stepTimes[itemData.id]) {
        $time.text = formatTime(status.stepTimes[itemData.id]);
        $time.show();
      } else if ($time) {
        $time.hide();
      }

      // Apply step state CSS classes via collapsing/expanding indicator elements
      if (index < currentStepIndex) {
        // Completed
        if ($indicator) $indicator.text = '\u2713';
        applyStepState($item, 'completed');
      } else if (index === currentStepIndex) {
        // Active
        applyStepState($item, 'active');
      } else {
        // Pending
        applyStepState($item, 'pending');
      }
    });

    $repeater.data = TRACKING_STEPS.map((step, idx) => ({
      _id: String(idx),
      ...step
    }));
  }

  // Render ETA
  const $eta = $w('#trackingEta');
  if ($eta && status.estimatedArrival) {
    $eta.text = status.estimatedArrival;
    showElement('#trackingEtaContainer');
  }

  // Render driver info
  if (status.driver) {
    renderDriverInfo(status.driver);
  }
}

/**
 * Apply visual state to a tracking step element.
 *
 * @param {object} $item - Wix repeater item scope
 * @param {'completed'|'active'|'pending'} state - Step state
 */
function applyStepState($item, state) {
  const $completed = $item('#stepCompleted');
  const $active    = $item('#stepActive');
  const $pending   = $item('#stepPending');

  // Toggle visibility of state-specific containers
  if ($completed) state === 'completed' ? $completed.show() : $completed.hide();
  if ($active)    state === 'active'    ? $active.show()    : $active.hide();
  if ($pending)   state === 'pending'   ? $pending.show()   : $pending.hide();
}

/**
 * Render the driver information card.
 *
 * @param {object} driver - Driver details
 * @param {string} driver.name  - Driver's name
 * @param {string} driver.phone - Driver's phone number
 */
function renderDriverInfo(driver) {
  const $name  = $w('#driverName');
  const $phone = $w('#driverPhone');

  if ($name)  $name.text  = driver.name  || 'Driver assigned';
  if ($phone) $phone.text = driver.phone || '';

  if (driver.phone) {
    const $phoneLink = $w('#driverPhoneLink');
    if ($phoneLink) {
      $phoneLink.link = `tel:${driver.phone}`;
    }
  }

  showElement('#driverInfoCard');
}

/* ============================================================
   Utility Functions
   ============================================================ */

/**
 * Format a timestamp into a human-readable time string (HH:MM).
 *
 * @param {string|number|Date} timestamp - Timestamp to format
 * @returns {string} Formatted time string
 */
function formatTime(timestamp) {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', {
      hour:   '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
}

/**
 * Show a Wix element by selector.
 *
 * @param {string} selector - Wix element selector (e.g. '#myElement')
 */
function showElement(selector) {
  try {
    const $el = $w(selector);
    if ($el) $el.show();
  } catch {
    // Element may not exist in the current layout
  }
}

/**
 * Hide a Wix element by selector.
 *
 * @param {string} selector - Wix element selector (e.g. '#myElement')
 */
function hideElement(selector) {
  try {
    const $el = $w(selector);
    if ($el) $el.hide();
  } catch {
    // Element may not exist in the current layout
  }
}

/**
 * Fire a custom widget event with data.
 *
 * @param {string} eventName - Name of the event to fire
 * @param {object} data      - Event payload
 */
function fireEvent(eventName, data) {
  try {
    $widget.fireEvent(eventName, data);
  } catch (err) {
    console.warn(`[Delivery Widget] Failed to fire event "${eventName}":`, err.message);
  }
}

/* ============================================================
   Public API (exposed for page-level code)
   ============================================================ */

/**
 * Programmatically validate an address from external code.
 *
 * @param {string} address - Address to validate
 * @returns {Promise<void>}
 */
export function validateAddress(address) {
  return handleAddressValidation(address);
}

/**
 * Start tracking an order from external code.
 *
 * @param {string} orderId - Order ID to track
 */
export function trackOrder(orderId) {
  startOrderTracking(orderId);
}

/**
 * Stop tracking and reset widget state from external code.
 */
export function resetWidget() {
  resetDeliveryState();
}

/**
 * Get the current delivery fee for a given distance and subtotal.
 *
 * @param {number} distanceKm    - Distance in km
 * @param {number} orderSubtotal - Order subtotal in EUR
 * @returns {{ baseFee: number, distanceFee: number, totalFee: number, isFree: boolean, freeThreshold: number }}
 */
export function getDeliveryFee(distanceKm, orderSubtotal) {
  return computeDeliveryFee(distanceKm, orderSubtotal);
}

/**
 * Get the estimated delivery time for a given distance.
 *
 * @param {number} distanceKm - Distance in km
 * @returns {{ preparationMin: number, travelMin: number, totalMin: number, displayRange: string }}
 */
export function getEstimatedTime(distanceKm) {
  return computeDeliveryTime(distanceKm);
}
