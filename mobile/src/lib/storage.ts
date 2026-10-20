import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "auth_token";

// SecureStore (Keychain / Keystore) n'existe pas sur le web : Expo web, utilisé
// seulement pour le développement, se rabat sur localStorage
const isWeb = Platform.OS === "web";

export async function getToken(): Promise<string | null> {
    if (isWeb) return globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;
    return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
    if (isWeb) {
        globalThis.localStorage?.setItem(TOKEN_KEY, token);
        return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function deleteToken(): Promise<void> {
    if (isWeb) {
        globalThis.localStorage?.removeItem(TOKEN_KEY);
        return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
}
