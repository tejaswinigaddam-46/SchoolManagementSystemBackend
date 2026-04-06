module.exports = {
  testEnvironment: 'node',
  roots: ['../tests/backendtests'],
  testMatch: ['**/*.test.js'],
  verbose: true,
  clearMocks: true,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  moduleDirectories: ['node_modules', '<rootDir>/node_modules'],
};
