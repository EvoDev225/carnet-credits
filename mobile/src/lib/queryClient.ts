import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./types";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            retry: (failureCount, error) => {
                if (error instanceof ApiError && error.status >= 400 && error.status <= 499) {
                    return false;
                }
                return failureCount < 2;
            },
            refetchOnWindowFocus: false,
        },
    },
});