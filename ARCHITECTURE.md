# Life Pulse Architecture

## Product layers

1. **Acquisition**
   - Free Pulse Check modal
   - Instant Life Score reveal
   - Shareable result copy
   - No-signup promise

2. **Core daily loop**
   - Task creation
   - Life-area categorization
   - Priority weighting
   - Checkbox completion
   - Live Life Score + Balance Score
   - Streak and identity feedback

3. **Emotional intelligence**
   - Energised / Focused / Calm / Stuck modes
   - Mood-aware strategy
   - Stress-load signal
   - Overload protection
   - Recovery-oriented guidance

4. **Retention**
   - Daily challenge
   - Life Replay
   - Saved days
   - Tomorrow Preview
   - Celebration feedback

5. **Monetization**
   - Premium
   - Lifetime
   - Elite
   - Dodo checkout
   - Dodo verification endpoint
   - Dodo webhook endpoint

6. **SEO / distribution**
   - Semantic page metadata
   - Open Graph / social cards
   - Twitter metadata
   - WebApplication JSON-LD
   - robots.txt
   - sitemap.xml
   - Web manifest

## Source organization

- `src/main.jsx` — application logic and UI composition. Major product layers are marked with section comments.
- `src/styles.css` — original Life Pulse visual system plus the newer emotional/premium layer.
- `functions/api/dodo/checkout.js` — creates Dodo checkout sessions.
- `functions/api/dodo/verify.js` — verifies a successful return and unlocks premium locally.
- `functions/api/dodo/webhook.js` — verifies Dodo webhook signatures.
- `public/` — crawl/discovery assets.

## Design preservation

The current stylesheet preserves the original Life Pulse UI as the base system. The newer CSS is layered underneath the original classes so the existing glassmorphism, neon accents, rings, cards, tabs, pricing cards and responsive layout remain visually consistent.
