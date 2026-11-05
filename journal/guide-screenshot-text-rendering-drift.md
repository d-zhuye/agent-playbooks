# Tiny text-rendering differences intermittently fail unchanged guide screenshots

- Seen: 2026-11-05, while-we-wait, Trivia and subsequent amusement-park guide integrations.
- What happened: full Playwright visual runs occasionally flagged Get to Know You's unchanged final guide card on the iPhone SE or iPhone 15. Visible diff marks were confined to a few letter edges; layout and wording matched. The suite allows ten changed pixels, so small text-rendering variations can still fail an otherwise clean run and require another several-minute full check.
- Evidence: the iPhone 15 occurrence had 2,277 raw RGB differences across the page, mostly below the screenshot comparator's significance threshold; its displayed diff highlighted only a few letters. The app changes concerned other games. Root cause is not confirmed; do not assume a layout regression or solve it by blindly approving the screenshot.
- Tried: inspected actual, expected and diff screenshots, then reran the affected screen without changing code or its baseline → cleared an earlier SE occurrence. A subsequent full run also passed. The issue later recurred on the iPhone 15.
- Tried: repeated the full suite after the next text-only occurrence → verification in progress when this entry was recorded.
- Status: open.
