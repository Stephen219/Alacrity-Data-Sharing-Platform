// jest.setup.ts
import '@testing-library/jest-dom'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: ''
    }
  },
  usePathname() {
    return ''
  },
  useSearchParams() {
    return new URLSearchParams()
  }
}))

// Add custom matchers
expect.extend({
  toBeInTheDocument: (received) => {
    const pass = received !== null
    return {
      message: () => `expected ${received} to be in the document`,
      pass
    }
  }
})