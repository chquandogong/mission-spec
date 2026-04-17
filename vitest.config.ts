import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    include: ["tests/**/*.test.ts"],
    // C-1 (PROJECT_REVIEW_SNAPSHOT_V1.16.7 Rev.4 Codex §1): the E-7 pattern
    // (describe.concurrent + Node subprocess per test) means 14 parallel
    // `node scripts/...` processes each paying the TypeScript compiler cold-
    // start cost. Under CPU contention some individual tests exceed the
    // vitest 5000ms default, producing order-dependent flakiness (observed
    // 7/1/0 failures across 3 consecutive `npm test` runs pre-v1.16.8).
    // 15000ms is the empirically verified threshold at which 3+ consecutive
    // runs stay green. hookTimeout covers beforeEach tempDir setup that
    // shares the same CPU budget. If release-grade determinism needs tighter
    // bounds later, prefer reducing concurrency over trimming these.
    testTimeout: 15000,
    hookTimeout: 15000,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.d.ts",
        "src/schema/*.schema.json",
        "**/node_modules/**",
        "dist/**",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
