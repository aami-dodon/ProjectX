module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  passWithNoTests: true,
  collectCoverage: false,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
