export type Role = "owner" | "staff";

export type User = {
    id: string;
    name: string;
    phone: string;
    role: Role;
    shop: string;
};

export type AuthResponse = {
    token: string;
    user: User;
};

export type ApiErrorDetail = {
    field: string;
    message: string;
};

export class ApiError extends Error {
    public status: number;
    public details: ApiErrorDetail[];

    constructor(status: number, message: string, details: ApiErrorDetail[] = []) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.details = details;
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}