# Firebase Setup for Android Push Notifications

To enable high-priority background push notifications (earthquake alerts), you must add your Firebase `google-services.json` to this directory.

## Steps

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click the gear icon → **Project settings**
4. Under **Your apps**, select or add your Android app with package name: `com.earthquakeapp.earlywarning`
5. Download the `google-services.json` file
6. Place it in this directory: `android/app/google-services.json`
7. Run `npx cap sync` from the `artifacts/earthquake-app` directory

## Notes

- The `build.gradle` is already configured to apply the Google Services plugin automatically when `google-services.json` is present.
- The `com.google.gms:google-services:4.4.4` classpath is already set up in the root `build.gradle`.
- FCM high-priority messages will work in the background once this file is in place.
- Make sure your Firebase project has **Cloud Messaging** enabled and the server key is configured in the API server environment variables.
