import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: "postgresql://mock:mock@localhost:5432/mock",
    },
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
