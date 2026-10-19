import { getToken } from "./storage";
import { ApiError, type ApiErrorDetail } from "./types";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
if (!BASE_URL) {
    throw new Error("EXPO_PUBLIC_API_URL n'est pas défini (fichier .env)");
}

const TIMEOUT_MS = 15000;

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
    unauthorizedHandler = handler;
}

type ErrorBody = { message?: string; errors?: ApiErrorDetail[] };

export async function apiFetch<T>(
    path: string,
    options: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<T> {
    const { method = "GET", body, auth = true } = options;
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
    };

    if (auth) {
        const token = await getToken();
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const res = await fetch(`${BASE_URL}${path}`, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
            signal: controller.signal,
        });

        const text = await res.text();
        let data: unknown;

        if (res.status !== 204 && text) {
            try {
                data = JSON.parse(text);
            } catch {
                throw new ApiError(res.status, "Réponse inattendue du serveur");
            }
        }

        if (!res.ok) {
            if (res.status === 401 && auth) {
                unauthorizedHandler?.();
            }
            const errorBody = (data ?? {}) as ErrorBody;
            throw new ApiError(
                res.status,
                errorBody.message ?? "Une erreur est survenue",
                errorBody.errors ?? []
            );
        }

        return data as T;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        if (error instanceof Error && error.name === "AbortError") {
            throw new ApiError(0, "Le serveur met trop de temps à répondre");
        }
        throw new ApiError(0, "Impossible de joindre le serveur");
    } finally {
        clearTimeout(timeoutId);
    }
}

export const api = {
    get: <T>(path: string) => apiFetch<T>(path, { method: "GET" }),
    post: <T>(path: string, body?: unknown, auth = true) =>
        apiFetch<T>(path, { method: "POST", body, auth }),
    patch: <T>(path: string, body?: unknown) =>
        apiFetch<T>(path, { method: "PATCH", body }),
    delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};