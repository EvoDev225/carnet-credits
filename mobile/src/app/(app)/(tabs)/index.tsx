import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import CustomerRow from "../../../components/customers/CustomerRow";
import HeroHeader from "../../../components/home/HeroHeader";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import Fab from "../../../components/ui/Fab";
import FilterChips from "../../../components/ui/FilterChips";
import ListSkeleton from "../../../components/ui/ListSkeleton";
import SearchBar from "../../../components/ui/SearchBar";
import { useAuth } from "../../../context/AuthContext";
import { useCustomers } from "../../../hooks/useCustomers";
import { useDashboard } from "../../../hooks/useDashboard";
import { useDebounce } from "../../../hooks/useDebounce";
import { getErrorMessage } from "../../../lib/errors";
import { colors } from "../../../lib/theme";
import type { CustomerStatus } from "../../../lib/types";

const statusOptions: { value: CustomerStatus; label: string }[] = [
    { value: "all", label: "Tous" },
    { value: "debt", label: "Endettés" },
    { value: "settled", label: "Soldés" },
];

export default function CustomersScreen() {
    const { user } = useAuth();
    const [searchInput, setSearchInput] = useState("");
    const [status, setStatus] = useState<CustomerStatus>("all");
    const debouncedSearch = useDebounce(searchInput.trim(), 300);
    const [refreshing, setRefreshing] = useState(false);
    const isOwner = user?.role === "owner";
    const customers = useCustomers({ search: debouncedSearch, status });
    const dashboard = useDashboard(isOwner);

    if (!user) {
        return null;
    }
    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                customers.refetch(),
                isOwner ? dashboard.refetch() : Promise.resolve(),
            ]);
        } finally {
            setRefreshing(false);
        }
    };

    const openNewCustomer = () => router.push("/customers/new");

    const items = customers.data?.pages.flatMap((page) => page.items) ?? [];

    const header = (
        <>
            <HeroHeader
                user={user}
                dashboard={dashboard.data}
                isLoading={dashboard.isPending && isOwner}
                isError={dashboard.isError}
                onRetry={dashboard.refetch}
            />
            <View className="gap-3 px-4 pb-2 pt-4">
                <SearchBar
                    value={searchInput}
                    onChangeText={setSearchInput}
                    placeholder="Rechercher un nom ou un numéro"
                />
                <FilterChips options={statusOptions} value={status} onChange={setStatus} />
            </View>
        </>
    );

    const emptyState = customers.isPending ? (
        <View className="px-4">
            <ListSkeleton />
        </View>
    ) : customers.isError ? (
        <ErrorState message={getErrorMessage(customers.error)} onRetry={customers.refetch} />
    ) : debouncedSearch.length > 0 || status !== "all" ? (
        <EmptyState
            title="Aucun résultat"
            message="Essaie une autre recherche ou un autre filtre"
        />
    ) : (
        <EmptyState
            title="Aucun client pour l'instant"
            message="Les clients que tu ajouteras apparaîtront ici"
            actionLabel="Ajouter mon premier client"
            onAction={openNewCustomer}
        />
    );

    return (
        <View className="flex-1 bg-canvas">
            <FlatList
                data={items}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <View className="px-4">
                        <CustomerRow
                            customer={item}
                            onPress={() => router.push({ pathname: "/customers/[id]", params: { id: item._id } })}
                        />
                    </View>
                )}
                ListHeaderComponent={header}
                ListEmptyComponent={emptyState}
                ListFooterComponent={
                    customers.isFetchingNextPage ? (
                        <View className="py-4">
                            <ActivityIndicator color={colors.brand} />
                        </View>
                    ) : undefined
                }
                keyboardShouldPersistTaps="handled"
                onEndReached={() => {
                    if (customers.hasNextPage && !customers.isFetchingNextPage) {
                        customers.fetchNextPage();
                    }
                }}
                onEndReachedThreshold={0.4}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                keyboardDismissMode="on-drag"
                contentContainerStyle={{ paddingBottom: 96 }}
            />
            <Fab label="Ajouter un client" onPress={openNewCustomer} />
        </View>
    );
}