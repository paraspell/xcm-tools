import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    bail: 0,
    projects: [
      {
        test: {
          name: "xcm",
          include: ["e2e/xcm.test.ts"],
          testTimeout: 30000,
          hookTimeout: 30000,
          maxWorkers: 1,
        },
      },
      {
        test: {
          name: "swap",
          include: ["e2e/swap.test.ts"],
          testTimeout: 120000,
          hookTimeout: 120000,
          maxWorkers: 1,
        },
      },
    ],
  },
});
