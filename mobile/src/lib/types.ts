export type Role = "owner" | "staff";

export type Shop = {
    id: string;
    name: string;
};

export type User = {
    id: string;
    name: string;
    phone: string;
    role: Role;
    shop: Shop;
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

export type Customer = {
    _id: string;
    name: string;
    phone?: string;
    note?: string;
    balance: number;
    createdAt: string;
    updatedAt: string;
};

export type Paginated<T> = {
    items: T[];
    page: number;
    limit: number;
    total: number;
};

export type CustomerStatus = "all" | "debt" | "settled";

export type TransactionType = "DEBT" | "PAYMENT";

export type Transaction = {
    _id: string;
    customer: string;
    type: TransactionType;
    amount: number;
    description?: string;
    cancelled: boolean;
    cancelledAt?: string;
    createdAt: string;
    createdBy: { _id: string; name: string } | null;
    cancelledBy?: { _id: string; name: string } | null;
};

export type TransactionsPage = Paginated<Transaction> & { balance: number };

export type TransactionMutationResponse = {
    message: string;
    transaction: Transaction;
    balance: number;
};

export type CustomerInput = {
    name: string;
    phone: string;
    note: string;
};

export type Staff = {
    id: string;
    name: string;
    phone: string;
    role: "staff";
    active: boolean;
    createdAt: string;
};

export type DashboardTransaction = {
    _id: string;
    type: TransactionType;
    amount: number;
    cancelled: boolean;
    createdAt: string;
    customer: { _id: string; name: string } | null;
    createdBy: { _id: string; name: string } | null;
};

export type DashboardResponse = {
    summary: { customersCount: number; customersWithDebt: number; totalOutstanding: number };
    topDebtors: { _id: string; name: string; phone?: string; balance: number }[];
    month: { start: string; debts: { total: number; count: number }; payments: { total: number; count: number } };
    recentTransactions: DashboardTransaction[];
};
