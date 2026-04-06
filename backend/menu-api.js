/**
 * Menu CRUD backend API — Velo Web Module.
 * @module menu-api
 */
import wixData from 'wix-data';
import { sanitizeString } from './utils/validation';

const COLLECTION = 'menu-items';

/**
 * Retrieves all available menu items, optionally filtered by category.
 * @param {string} [category] - Filter by category
 * @param {Object} [filters] - Dietary filters
 * @param {boolean} [filters.isVegetarian]
 * @param {boolean} [filters.isVegan]
 * @param {boolean} [filters.isGlutenFree]
 * @param {boolean} [filters.isHalal]
 * @returns {Promise<Array>} List of menu items
 */
export async function getMenuItems(category, filters = {}) {
  let query = wixData.query(COLLECTION)
    .eq('isAvailable', true)
    .ascending('sortOrder')
    .ascending('name');

  if (category) {
    query = query.eq('category', category);
  }

  if (filters.isVegetarian) query = query.eq('isVegetarian', true);
  if (filters.isVegan) query = query.eq('isVegan', true);
  if (filters.isGlutenFree) query = query.eq('isGlutenFree', true);
  if (filters.isHalal) query = query.eq('isHalal', true);

  const result = await query.find();
  return result.items;
}

/**
 * Retrieves a single menu item by ID.
 * @param {string} itemId
 * @returns {Promise<Object>}
 */
export async function getMenuItem(itemId) {
  const item = await wixData.get(COLLECTION, itemId);
  if (!item) {
    throw new Error('Menu item not found.');
  }
  return item;
}

/**
 * Creates a new menu item. Requires admin context.
 * @param {Object} itemData
 * @returns {Promise<Object>} Created item
 */
export async function createMenuItem(itemData) {
  const sanitized = {
    name: sanitizeString(itemData.name),
    description: sanitizeString(itemData.description || ''),
    price: Number(itemData.price),
    category: itemData.category,
    image: itemData.image || '',
    spiceLevel: Math.min(5, Math.max(0, Number(itemData.spiceLevel) || 0)),
    allergens: Array.isArray(itemData.allergens) ? itemData.allergens : [],
    isVegetarian: Boolean(itemData.isVegetarian),
    isVegan: Boolean(itemData.isVegan),
    isGlutenFree: Boolean(itemData.isGlutenFree),
    isHalal: Boolean(itemData.isHalal),
    isAvailable: itemData.isAvailable !== false,
    sortOrder: Number(itemData.sortOrder) || 0,
    nameFr: sanitizeString(itemData.nameFr || ''),
    descriptionFr: sanitizeString(itemData.descriptionFr || ''),
  };

  if (!sanitized.name || sanitized.price < 0) {
    throw new Error('Item name and valid price are required.');
  }

  return wixData.insert(COLLECTION, sanitized);
}

/**
 * Updates an existing menu item. Requires admin context.
 * @param {string} itemId
 * @param {Object} updates
 * @returns {Promise<Object>} Updated item
 */
export async function updateMenuItem(itemId, updates) {
  const existing = await wixData.get(COLLECTION, itemId);
  if (!existing) {
    throw new Error('Menu item not found.');
  }

  const merged = { ...existing };
  if (updates.name !== undefined) merged.name = sanitizeString(updates.name);
  if (updates.description !== undefined) merged.description = sanitizeString(updates.description);
  if (updates.price !== undefined) merged.price = Number(updates.price);
  if (updates.category !== undefined) merged.category = updates.category;
  if (updates.image !== undefined) merged.image = updates.image;
  if (updates.spiceLevel !== undefined) merged.spiceLevel = Math.min(5, Math.max(0, Number(updates.spiceLevel)));
  if (updates.allergens !== undefined) merged.allergens = updates.allergens;
  if (updates.isVegetarian !== undefined) merged.isVegetarian = Boolean(updates.isVegetarian);
  if (updates.isVegan !== undefined) merged.isVegan = Boolean(updates.isVegan);
  if (updates.isGlutenFree !== undefined) merged.isGlutenFree = Boolean(updates.isGlutenFree);
  if (updates.isHalal !== undefined) merged.isHalal = Boolean(updates.isHalal);
  if (updates.isAvailable !== undefined) merged.isAvailable = Boolean(updates.isAvailable);
  if (updates.sortOrder !== undefined) merged.sortOrder = Number(updates.sortOrder);

  return wixData.update(COLLECTION, merged);
}

/**
 * Deletes a menu item. Requires admin context.
 * @param {string} itemId
 * @returns {Promise<void>}
 */
export async function deleteMenuItem(itemId) {
  await wixData.remove(COLLECTION, itemId);
}

/**
 * Retrieves all distinct categories from the menu.
 * @returns {Promise<string[]>}
 */
export async function getCategories() {
  const result = await wixData.query(COLLECTION)
    .eq('isAvailable', true)
    .distinct('category');
  return result.items;
}

/**
 * Toggles item availability.
 * @param {string} itemId
 * @param {boolean} isAvailable
 * @returns {Promise<Object>}
 */
export async function setItemAvailability(itemId, isAvailable) {
  return updateMenuItem(itemId, { isAvailable });
}

/**
 * Bulk updates sort order for menu items.
 * @param {Array<{ id: string, sortOrder: number }>} items
 * @returns {Promise<void>}
 */
export async function updateSortOrder(items) {
  const updates = items.map(({ id, sortOrder }) =>
    wixData.update(COLLECTION, { _id: id, sortOrder })
  );
  await Promise.all(updates);
}
