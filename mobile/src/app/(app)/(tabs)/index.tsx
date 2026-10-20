import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import Animated, { LinearTransition, ReduceMotion } from "react-native-reanimated";
import CustomerRow from "../../../components/customers/CustomerRow";
import DashboardHighlights from "../../../components/home/DashboardHighlights";
import HeroHeader from "../../../components/home/HeroHeader";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import Fab from "../../../components/ui/Fab";
import FilterChips from "../../../components/ui/FilterChips";
import ListSkeleton from "../../../components/ui/ListSkeleton";
import SearchBar from "../../../components/ui/SearchBar";
import SegmentedControl from "../../../components/ui/SegmentedControl";
import { useAuth } from "../../../context/AuthContext";
import { useCustomers } from "../../../hooks/useCustomers";
import { useDashboard } from "../../../hooks/useDashboard";
import { useDebounce } from "../../../hooks/useDebounce";
import { colors } from "../../../lib/theme";
import type { Customer, CustomerSort, CustomerStatus } from "../../../lib/types";

const statusOptions: { value: CustomerStatus; label: string }[] = [
    { value: "all", label: "Tous" },
    { value: "debt", label: "Endettés" },
    { value: "settled", label: "Soldés" },
];

const sortOptions: { value: CustomerSort; label: string }[] = [
    { value: "name", label: "Nom (A → Z)" },
    { value: "-balance", label: "Plus grosse dette" },
];

const itemLayout = LinearTransition.duration(200).reduceMotion(ReduceMotion.System);

export default function CustomersScreen() {
    const { user } = useAuth();
    const [searchInput, setSearchInput] = useState("");
    const [status, setStatus] = useState<CustomerStatus>("all");
    const [sort, setSort] = useState<CustomerSort>("name");
    const debouncedSearch = useDebounce(searchInput.trim(), 300);
    const [refreshing, setRefreshing] = useState(false);
    const isOwner = user?.role === "owner";
    const customers = useCustomers({ search: debouncedSearch, status, sort });
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
    const isFiltering = debouncedSearch.length > 0 || status !== "all";
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
            {isOwner && dashboard.data && !isFiltering ? <DashboardHighlights dashboard={dashboard.data} /> : null}
            <View className="gap-3 px-4 pb-2 pt-5">
                <SearchBar
                    value={searchInput}
                    onChangeText={setSearchInput}
                    placeholder="Rechercher un nom ou un numéro"
                />
                <FilterChips options={statusOptions} value={status} onChange={setStatus} />
                <SegmentedControl options={sortOptions} value={sort} onChange={setSort} />
            </View>
        </>
    );

    const emptyState = customers.isPending ? (
        <View className="px-4">
            <ListSkeleton />
        </View>
    ) : customers.isError ? (
        <ErrorState error={customers.error} onRetry={customers.refetch} />
    ) : isFiltering ? (
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
            <Animated.FlatList<Customer>
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
                itemLayoutAnimation={itemLayout}
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
                keyboardDismissMode="on-drag"
                onEndReached={() => {
                    if (customers.hasNextPage && !customers.isFetchingNextPage) {
                        customers.fetchNextPage();
                    }
                }}
                onEndReachedThreshold={0.4}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                contentContainerStyle={{ paddingBottom: 96 }}
            />
            {items.length > 0 ? <Fab label="Ajouter un client" onPress={openNewCustomer} /> : null}
        </View>
    );
}
