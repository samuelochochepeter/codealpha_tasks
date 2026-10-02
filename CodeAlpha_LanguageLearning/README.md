# Lingua Roots — CodeAlpha Language Learning App

An English-guided beginner app for Idoma, French, Spanish, and Mandarin Chinese built by Samuel Ochoche Peter for the CodeAlpha internship. React Native, Expo SDK 57, Expo Router, and local SQLite.

## Run on Windows
1. Extract the ZIP. Open the CodeAlpha_IdomaLearning folder in VS Code.
2. Run `npm.cmd install` in PowerShell.
3. Run `npx.cmd expo start --clear`.
4. Use Expo Go for SDK 57 on your Android phone, on the same Wi-Fi as your computer. Scan inside Expo Go.
5. Press `w` in the terminal for the web version. SQLite web support is configured in metro.config.js.

Node.js 22.13 or newer is required. This app has a different SQLite database and package identity from the Fitness Tracker.

## Features
- Registration returns to login; validation reports unknown email or wrong password.
- Passwords use random salts and scrypt hashes.
- A language chooser after first login; users can switch courses from any dashboard tab. Their last selection is remembered per account.
- Four starter lessons and 20 word cards per language: 16 lessons and 80 word cards in total.
- Mandarin uses simplified Chinese characters and tone-marked Pinyin; search also includes Pinyin.
- Separate course scores, bookmarks, mastery counts, history, and practice streaks. Existing Idoma IDs and practice history are preserved when upgrading.
- Flashcard reveal, bookmarking, previous/next controls.
- Five-question quizzes with shuffled options, mixed translation directions, feedback, and retry.
- Best score and attempt history stored per account. A perfect score masters a lesson.
- Searchable phrasebook and personal saved words.
- Practice streak counts consecutive dates with a completed quiz; yesterday's streak stays active until today is missed.
- Developer and CodeAlpha attribution on login and dashboard.
- External teacher video links for listening practice.

## Content and audio
The supplied YouTube video is linked as a resource: https://www.youtube.com/watch?v=oUxT8va0FYI . Its audio/transcript could not be retrieved during development, so the app does not claim its lesson content was transcribed from that video.

Initial Idoma vocabulary is adapted from Wikivoyage contributors, *Idoma phrasebook*, revision 5190968:
https://en.wikivoyage.org/w/index.php?title=Idoma_phrasebook&oldid=5190968

Vocabulary content is provided under CC BY-SA 4.0: https://creativecommons.org/licenses/by-sa/4.0/ . Source spellings retained; lessons, tips, and quizzes organised for this app. Source attribution appears in the app and SOURCES.md. The software code is provided under the MIT licence in LICENSE; the vocabulary content retains its separate licence.

**Community review pending:** Confirm the spellings, meanings, tones, and dialect usage with a fluent Idoma teacher before presenting the app as an authoritative course. The starter spelling does not provide a complete pronunciation guide. There is no generated Idoma voice, speech grading, or bundled native-speaker audio. Linked videos open in YouTube/browser and require internet. The app's text lessons work offline after installation.

French, Spanish, and Mandarin starter vocabulary references are listed in SOURCES.md and shown in the selected course’s profile.

To extend content, edit `src/content.ts`. Keep each word ID and lesson ID stable because bookmarks and results reference those IDs. Each lesson needs at least four distinct word/translation pairs for four-option quizzes. Review content with a speaker before adding it. Obtain permission before bundling recordings from teachers or videos.

## Demo checklist
Create an account, confirm the return to login, try an unknown email and a wrong password, then sign in. Choose a language. Open a lesson, flip cards, save a word, and finish a quiz. Switch language and confirm its progress is separate. Return to the first language and confirm its results are retained. Check quiz history and saved words. Log out and sign in again. Create a second user and confirm it starts with its own empty progress. Try the teacher video links while online.

## Local storage
Accounts, results, and saved words belong to this installation on this device. No cloud sync, email verification, or password recovery is included. Clearing app data may erase all local accounts. This is a portfolio prototype.

## Checks
`npm run typecheck` checks TypeScript. `npm test` runs integration checks for login, user separation, bookmarks, scores, streaks, and quiz options using Node.js built-in SQLite. `npx expo export --platform android` and `npx expo export --platform web` check platform bundles.

## Upgrade from Idoma Roots
Keep the existing app identity and database (`idomaroots.db`). This update changes the display name to Lingua Roots but retains the existing package identifiers. Replace the source files and restart Expo with `--clear`. Existing local Idoma accounts and word/lesson IDs are preserved; legacy practice dates are assigned to Idoma. The first login after upgrading asks you to choose a language.
