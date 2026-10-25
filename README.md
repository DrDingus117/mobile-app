# Mobile Walking Tracker

An Expo React Native app that tracks a walk and uses local notifications to keep the user on track.

- Reminds the user when a walk has been paused and left paused.
- Congratulates the user when the 60-second walking goal is reached, even if the app is minimized.

The only way I could run this confounded App on Android was to install a development build on my S23 FE. Should work fine on Iphone though

Don't mind the two start buttons, I messed with the one in the app folder. I'll remove one later

## Features

- Notification permission request on startup, with an on-screen status message
- Walk controls: Start, Pause, Resume, Stop
- Pause reminder: a "Walk Paused" notification is scheduled 10 seconds after pausing
- The reminder is canceled if the walk is resumed or stopped
- Walking goal of 60 seconds, with progress shown on screen
- One "Goal Reached" notification per walking session

## Installing the project

Requirements: Node.js and a physical phone.

```bash
npm install
```

## Starting the Expo development server

```bash
npx expo start
```

## Running the app on a phone

### iPhone (Expo Go)

1. Install **Expo Go** from the App Store. It must support Expo SDK 57.
2. Start the server so it targets Expo Go:
   ```bash
   npx expo start --go
   ```
   (Or run `npx expo start` and press `s` to switch to Expo Go.)
3. Scan the QR code with the Camera app.
4. Allow notifications when prompted.

### Android (development build)

Expo Go on Android does not currently work with this project (see
[Problems encountered](#problems-encountered)), so Android uses a development build.

1. Build and install the development app (one time):
   ```bash
   npx eas-cli login
   npx eas-cli build --profile development --platform android
   ```
   Open the link or QR code from the finished build on the phone and install the app.
2. Start the server for the development build:
   ```bash
   npx expo start --dev-client
   ```
3. Open the installed app on the phone and connect to the server.
4. Allow notifications when prompted.

## How to use the app

(Button on the top does nothing REMOVE)

| Button | What it does |
| --- | --- |
| Start | Starts a new walk. Progress resets to 0 and the goal notification can fire again. |
| Pause | Stops the timer and schedules the "Walk Paused" reminder for 10 seconds later. |
| Resume | Continues the same walk and cancels the pause reminder. |
| Stop | Ends the walk and cancels the pause reminder. |

Status messages shown on screen:

- Notifications are enabled.
- Notifications are disabled. Reminders will not appear.
- Pause reminder scheduled.
- Pause reminder canceled.
- Walking goal reached!

## Notification tests

Tested on a physical Android phone (development build). Items marked `[x]` were
completed. Update the remaining items as they are tested.

- [x] Approve notification permission and confirm the status message changes
- [ ] Deny notification permission and confirm the app explains that reminders are disabled
- [x] Pause a walk and wait for the reminder to appear
- [x] Pause, then resume before the reminder appears. The reminder does not appear after resuming
- [ ] Pause, then stop before the reminder appears. The reminder does not appear after stopping
- [x] Complete the 60-second walking goal and confirm the goal notification appears
- [ ] Confirm the goal notification appears only once during the walking session
- [x] Minimize the app and confirm a notification can still appear

## Problems encountered

**1. Expo Go crashes on Android when `expo-notifications` is imported.**
Opening the app in Expo Go on Android showed the error
`Cannot find native module 'ExpoTopicSubscriptionModule'`. This is a compatibility
issue between the `expo-notifications` package on Expo SDK 57 and the Android version
of Expo Go. It appears to be fixed in SDK 58, but the Expo Go app in the store
supports SDK 57 for now. *Solution:* a development build on Android
(`npx expo start --dev-client`). iPhone with Expo Go is not affected.

**2. "Cannot find native module 'ExpoDevice'" on the first development build.**
The first build was made before all the native packages were installed, and native
modules only exist in the app if they were present when it was built. *Solution:*
install the packages, rebuild, and reinstall the development app.

**3. Notifications did not appear.**
Notification permission had not been allowed on the phone. *Solution:* allow
notifications in the phone's app settings, then reopen the app.

**4. Walk controls were off screen.**
`flex: 1` on the layout containers in `walk.tsx` and `permissions-button.tsx` made
them fill the screen and pushed the new controls out of view. *Solution:* removed
`flex: 1` from those containers.

**5. Pause reminder appeared after resuming.**
Resuming or stopping quickly after pausing could cancel before the reminder's ID was
saved. *Solution:* the app now tracks whether the walk is still paused after
scheduling finishes and cancels the reminder if it is not. It also cancels all
scheduled notifications as a backup.

Screenshots are in the Screenshots for assignment folder