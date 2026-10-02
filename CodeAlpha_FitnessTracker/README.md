# PulseLog — CodeAlpha Fitness Tracker

A mobile fitness journal built for CodeAlpha's App Development Task 3. Create a local account, sign in to a personal dashboard, log activities, review daily and weekly progress, edit or delete entries, and set a weekly active-minutes goal. Data is stored locally in SQLite.

## Features
- Account creation returns to the login page with a success message. Sign in with the registered email and password to reach the personal dashboard. Unrecognized email and wrong password have separate, clear errors.
- Passwords are stored as salted scrypt hashes, not plaintext. No server account, cross-device sync, email verification, or password recovery is included. Keep your login details safe.
- Developer attribution to Samuel Ochoche Peter and CodeAlpha internship on the login screen and dashboard.
- Log activity type, date, minutes, manually entered steps and calories, and notes.
- Today's dashboard, Monday–Sunday activity chart, and weekly goal progress.
- Persistent activity history with edit and delete controls.
- Offline storage; no API keys or internet connection required after setup.
- Validation for invalid or future dates and extreme values.

## Run it
1. Install Node.js LTS and the Expo Go app on an Android phone (or use an emulator).
2. In this folder run `npm install`.
3. Run `npx expo start --clear`. On Android, open **Expo Go**, tap **Scan QR code** inside Expo Go, and scan the terminal QR code. A regular QR scanner may show only the `exp://` address. Phone and computer should be on the same Wi-Fi network.
4. For the browser, press `w` in the Expo terminal after starting. The Metro config includes SQLite WebAssembly support and local cross-origin headers.
5. In Windows PowerShell, use `npm.cmd install` and `npx.cmd expo start --clear` if `.ps1` scripts are blocked.
6. Run `npm run typecheck` to check TypeScript.

This project uses Expo SDK 57, matching Expo Go for SDK 57. Use Node.js 22.13 or newer. If you previously installed SDK 54 in this folder, replace the whole folder with the updated ZIP before running `npm.cmd install`.

## Suggested demo
Create an account and sign in, then log Walking with 30 minutes and 3,000 steps; add another entry for yesterday; show the weekly chart, edit an entry, change the goal, then log out and sign in again to demonstrate persistence. Try a wrong password and an unknown email to show the validation. Create a second account to show that its dashboard begins empty.

## Submission
Repository name: `CodeAlpha_FitnessTracker`. Record a short screen demo, post an explanation with the repository link on LinkedIn, then use CodeAlpha's official submission form. Do not claim that the app measures steps or calculates calories: both values are manually entered.

## Structure
- `app/index.tsx`: screens and interactive UI.
- `app/_layout.tsx`: SQLite provider and routing.
- `src/database.ts`: schema and database operations.
- `src/theme.ts`: design colours.

Created by Samuel Ochoche Peter for portfolio learning and CodeAlpha App Development internship.

## Local-account limitations
Accounts belong to this installation on this device only. A second phone will not see the same account. Removing app data or reinstalling the app may erase the accounts and activities. This is a portfolio prototype, not a production cloud authentication service. Previous entries from the pre-account prototype stay in its old local table and are not automatically assigned to a new account.
