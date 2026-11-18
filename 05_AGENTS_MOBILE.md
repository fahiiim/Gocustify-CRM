# AGENTS.md — madbel-mobile (`madbel-mobile/AGENTS.md`)

React Native, Expo (bare workflow — there is a checked-in `android/` native project, not pure managed Expo; `expo run:android` / `expo run:ios` build native projects directly).

## Directory structure

```
src/
  components/
  context/
  formWrapper/
  hooks/
  i18n/
  redux/
    store.js
    baseApi.js, baseQueryWithReauth.js   # RTK Query base + auth-refresh wrapper
    slices/
      madbelApiSlice.js                 # RTK Query codegen-style API slice (the pattern every new endpoint follows)
      madbelAuthApiSlice.js
      madbelSmartflowSlice.js
      madbelInvoiceUtilitySlice.js
      madbelCompatibilitySlice.js
      madbelAppContentSlice.js
      authSlice.js
      chat/, event/, search/
    reducers/authReducer.js
    middleware/errorMiddleware.js
  root/
  screens/                              # one folder per feature: auth/, home/, chat/, call/, invoice/, lease/, agreement/, signing/, community/, profile/
  stack/                                 # React Navigation stacks: AuthStack, BottomTabNavigator, ChatStack, HomeStack, MicStack, MyEarningsStack, CommunityStack, ProfileStack
  voice/                                 # Telnyx WebRTC calling module
    VoiceProvider.js / VoiceProvider.web.js   # platform split — native vs web Telnyx SDK usage
    VoiceContext.js, VoiceController.cjs, voiceApi.js, VoiceStatus.js, DeviceCallScreen.js
  utils/
android/                                 # native Android project (bare workflow)
tests/
docs/
```

## Navigation

React Navigation (`@react-navigation/native`, `native-stack`, `bottom-tabs`). Top-level stacks in `src/stack/`; `BottomTabNavigator.js` is the authenticated app's tab bar, each tab delegating to its own stack (ChatStack, HomeStack, MicStack, MyEarningsStack, CommunityStack, ProfileStack).

## State management

Redux Toolkit + RTK Query. `src/redux/store.js` wires everything; `redux-persist` persists auth state. New backend features get a new RTK Query slice following the `madbel*Slice.js` naming/shape pattern already in `src/redux/slices/`, not a hand-rolled fetch call in a component.

## Voice/calling module

Uses `@telnyx/react-native-voice-sdk` (native) and `@telnyx/react-voice-commons-sdk` (web), plus `react-native-webrtc`. `VoiceProvider.js` vs `VoiceProvider.web.js` is a platform-specific split (Metro/Expo resolves `.web.js` automatically on web builds) — edit both if changing shared voice behavior, only the native one for native-only behavior.

## Build/run

```
npm run start       # expo start
npm run android     # expo run:android (builds the native android/ project)
npm run ios
npm run web
npm run test:voice  # node --test tests/*.test.cjs
```

## Key dependencies worth knowing

`expo-speech` / `expo-speech-recognition` (voice features), `expo-calendar`/`expo-contacts` (device integration), `@react-native-google-signin/google-signin`, `nativewind` + `tailwindcss` (styling), `expo-secure-store` (token storage — not AsyncStorage, for anything sensitive).
