// See all available options at https://jestjs.io/docs/configuration

module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/',
    'coverage',
    '/test/resources/',
    '/dist/'
  ],
  testEnvironment: 'node',
  moduleDirectories: ['node_modules', 'src'],
  verbose: true
}
