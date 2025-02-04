



import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({
  dir: './',
})

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: './tsconfig.json'
    }]
  },
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)"
  ],

  // Enable coverage collection
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],




  // Collect coverage from src folder



  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/config.ts',

    '!src/setupTests.ts',
    '!src/page.tsx',
    '!src/**/types/**/*'
  ],
  

  // Ignore node_modules from coverage
  coveragePathIgnorePatterns: [
    "\\\\node_modules\\\\"
  ],


  coverageThreshold: {
    global: {
      branches: 18,
      functions: 16,
      lines: 14,
      statements: 1.34
    }
  },

  clearMocks: true,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/']
}

export default createJestConfig(config)
