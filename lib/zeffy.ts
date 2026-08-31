import "server-only";

import { createZeffyClient, resolveZeffyApiKey } from "@/lib/zeffy-core";

export const zeffy = createZeffyClient({
  apiKey: resolveZeffyApiKey({
    ZEFFY_API: process.env.ZEFFY_API,
    ZEFFY_API_KEY: process.env.ZEFFY_API_KEY,
  }),
  campaignId: "c1f40aba-bcb9-4da8-9f6e-2cc57ad71e3a",
  currency: "USD",
});
