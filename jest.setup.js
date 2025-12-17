import '@testing-library/jest-dom'

// Mock crypto.randomUUID for tests
if (!global.crypto) {
  global.crypto = {}
}
if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = () => {
    return 'test-uuid-' + Math.random().toString(36).substring(7)
  }
}
