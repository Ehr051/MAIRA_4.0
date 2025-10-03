// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/test-maira-*.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/Client/$1'
  },
  testTimeout: 10000,
  verbose: true,
  collectCoverageFrom: [
    'Client/js/modules/juego/*.js',
    '!Client/js/modules/juego/*test*.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']
};