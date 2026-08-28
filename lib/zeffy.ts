import "server-only";

import { createZeffyClient, resolveZeffyApiKey } from "@/lib/zeffy-core";

export const zeffy = createZeffyClient({
  apiKey: resolveZeffyApiKey({
    ZEFFY_API: process.env.ZEFFY_API,
    ZEFFY_API_KEY: process.env.ZEFFY_API_KEY,
  }),
  campaignId: process.env.ZEFFY_CAMPAIGN_ID,
  currency: process.env.ZEFFY_EXPECTED_CURRENCY,
});
