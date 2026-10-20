import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Customer, CustomerSort, CustomerStatus, Paginated } from "../lib/types";

export function useCustomers({
    search,
    status,
    sort = "name",
}: {
    search: string;
    status: CustomerStatus;
    sort?: CustomerSort;
}) {
    return useInfiniteQuery<Paginated<Customer>>({
        queryKey: ["customers", { search, status, sort }],
        queryFn: ({ pageParam }) => {
            let url = "/api/customers?page=" + pageParam + "&limit=20&sort=" + encodeURIComponent(sort);
            if (search.length > 0) {
                url += "&search=" + encodeURIComponent(search);
            }
            if (status !== "all") {
                url += "&status=" + status;
            }
            return api.get<Paginated<Customer>>(url);
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            return lastPage.page * lastPage.limit < lastPage.total ? lastPage.page + 1 : undefined;
        },
        placeholderData: keepPreviousData,
    });
}
