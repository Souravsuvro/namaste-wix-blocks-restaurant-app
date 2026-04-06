// Brand colors
export const COLORS = {
  SAFFRON_ORANGE: '#E8731A',
  GIEN_INDIGO: '#1B3A6B',
  TANDOORI_RED: '#C23B22',
  LOIRE_GOLD: '#D4A843',
  CREAM_WHITE: '#FDF6EC',
  CHARCOAL: '#2D2926',
  WARM_SAND: '#F5EDE0',
  DEEP_NAVY: '#0F1F3D',
};

export const FONTS = {
  DISPLAY: 'Playfair Display',
  BODY: 'DM Sans',
  ACCENT: 'Cormorant Garamond',
};

export const CATEGORIES = ['Entrées', 'Plats Principaux', 'Tandoori & Grillades', 'Biryani & Riz', 'Desserts', 'Bar & Cocktails'];

export const DIETARY_FILTERS = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal'];

export const ALLERGENS = ['nuts', 'dairy', 'gluten', 'shellfish', 'eggs', 'soy', 'celery', 'mustard', 'sesame'];

export const ALLERGEN_LABELS = { nuts: '🥜 Nuts', dairy: '🥛 Dairy', gluten: '🌾 Gluten', shellfish: '🦐 Shellfish', eggs: '🥚 Eggs', soy: '🫘 Soy', celery: '🥬 Celery', mustard: '🟡 Mustard', sesame: '⚪ Sesame' };

export const ORDER_TYPES = { DELIVERY: 'delivery', PICKUP: 'pickup', DINE_IN: 'dine-in' };

export const ORDER_STATUSES = { NEW: 'new', CONFIRMED: 'confirmed', PREPARING: 'preparing', READY: 'ready', OUT_FOR_DELIVERY: 'out-for-delivery', DELIVERED: 'delivered', PICKED_UP: 'picked-up', CANCELLED: 'cancelled' };

export const RESERVATION_STATUSES = { PENDING: 'pending', CONFIRMED: 'confirmed', SEATED: 'seated', COMPLETED: 'completed', CANCELLED: 'cancelled', NO_SHOW: 'no-show', WAITLISTED: 'waitlisted' };

export const OCCASIONS = ['none', 'birthday', 'anniversary', 'business', 'date-night', 'celebration', 'other'];

export const OCCASION_LABELS = { none: 'No special occasion', birthday: '🎂 Birthday', anniversary: '💍 Anniversary', business: '💼 Business', 'date-night': '💑 Date Night', celebration: '🎉 Celebration', other: '✨ Other' };

export const RESTAURANT_INFO = {
  name: 'Namaste GIEN — Restaurant Indien',
  tagline: 'Where Spice Meets the Loire',
  address: '12 Quai de Nice, 45500 Gien, France',
  phone: '+33 2 38 XX XX XX',
  email: 'contact@namastegien.fr',
  coordinates: { lat: 47.6847, lng: 2.6286 },
};

export const OPERATING_HOURS = {
  closedDays: [1], // Monday = 1
  lunch: { start: '12:00', end: '14:30' },
  dinner: { start: '19:00', end: '22:30' },
};

export const DELIVERY_CONFIG = {
  maxRadiusKm: 10,
  baseFee: 2.50,
  feePerKm: 0.80,
  freeDeliveryThreshold: 40,
  estimatedTimePerKm: 3,
  basePreparationMinutes: 25,
};

export const PRICING = {
  currency: 'EUR',
  locale: 'fr-FR',
  serviceFeePercent: 5,
  taxPercent: 10,
  minimumOrder: 15,
};

export const COLLECTIONS = {
  MENU_ITEMS: 'menu-items',
  ORDERS: 'orders',
  RESERVATIONS: 'reservations',
};

export const SPICE_ICON = '🌶️';
export const MAX_SPICE_LEVEL = 5;
