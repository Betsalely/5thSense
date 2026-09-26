import * as SecureStore from "expo-secure-store";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const TOKEN_KEY = "access_token";
const SESSION_TIMESTAMP_KEY = "session_timestamp";
const USER_ROLE_KEY = "user_role";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

let token: string | null = null;

export async function loadToken(): Promise<string | null> {
    token = await SecureStore.getItemAsync(TOKEN_KEY);
    return token;
}

export async function setToken(
    newToken: string | null
): Promise<void> {
    token = newToken;

    if (newToken) {
        await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
}

export function getToken(): string | null {
    return token;
}

export async function saveSession(newToken: string, role: string): Promise<void> {
    token = newToken;
    const now = Date.now().toString();
    await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, newToken),
        SecureStore.setItemAsync(SESSION_TIMESTAMP_KEY, now),
        SecureStore.setItemAsync(USER_ROLE_KEY, role),
    ]);
}

export async function getValidSession(): Promise<{ token: string; role: string } | null> {
    const [storedToken, storedTimestamp, storedRole] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(SESSION_TIMESTAMP_KEY),
        SecureStore.getItemAsync(USER_ROLE_KEY),
    ]);

    if (!storedToken || !storedTimestamp || !storedRole) {
        return null;
    }

    const sessionAge = Date.now() - parseInt(storedTimestamp, 10);
    if (sessionAge > SEVEN_DAYS_MS) {
        await clearToken();
        return null;
    }

    token = storedToken;
    return { token: storedToken, role: storedRole };
}

export async function clearToken(): Promise<void> {
    token = null;
    const deleteSafe = async (key: string) => {
        try {
            await SecureStore.deleteItemAsync(key);
        } catch {
        }
    };
    await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEY),
        SecureStore.deleteItemAsync(SESSION_TIMESTAMP_KEY),
        SecureStore.deleteItemAsync(USER_ROLE_KEY),
    ]);
}

export async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    if (!API_BASE_URL) {
        throw new Error("EXPO_PUBLIC_API_BASE_URL is not defined");
    }

    const endpointUri = `${API_BASE_URL}${endpoint}`;

    if (!token) {
        token = await SecureStore.getItemAsync(TOKEN_KEY);
    }

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string> | undefined),
    };

    if (token) {
        headers["Authorization"] = `Token ${token}`;
    }

    console.log("REQUEST:", {
        url: endpointUri,
        method: options.method ?? "GET",
        headers,
        body: options.body,
    });

    const res = await fetch(endpointUri, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const errorBody = await res.text();

        console.error("API ERROR:", {
            status: res.status,
            url: endpointUri,
            body: errorBody,
        });

        throw new Error(
            `API request failed: ${res.status} ${errorBody}`
        );
    }

    if (res.status === 204) {
        return undefined as T;
    }

    const text = await res.text();
    if (!text) {
        return undefined as T;
    }

    return JSON.parse(text) as T;

}