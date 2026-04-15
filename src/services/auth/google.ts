import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

const FALLBACK_CLIENT_ID = "missing-client-id.apps.googleusercontent.com";

export function isGoogleAuthConfigured() {
  return Boolean(GOOGLE_CLIENT_ID || WEB_CLIENT_ID || IOS_CLIENT_ID || ANDROID_CLIENT_ID);
}

export function useGoogleRequest() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId:
      GOOGLE_CLIENT_ID ||
      WEB_CLIENT_ID ||
      IOS_CLIENT_ID ||
      ANDROID_CLIENT_ID ||
      FALLBACK_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
    scopes: ["profile", "email"],
  });

  return { request, response, promptAsync, isConfigured: isGoogleAuthConfigured() };
}
