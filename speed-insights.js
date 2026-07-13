// Vercel Speed Insights initialization
// This script loads and initializes Vercel Speed Insights for the portfolio

import { injectSpeedInsights } from './node_modules/@vercel/speed-insights/dist/index.mjs';

// Initialize Speed Insights
injectSpeedInsights({
  debug: false
});
