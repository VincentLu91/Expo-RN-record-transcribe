# Expo App to record, transcribe, save, and summarize spoken words

YouTube: https://youtu.be/n5TJhp8XACM

Keys, tokens, and API endpoints are removed from the codebase to prevent from being exposed. Also the endpoints rely on rented cloud GPU to be called and I turned them off to avoid overspending.

To install, run yarn or npm i. Then, run `expo install` on the following libraries:
expo
expo-av
expo-splash-screen
expo-status-bar
react-native-safe-area-context

This Expo projects runs on android native code. To start, make sure the Android Emulator is ready (or Android device is connected to the computer) and run
`expo run:android`
Upon output complaints about missing SDK path, add android/local.properties with
`sdk.dir=<path where you installed Android sdk>`

For example, for Mac users:
`sdk.dir=/Users/<username>/Library/Android/sdk`

Run `expo run:android` again. This time, the application will be properly loaded on the Expo Go client on your Android device or Android emulator.

This is the Expo version of the project. The React.js version of the project is found in https://github.com/VincentLu91/react-record-transcribe
