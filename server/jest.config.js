module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testRegex: ['(/tests/.*|(\\.|/)(test))\\.js$'],
  passWithNoTests: true,
  collectCoverage: false,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  clearMocks: true,
};
