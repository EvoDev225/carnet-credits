import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type {
    Customer,
    CustomerInput,
    TransactionMutationResponse,
    TransactionsPage,
    TransactionType,
} from "../lib/types";

// Tout ce qui dépend des clients ou des soldes est rechargé après une écriture
function invalidateCustomerData(queryClient: QueryClient, id?: string) {
    queryClient.invalidateQueries({ queryKey: ["customers"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    if (id) {
        queryClient.invalidateQueries({ queryKey: ["customer", id] });
        queryClient.invalidateQueries({ queryKey: ["transactions", id] });
    }
}

// Solde renvoyé par l'API appliqué tout de suite à la fiche (retour instantané)
function applyBalance(queryClient: QueryClient, id: string, balance: number) {
    queryClient.setQueryData<Customer>(["customer", id], (customer) =>
        customer ? { ...customer, balance } : customer
    );
}

export function useCustomer(id: string) {
    return useQuery({
        queryKey: ["customer", id],
        queryFn: async () => (await api.get<{ customer: Customer }>(`/api/customers/${id}`)).customer,
    });
}

export function useTransactions(id: string) {
    return useInfiniteQuery<TransactionsPage>({
        queryKey: ["transactions", id],
        queryFn: ({ pageParam }) =>
            api.get<TransactionsPage>(`/api/customers/${id}/transactions?page=${pageParam}&limit=20`),
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.page * lastPage.limit < lastPage.total ? lastPage.page + 1 : undefined,
    });
}

export function useCreateCustomer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: CustomerInput) =>
            (await api.post<{ customer: Customer }>("/api/customers", input)).customer,
        onSuccess: () => invalidateCustomerData(queryClient),
    });
}

export function useUpdateCustomer(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: CustomerInput) =>
            (await api.patch<{ customer: Customer }>(`/api/customers/${id}`, input)).customer,
        onSuccess: (customer) => {
            queryClient.setQueryData(["customer", id], customer);
            invalidateCustomerData(queryClient, id);
        },
    });
}

export function useDeleteCustomer(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => api.delete<void>(`/api/customers/${id}`),
        onSuccess: () => {
            queryClient.removeQueries({ queryKey: ["customer", id] });
            queryClient.removeQueries({ queryKey: ["transactions", id] });
            invalidateCustomerData(queryClient);
        },
    });
}

export function useCreateTransaction(customerId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: { type: TransactionType; amount: number; description?: string }) =>
            api.post<TransactionMutationResponse>(`/api/customers/${customerId}/transactions`, input),
        onSuccess: (data) => {
            applyBalance(queryClient, customerId, data.balance);
            invalidateCustomerData(queryClient, customerId);
        },
    });
}

export function useCancelTransaction(customerId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (transactionId: string) =>
            api.patch<TransactionMutationResponse>(`/api/transactions/${transactionId}/cancel`),
        onSuccess: (data) => {
            applyBalance(queryClient, customerId, data.balance);
            invalidateCustomerData(queryClient, customerId);
        },
    });
}
