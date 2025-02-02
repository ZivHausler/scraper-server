/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest/presets/default-esm", // 👈 Ensure Jest supports ES modules
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { useESM: true }], // 👈 Enable ESM for Jest
  },
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1", // 👈 Fix imports with .js extensions
  },
  testEnvironment: "node",
};
