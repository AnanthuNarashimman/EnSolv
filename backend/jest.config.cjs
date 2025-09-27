module.exports = {
  testEnvironment: "node",
  transform: {},
  verbose: true,
  testMatch: [
    "**/tests/**/*.test.js"
  ],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/tests/**"
  ]
};