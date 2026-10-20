import { ApiError } from "./types";

// Message lisible pour n'importe quelle erreur (réseau, 4xx, 5xx)
export function getErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
        if (error.status >= 500) {
            return "Le serveur a rencontré un problème, réessaie dans un instant";
        }
        return error.message;
    }
    return "Une erreur est survenue, réessaie";
}

// Erreurs de validation de l'API (errors[]) → { champ: message }
export function getFieldErrors(error: unknown): Record<string, string> {
    if (!(error instanceof ApiError)) {
        return {};
    }
    const fields: Record<string, string> = {};
    for (const detail of error.details) {
        if (detail.field && !fields[detail.field]) {
            fields[detail.field] = detail.message;
        }
    }
    return fields;
}
