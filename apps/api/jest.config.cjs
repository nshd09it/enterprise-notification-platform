
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Jest uses "roots", not "root".
  roots: ['<rootDir>/src'],

  testMatch: ['**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],

  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'CommonJS',
          moduleResolution: 'Node',
          target: 'ES2022',
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          esModuleInterop: true,
          strict: true,
          isolatedModules: true
        }
      }
    ]
  },

  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },

  clearMocks: true,
  coverageDirectory: 'coverage',

  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/main.ts'
  ]
};
