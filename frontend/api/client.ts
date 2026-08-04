const API_BASE_URL = process.env.API_BASE_URL;
let token: string | null = null;

if (!API_BASE_URL) {
    throw new Error("API Base URL is not defined");
}

// API Request Handler

// export function parseCookieValue(
//     setCookieHeader: string | null,
//     key: string
// ): string | null {
//     if (!setCookieHeader) return null;

//     const match = setCookieHeader.match(
//         new RegExp(`${key}=([^;]+)`)
//     );

//     return match ? decodeURIComponent(match[1]) : null;
// }

// export async function bypassCSRF(): Promise<string> {
//     const endpoint_uri = `${API_BASE_URL}/404_CSRF_BYPASS`;
    
//     const res = await fetch(endpoint_uri, {
//         headers: {
//             "Content-Type": "application/json"
//         }
//     });

//     if (res.status != 404) {
//         throw new Error(`WARNING: API must return 404 status: ${res.status}`);
//     }

//     const setCookie = res.headers.get("set-cookie");
//     const csrf_token = parseCookieValue(setCookie, "csrftoken") as string;

//     if (csrf_token == null) {
//         throw new Error(`CSRF token not found.`);
//     }

//     return csrf_token
// }

export function setToken(newToken: string | null): void {
    token = newToken;
}

export function getToken(): string | null {
    return token;
}

export function clearToken(): void {
    token = null;
}

export async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const endpoint_uri = `${API_BASE_URL}${endpoint}`;
    // const csrf_token = await bypassCSRF();

    const res = await fetch(endpoint_uri, {
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            // "X-CSRFToken": csrf_token,
            ...(options.headers || {}),
        },
        ...options,
    });

    if (!res.ok) {
        throw new Error(`API request failed: ${res.status}`);
    }

    const result = res.json() as Promise<T>;
    return result;
}