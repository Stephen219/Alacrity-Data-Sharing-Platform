



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
  transformIgnorePatterns: [
    "/node_modules/(?!lucide-react)" // Force Jest to transform lucide-react
  ],
 
  

  // Enable coverage collection
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],




  // Collect coverage from src folder
  // please add any file you wish to be excluded here   start with !



  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/config.ts',
    '!src/index.tsx',

    '!src/setupTests.ts',
    '!src/page.tsx',
    '!src/**/types/**/*'
  ],
  
  coveragePathIgnorePatterns: [
    "\\\\node_modules\\\\"
  ],


  coverageThreshold: {
    global: {
      branches: 35,
      functions: 25,
      lines: 30,
      statements: 30
    }
  },

  clearMocks: true,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/']
}

export default createJestConfig(config)
