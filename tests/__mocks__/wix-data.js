const mockQuery = {
  eq: jest.fn().mockReturnThis(),
  ne: jest.fn().mockReturnThis(),
  ge: jest.fn().mockReturnThis(),
  le: jest.fn().mockReturnThis(),
  ascending: jest.fn().mockReturnThis(),
  descending: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  distinct: jest.fn().mockResolvedValue({ items: [] }),
  find: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
};

module.exports = {
  query: jest.fn(() => ({ ...mockQuery })),
  get: jest.fn().mockResolvedValue(null),
  insert: jest.fn((_col, data) => Promise.resolve({ _id: 'mock-id', ...data })),
  update: jest.fn((_col, data) => Promise.resolve(data)),
  remove: jest.fn().mockResolvedValue(undefined),
  save: jest.fn((_col, data) => Promise.resolve(data)),
};
