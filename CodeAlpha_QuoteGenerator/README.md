# StillWords — CodeAlpha Task 2: Random Quote Generator

Developed by Samuel Ochoche Peter for the CodeAlpha internship. A minimal, offline React Native app using Expo SDK 57.

## Run on Windows
1. Extract the ZIP and open the CodeAlpha_QuoteGenerator folder in VS Code.
2. Run `npm.cmd install`.
3. Run `npx.cmd expo start --clear`.
4. On Android, scan the terminal QR code inside Expo Go for SDK 57. Your phone and computer should use the same Wi-Fi network.
5. Press `w` in the terminal to open the web version. Node.js 22.13 or newer is required.

This is a separate project from the Fitness Tracker and Language Learning apps. Its database is `stillwords.db`.

## Task requirements
- On launch, selects a random quote and excludes the last displayed quote saved by the previous session.
- On return from the background, selects another random quote.
- New Quote always selects a quote other than the currently displayed one.
- Quote text and author are clearly displayed on a calm, minimal screen.

## Additional features
- A subtle fade when requesting a new quote.
- Save/remove quotes in a local collection; no account required.
- Share quote text and author with the device sharing menu where supported.
- Read source links for external quotations.
- Samuel Ochoche Peter and CodeAlpha Internship Student footer credit.
- 20 bundled quotes/reflections; random selection requires no API key or internet.

A quote can reappear later, but not immediately after itself. Favorites and the last viewed quote persist on this installation. External sources need internet; sharing depends on platform support. Clearing app data may erase saved quotes.

## Quote collection
The collection includes three short quotations from classic literary works, one quote attributed to Burna Boy on the Africa Quotes page supplied by the user, and 16 original reflections written for this app. Originals are credited to StillWords, not to famous authors. The Burna Boy attribution is visibly labelled as attributed because its original statement was not independently verified. See SOURCES.md for reference URLs and the literary context.

## Verify
- `npm run typecheck`
- `npm test` (Node.js built-in SQLite integration checks)
- `npx expo export --platform android`
- `npx expo export --platform web`

## Demo checklist
Launch the app and show the author clearly. Tap New Quote several times and show each immediate change. Save a quote, open the collection, share it, and remove it. Close/reopen the app to demonstrate a fresh quote and saved data. Turn off the network and show that quote generation still works.

## Structure
- app/index.tsx: quote display, animation, app-open behavior, favorites, share, and credits.
- app/_layout.tsx: SQLite provider.
- src/quotes.ts: quote collection and no-repeat random selection.
- src/database.ts: favorite and last-quote storage.
- tests/quotes.cjs: behavioral and storage checks.

To add a quote, give it a stable unique ID, correct author, source label, and optional source URL. Preserve existing IDs so saved quotes stay valid. Check attribution and reuse rights before adding modern quotations or long excerpts.
