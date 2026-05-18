# 📱 Prakriti App - Android Build & Install Guide

A quick reference guide for compiling and installing the standalone Android production APK locally on your machine.

---

## 🛠️ Prerequisites
Ensure you have the following installed on your machine:
* **EAS CLI**: `npm install -g eas-cli` (or run via `npx eas-cli`)
* **Java JDK**: Version 21 (recommended for Expo SDK 54)
* **Android SDK**: `adb` configured in your PATH

---

## 🏗️ 1. Build the APK locally

Run the following command to trigger a local production build. EAS will automatically handle `npx expo prebuild` and use Gradle to compile the app.

### Recommended Command (Clearest Output)
This command suppresses the harmless Expo Go development warning:
```bash
EAS_BUILD_NO_EXPO_GO_WARNING=true eas build --platform android --profile production --local
```

### Standard Command
```bash
eas build --platform android --profile production --local
```

*Note: During your first build, EAS will ask: **"Generate a new Android Keystore?"** Select **Yes** so Expo can automatically generate and manage your app's digital signature.*

---

## 📲 2. Install the APK on a Device/Emulator

Once the build successfully completes, it will generate a file named `build-[timestamp].apk` in your project root directory.

Run the following command in your terminal to stream and install the build directly onto your connected physical device or emulator:

```bash
adb install build-*.apk
```

### Alternative Installation Methods
* **Drag and Drop**: Locate the `.apk` file in Finder and drag it onto an active Android Emulator screen.
* **Direct Transfer**: Send the `.apk` file to your physical Android device via Google Drive, AirDroid, or any chat application, then open it to install.
