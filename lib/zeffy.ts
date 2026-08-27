import "server-only";

import { createZeffyClient } from "@/lib/zeffy-core";

export const zeffy = createZeffyClient({
  apiKey: process.env.ZEFFY_API_KEY,
  campaignId: process.env.ZEFFY_CAMPAIGN_ID,
  currency: process.env.ZEFFY_EXPECTED_CURRENCY,
});
