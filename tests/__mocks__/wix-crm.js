module.exports = {
  emailContact: jest.fn().mockResolvedValue(undefined),
  notifications: {
    notify: jest.fn().mockResolvedValue(undefined),
  },
};
