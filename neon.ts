import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  auth: true,
  preview: {
    buckets: {
      "zordr-dev": { access: "public_read" },
    },
  },
});
