/**
 * Namaste GIEN - Menu Widget (Velo-compatible)
 * Premium Indian Restaurant in France
 *
 * Displays the restaurant menu with categories, dietary filters,
 * spice levels, allergen indicators, and responsive layouts.
 *
 * @module menu-widget
 */

import wixData from 'wix-data';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** @type {string[]} Menu category definitions in display order */
const CATEGORIES = [
  'Entrees',
  'Plats Principaux',
  'Tandoori & Grillades',
  'Biryani & Riz',
  'Desserts',
  'Bar & Cocktails',
];

/** @type {string} Label for the "all items" pseudo-category */
const ALL_CATEGORIES_LABEL = 'Tous';

/** @type {{ key: string, label: string, icon: string, badgeClass: string }[]} Dietary filter definitions */
const DIETARY_FILTERS = [
  { key: 'vegetarian', label: 'Vegetarian', icon: '\uD83E\uDD66', badgeClass: 'menu-item__badge--vegetarian' },
  { key: 'vegan', label: 'Vegan', icon: '\uD83C\uDF31', badgeClass: 'menu-item__badge--vegan' },
  { key: 'glutenFree', label: 'Gluten-Free', icon: '\uD83C\uDF3E', badgeClass: 'menu-item__badge--gluten-free' },
  { key: 'halal', label: 'Halal', icon: '\u2733\uFE0F', badgeClass: 'menu-item__badge--halal' },
];

/** @type {{ key: string, icon: string, label: string }[]} Allergen icon map */
const ALLERGEN_ICONS = [
  { key: 'dairy', icon: '\uD83E\uDD5B', label: 'Dairy' },
  { key: 'nuts', icon: '\uD83E\uDD5C', label: 'Nuts' },
  { key: 'shellfish', icon: '\uD83E\uDD90', label: 'Shellfish' },
  { key: 'eggs', icon: '\uD83E\uDD5A', label: 'Eggs' },
  { key: 'soy', icon: '\uD83C\uDF3F', label: 'Soy' },
  { key: 'wheat', icon: '\uD83C\uDF3E', label: 'Wheat' },
  { key: 'fish', icon: '\uD83D\uDC1F', label: 'Fish' },
  { key: 'sesame', icon: '\uD83C\uDF30', label: 'Sesame' },
];

/** @type {string} Database collection name */
const COLLECTION_NAME = 'menu-items';

/** @type {number} Maximum spice level value */
const MAX_SPICE_LEVEL = 5;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** @type {string} Currently active category (empty string means "all") */
let activeCategory = '';

/** @type {Set<string>} Currently active dietary filter keys */
let activeFilters = new Set();

/** @type {string} Current layout mode */
let currentLayout = 'grid';

/** @type {number} Current page (1-indexed) */
let currentPage = 1;

/** @type {number} Items per page */
let itemsPerPage = 12;

/** @type {number} Total matching items for pagination */
let totalItems = 0;

/** @type {number} Number of grid columns */
let columns = 3;

/** @type {boolean} Whether to show spice levels */
let showSpiceLevel = true;

/** @type {boolean} Whether to show allergens */
let showAllergens = true;

/** @type {boolean} Whether to show dietary badges */
let showDietaryBadges = true;

/** @type {boolean} Whether to show item images */
let showImages = true;

/** @type {string} Currency code for price formatting */
let currency = 'EUR';

// ---------------------------------------------------------------------------
// Formatting Helpers
// ---------------------------------------------------------------------------

/**
 * Creates an Intl.NumberFormat instance for the given currency.
 *
 * @param {string} currencyCode - ISO 4217 currency code (e.g. "EUR").
 * @returns {Intl.NumberFormat} Formatter for currency display.
 */
function createPriceFormatter(currencyCode) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** @type {Intl.NumberFormat} Active price formatter */
let priceFormatter = createPriceFormatter(currency);

/**
 * Formats a numeric price for display.
 *
 * @param {number} price - The price value.
 * @returns {string} The formatted price string (e.g. "14,50 \u20AC").
 */
function formatPrice(price) {
  if (typeof price !== 'number' || isNaN(price)) {
    return '';
  }
  return priceFormatter.format(price);
}

/**
 * Renders spice level as a string of chili emojis.
 *
 * @param {number} level - Spice level (0 to MAX_SPICE_LEVEL).
 * @returns {string} A string of chili emojis, or empty string for level 0.
 */
function renderSpiceLevel(level) {
  const clamped = Math.max(0, Math.min(MAX_SPICE_LEVEL, Math.round(level || 0)));
  if (clamped === 0) return '';
  return '\uD83C\uDF36\uFE0F'.repeat(clamped);
}

/**
 * Returns the CSS class name for a layout container.
 *
 * @param {string} layout - One of "grid", "list", "card", "editorial".
 * @returns {string} The CSS class name.
 */
function getLayoutClass(layout) {
  switch (layout) {
    case 'list':
      return 'menu-list';
    case 'card':
    case 'editorial':
      return 'menu-card';
    case 'grid':
    default:
      return 'menu-grid';
  }
}

// ---------------------------------------------------------------------------
// Data Fetching
// ---------------------------------------------------------------------------

/**
 * Queries the menu-items collection with the current filters and pagination.
 *
 * @returns {Promise<{ items: object[], totalCount: number }>} Resolved with matching items and total count.
 * @throws {Error} If the database query fails.
 */
async function fetchMenuItems() {
  let query = wixData.query(COLLECTION_NAME);

  // Category filter
  if (activeCategory) {
    query = query.eq('category', activeCategory);
  }

  // Dietary filters (all selected filters must be true on the item)
  activeFilters.forEach((filterKey) => {
    query = query.eq(filterKey, true);
  });

  // Sorting: category order first, then sort order within category
  query = query
    .ascending('sortOrder')
    .ascending('title');

  // Pagination
  const skip = (currentPage - 1) * itemsPerPage;
  query = query.skip(skip).limit(itemsPerPage);

  const results = await query.find();

  return {
    items: results.items,
    totalCount: results.totalCount,
  };
}

// ---------------------------------------------------------------------------
// Rendering Functions
// ---------------------------------------------------------------------------

/**
 * Renders the category tabs into the #menuTabs container.
 * Creates a tab for "All" plus one for each category.
 */
function renderCategoryTabs() {
  const container = $w('#menuTabs');
  if (!container) return;

  const allCategories = [ALL_CATEGORIES_LABEL, ...CATEGORIES];
  let html = '';

  allCategories.forEach((cat, index) => {
    const isAll = index === 0;
    const catValue = isAll ? '' : cat;
    const isActive = catValue === activeCategory;
    const activeClass = isActive ? ' menu-tab--active' : '';

    html += `<button
      class="menu-tab${activeClass}"
      data-category="${catValue}"
      role="tab"
      aria-selected="${isActive}"
      tabindex="${isActive ? '0' : '-1'}"
    >${cat}</button>`;
  });

  container.html = html;
}

/**
 * Renders the dietary filter buttons into the #menuFilters container.
 */
function renderFilterButtons() {
  const container = $w('#menuFilters');
  if (!container) return;

  let html = '';

  DIETARY_FILTERS.forEach((filter) => {
    const isActive = activeFilters.has(filter.key);
    const activeClass = isActive ? ' menu-filter-btn--active' : '';

    html += `<button
      class="menu-filter-btn${activeClass}"
      data-filter="${filter.key}"
      role="checkbox"
      aria-checked="${isActive}"
    >
      <span class="menu-filter-btn__icon">${filter.icon}</span>
      ${filter.label}
    </button>`;
  });

  container.html = html;
}

/**
 * Renders a single menu item as an HTML card.
 *
 * @param {object} item - The menu item data object from the collection.
 * @returns {string} HTML string for the menu item.
 */
function renderMenuItem(item) {
  // Image
  let imageHtml = '';
  if (showImages) {
    if (item.image) {
      imageHtml = `
        <div class="menu-item__image">
          <img src="${item.image}" alt="${item.title || ''}" loading="lazy" />
        </div>`;
    } else {
      imageHtml = `
        <div class="menu-item__image menu-item__image--placeholder">
          \uD83C\uDF5B
        </div>`;
    }
  }

  // Spice level
  let spiceHtml = '';
  if (showSpiceLevel && item.spiceLevel && item.spiceLevel > 0) {
    const spiceEmojis = renderSpiceLevel(item.spiceLevel);
    const spiceIcons = spiceEmojis
      .split('')
      .filter((ch) => ch !== '\uFE0F') // Filter variation selectors to avoid double-counting
      .map(() => '<span class="menu-item__spice-icon">\uD83C\uDF36\uFE0F</span>')
      .slice(0, item.spiceLevel)
      .join('');
    spiceHtml = `<div class="menu-item__spice" aria-label="Spice level ${item.spiceLevel} out of ${MAX_SPICE_LEVEL}">${spiceIcons}</div>`;
  }

  // Dietary badges
  let badgesHtml = '';
  if (showDietaryBadges) {
    const badges = [];
    if (item.vegetarian) badges.push({ label: 'V', cls: 'menu-item__badge--vegetarian', title: 'Vegetarian' });
    if (item.vegan) badges.push({ label: 'VG', cls: 'menu-item__badge--vegan', title: 'Vegan' });
    if (item.glutenFree) badges.push({ label: 'GF', cls: 'menu-item__badge--gluten-free', title: 'Gluten-Free' });
    if (item.halal) badges.push({ label: 'H', cls: 'menu-item__badge--halal', title: 'Halal' });

    if (badges.length > 0) {
      const badgeTags = badges
        .map((b) => `<span class="menu-item__badge ${b.cls}" title="${b.title}">${b.label}</span>`)
        .join('');
      badgesHtml = `<div class="menu-item__badges">${badgeTags}</div>`;
    }
  }

  // Allergens
  let allergensHtml = '';
  if (showAllergens && item.allergens && item.allergens.length > 0) {
    const allergenTags = item.allergens
      .map((allergenKey) => {
        const allergen = ALLERGEN_ICONS.find((a) => a.key === allergenKey);
        if (!allergen) return '';
        return `<span class="menu-item__allergen" title="${allergen.label}">${allergen.icon}</span>`;
      })
      .filter(Boolean)
      .join('');

    if (allergenTags) {
      allergensHtml = `<div class="menu-item__allergens">${allergenTags}</div>`;
    }
  }

  // Price
  const priceText = formatPrice(item.price);

  // Description
  const descriptionHtml = item.description
    ? `<p class="menu-item__description">${item.description}</p>`
    : '';

  return `
    <article
      class="menu-item"
      data-item-id="${item._id}"
      role="button"
      tabindex="0"
      aria-label="${item.title || 'Menu item'} - ${priceText}"
    >
      ${imageHtml}
      <div class="menu-item__content">
        <h3 class="menu-item__name">${item.title || ''}</h3>
        ${descriptionHtml}
        <span class="menu-item__price">${priceText}</span>
        ${spiceHtml}
        ${badgesHtml}
        ${allergensHtml}
      </div>
    </article>`;
}

/**
 * Renders the full list of menu items into the #menuItems container.
 *
 * @param {object[]} items - Array of menu item data objects.
 */
function renderMenuItems(items) {
  const container = $w('#menuItems');
  if (!container) return;

  if (!items || items.length === 0) {
    renderEmptyState();
    return;
  }

  const layoutClass = getLayoutClass(currentLayout);
  const columnsAttr = currentLayout === 'grid' ? ` data-columns="${columns}"` : '';
  const itemsHtml = items.map(renderMenuItem).join('');

  container.html = `<div class="${layoutClass}"${columnsAttr}>${itemsHtml}</div>`;
}

/**
 * Renders pagination controls into the #menuPagination container.
 */
function renderPagination() {
  const container = $w('#menuPagination');
  if (!container) return;

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) {
    container.html = '';
    return;
  }

  let html = '<nav class="menu-pagination" role="navigation" aria-label="Menu pagination">';

  // Previous button
  html += `<button
    class="menu-pagination__btn"
    data-page="prev"
    ${currentPage <= 1 ? 'disabled' : ''}
    aria-label="Previous page"
  >\u2190</button>`;

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    const isActive = i === currentPage;
    html += `<button
      class="menu-pagination__btn${isActive ? ' menu-pagination__btn--active' : ''}"
      data-page="${i}"
      ${isActive ? 'aria-current="page"' : ''}
    >${i}</button>`;
  }

  // Next button
  html += `<button
    class="menu-pagination__btn"
    data-page="next"
    ${currentPage >= totalPages ? 'disabled' : ''}
    aria-label="Next page"
  >\u2192</button>`;

  html += '</nav>';
  container.html = html;
}

/**
 * Shows the loading skeleton state in the #menuItems container.
 */
function showLoadingState() {
  const container = $w('#menuItems');
  if (!container) return;

  const skeletonCount = itemsPerPage > 6 ? 6 : itemsPerPage;
  let skeletons = '';

  for (let i = 0; i < skeletonCount; i++) {
    skeletons += `
      <div class="menu-loading__item">
        <div class="menu-loading__image"></div>
        <div class="menu-loading__text">
          <div class="menu-loading__line menu-loading__line--medium"></div>
          <div class="menu-loading__line menu-loading__line--full"></div>
          <div class="menu-loading__line menu-loading__line--short"></div>
          <div class="menu-loading__line menu-loading__line--price"></div>
        </div>
      </div>`;
  }

  container.html = `<div class="menu-loading">${skeletons}</div>`;
}

/**
 * Shows the empty state when no items match the current filters.
 */
function renderEmptyState() {
  const container = $w('#menuItems');
  if (!container) return;

  container.html = `
    <div class="menu-empty">
      <div class="menu-empty__icon">\uD83C\uDF7D\uFE0F</div>
      <h3 class="menu-empty__title">Aucun plat trouv\u00E9</h3>
      <p class="menu-empty__message">
        Aucun plat ne correspond aux filtres s\u00E9lectionn\u00E9s.
        Essayez de modifier vos crit\u00E8res de recherche.
      </p>
    </div>`;

  // Clear pagination when empty
  const paginationContainer = $w('#menuPagination');
  if (paginationContainer) {
    paginationContainer.html = '';
  }
}

/**
 * Displays an error message with a retry button.
 *
 * @param {string} message - A user-friendly error description.
 */
function showErrorState(message) {
  const container = $w('#menuItems');
  if (!container) return;

  container.html = `
    <div class="menu-error">
      <h3 class="menu-error__title">Une erreur est survenue</h3>
      <p class="menu-error__message">${message}</p>
      <button class="menu-error__retry" id="retryBtn">R\u00E9essayer</button>
    </div>`;
}

// ---------------------------------------------------------------------------
// Core Workflow
// ---------------------------------------------------------------------------

/**
 * Main refresh function. Fetches data and re-renders all dynamic UI.
 * Manages loading state, error handling, and pagination.
 *
 * @returns {Promise<void>}
 */
async function refreshMenu() {
  showLoadingState();

  try {
    const { items, totalCount } = await fetchMenuItems();
    totalItems = totalCount;

    renderMenuItems(items);
    renderPagination();
  } catch (error) {
    console.error('[Menu Widget] Failed to fetch menu items:', error);
    showErrorState(
      'Impossible de charger le menu. Veuillez v\u00E9rifier votre connexion et r\u00E9essayer.'
    );
  }
}

// ---------------------------------------------------------------------------
// Event Handlers
// ---------------------------------------------------------------------------

/**
 * Handles a category tab click.
 *
 * @param {string} category - The selected category value (empty string for "all").
 */
function handleCategoryChange(category) {
  if (category === activeCategory) return;

  activeCategory = category;
  currentPage = 1;

  renderCategoryTabs();
  refreshMenu();

  // Fire custom event
  $widget.fireEvent('categoryChanged', {
    category: category || ALL_CATEGORIES_LABEL,
  });
}

/**
 * Handles a dietary filter toggle.
 *
 * @param {string} filterKey - The filter key to toggle (e.g. "vegetarian").
 */
function handleFilterToggle(filterKey) {
  if (activeFilters.has(filterKey)) {
    activeFilters.delete(filterKey);
  } else {
    activeFilters.add(filterKey);
  }

  currentPage = 1;

  renderFilterButtons();
  refreshMenu();

  // Fire custom event
  $widget.fireEvent('filterChanged', {
    activeFilters: Array.from(activeFilters),
  });
}

/**
 * Handles a menu item click.
 *
 * @param {string} itemId - The _id of the clicked menu item.
 */
function handleItemClick(itemId) {
  if (!itemId) return;

  $widget.fireEvent('itemClicked', { itemId });
}

/**
 * Handles a pagination page change.
 *
 * @param {string|number} page - The page identifier ("prev", "next", or a page number).
 */
function handlePageChange(page) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (page === 'prev') {
    if (currentPage > 1) currentPage -= 1;
  } else if (page === 'next') {
    if (currentPage < totalPages) currentPage += 1;
  } else {
    const pageNum = parseInt(page, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      currentPage = pageNum;
    }
  }

  refreshMenu();
}

/**
 * Sets up click delegation on the #menuTabs container for category switching.
 */
function bindCategoryTabEvents() {
  const container = $w('#menuTabs');
  if (!container) return;

  container.onClick((event) => {
    const target = event.target;
    if (target && target.dataset && typeof target.dataset.category !== 'undefined') {
      handleCategoryChange(target.dataset.category);
    }
  });
}

/**
 * Sets up click delegation on the #menuFilters container for filter toggling.
 */
function bindFilterEvents() {
  const container = $w('#menuFilters');
  if (!container) return;

  container.onClick((event) => {
    const target = event.target;
    const btn = target.closest ? target.closest('[data-filter]') : target;
    if (btn && btn.dataset && btn.dataset.filter) {
      handleFilterToggle(btn.dataset.filter);
    }
  });
}

/**
 * Sets up click delegation on the #menuItems container for item clicks.
 */
function bindItemClickEvents() {
  const container = $w('#menuItems');
  if (!container) return;

  container.onClick((event) => {
    const target = event.target;
    const item = target.closest ? target.closest('[data-item-id]') : target;
    if (item && item.dataset && item.dataset.itemId) {
      handleItemClick(item.dataset.itemId);
    }
  });
}

/**
 * Sets up click delegation on the #menuPagination container for page changes.
 */
function bindPaginationEvents() {
  const container = $w('#menuPagination');
  if (!container) return;

  container.onClick((event) => {
    const target = event.target;
    const btn = target.closest ? target.closest('[data-page]') : target;
    if (btn && btn.dataset && btn.dataset.page) {
      handlePageChange(btn.dataset.page);
    }
  });
}

// ---------------------------------------------------------------------------
// Settings Panel Integration
// ---------------------------------------------------------------------------

/**
 * Handles property changes from the Wix Blocks settings panel.
 * Updates internal state and re-renders as needed.
 *
 * @param {{ oldValues: object, newValues: object }} changeData - The changed property values.
 */
function handlePropsChanged(changeData) {
  const { newValues } = changeData;
  let needsRefresh = false;

  if (newValues.layout !== undefined && newValues.layout !== currentLayout) {
    currentLayout = newValues.layout;
    needsRefresh = true;
  }

  if (newValues.columns !== undefined && newValues.columns !== columns) {
    columns = Math.max(1, Math.min(4, newValues.columns));
    needsRefresh = true;
  }

  if (newValues.itemsPerPage !== undefined && newValues.itemsPerPage !== itemsPerPage) {
    itemsPerPage = newValues.itemsPerPage;
    currentPage = 1;
    needsRefresh = true;
  }

  if (newValues.showSpiceLevel !== undefined) {
    showSpiceLevel = newValues.showSpiceLevel;
    needsRefresh = true;
  }

  if (newValues.showAllergens !== undefined) {
    showAllergens = newValues.showAllergens;
    needsRefresh = true;
  }

  if (newValues.showDietaryBadges !== undefined) {
    showDietaryBadges = newValues.showDietaryBadges;
    needsRefresh = true;
  }

  if (newValues.showImages !== undefined) {
    showImages = newValues.showImages;
    needsRefresh = true;
  }

  if (newValues.currency !== undefined && newValues.currency !== currency) {
    currency = newValues.currency;
    priceFormatter = createPriceFormatter(currency);
    needsRefresh = true;
  }

  // Apply dynamic color overrides via CSS custom properties
  if (newValues.primaryColor) {
    applyColorOverride('--color-primary', newValues.primaryColor);
  }

  if (newValues.accentColor) {
    applyColorOverride('--color-accent', newValues.accentColor);
  }

  if (newValues.fontFamily) {
    applyFontOverride(newValues.fontFamily);
  }

  if (needsRefresh) {
    refreshMenu();
  }
}

/**
 * Applies a CSS custom property color override to the widget root.
 *
 * @param {string} property - The CSS custom property name (e.g. "--color-primary").
 * @param {string} value - The color value to set.
 */
function applyColorOverride(property, value) {
  const root = $w('#menuContainer');
  if (root && root.style) {
    root.style.setProperty(property, value);
  }
}

/**
 * Applies a font family override to the widget root.
 *
 * @param {string} fontFamily - The font family name to use.
 */
function applyFontOverride(fontFamily) {
  const root = $w('#menuContainer');
  if (root && root.style) {
    root.style.setProperty('--font-body', `'${fontFamily}', sans-serif`);
  }
}

// ---------------------------------------------------------------------------
// Responsive Behavior
// ---------------------------------------------------------------------------

/**
 * Adjusts the layout columns based on the current viewport width.
 * Called on initial load to ensure responsive defaults.
 */
function applyResponsiveDefaults() {
  try {
    const viewportWidth = $w('#menuContainer').getBoundingClientRect
      ? $w('#menuContainer').getBoundingClientRect().width
      : 980;

    if (viewportWidth <= 480) {
      columns = 1;
    } else if (viewportWidth <= 768) {
      columns = Math.min(columns, 2);
    }
  } catch (e) {
    // getBoundingClientRect may not be available in all Velo contexts; use defaults
  }
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Widget initialization. Called when the page is ready.
 * Sets up the UI, binds events, and performs the initial data fetch.
 */
$w.onReady(async function () {
  // Apply responsive column defaults
  applyResponsiveDefaults();

  // Render static UI elements
  renderCategoryTabs();
  renderFilterButtons();

  // Bind event delegation
  bindCategoryTabEvents();
  bindFilterEvents();
  bindItemClickEvents();
  bindPaginationEvents();

  // Listen for settings panel changes
  $widget.onPropsChanged(handlePropsChanged);

  // Initial data load
  await refreshMenu();
});
