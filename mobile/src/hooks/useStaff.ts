import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Staff } from "../lib/types";

export function useStaff() {
    return useQuery({
        queryKey: ["staff"],
        queryFn: async () => (await api.get<{ items: Staff[] }>("/api/staff")).items,
    });
}

export function useCreateStaff() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: { name: string; phone: string; password: string }) =>
            (await api.post<{ staff: Staff }>("/api/staff", input)).staff,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff"] }),
    });
}

export function useUpdateStaff(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: { name?: string; active?: boolean; password?: string }) =>
            (await api.patch<{ staff: Staff }>(`/api/staff/${id}`, input)).staff,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff"] }),
    });
}
