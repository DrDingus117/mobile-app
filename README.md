# Walk Tracker

A mobile walking tracker built with Expo (SDK 57), `expo-location` and `expo-task-manager`. It shows your current coordinates, records your location during a walk (including while the app is minimized), and saves the records on the device.

## Features
- Get the current latitude and longitude
- Start, pause, resume and stop a walk
- Background tracking through an `expo-task-manager` task and an Android foreground service
- Saved location records (latitude, longitude, date and time) that persist after the app is closed, stored in SQLite
- Privacy notice shown on the tracking screen
- Clear message when location permission is denied

## Privacy
- The app collects latitude, longitude, date and time.
- Location is collected only while a walk is being tracked.
- Records are stored locally on the device and are never uploaded.
- Tracking can be paused or stopped at any time. Stopping ends all foreground and background updates.

## Setup
Background location does **not** work in Expo Go, so a development build is required.

Requirements: Node.js, Android Studio with the Android SDK, `ANDROID_HOME` set, and an Android phone with USB debugging on (or an emulator).

```
npm install
npx expo prebuild --platform android
npx expo run:android
```

The first build takes several minutes. After it installs, open the **Walk** tab.

### Running on web
`npx expo start --web` runs the app in a browser. On web, only **Get Location** works, because browsers don't support background tracking.

## Testing checklist
Tested on a Samsung Galaxy S23 FE (Android) with a development build.

| # | Scenario | How to test | Result |
|---|----------|-------------|--------|
| 1 | Permission approved | Tap Get Location and allow | Pass: coordinates shown |
| 2 | Permission denied | Set Location to "Don't allow" in settings, tap Get Location | Pass: "Location access is required..." message shown |
| 3 | App open and tracking | Tap Start Walk, walk around | Pass: status TRACKING, records added |
| 4 | App minimized | Start a walk, press Home for a few minutes, reopen | Pass: records added while minimized |
| 5 | Pause and resume | Tap Pause, then Resume | Pass: no records while paused, recording continues on resume |
| 6 | Stopped | Tap Stop Walk | Pass: status IDLE, background updates stop |
| 7 | Closed and reopened | Swipe the app away and reopen | Pass: saved records still listed |

Screenshots are in the `Scrrenshots for assignment` folder.

## Tech
Expo SDK 57, Expo Router, `expo-location`, `expo-task-manager`, `expo-sqlite`.

`metro.config.js` stops the web build from loading `expo-sqlite`, which needs extra setup on web. Tracking and saved records are phone-only.

I was in a bit of a rush getting this done. That's why It'll most likely be late.