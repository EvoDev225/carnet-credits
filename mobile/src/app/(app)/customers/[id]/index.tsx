import { router, Stack, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Alert, FlatList, Text, View } from "react-native";
import TransactionRow from "../../../../components/customers/TransactionRow";
import Avatar from "../../../../components/ui/Avatar";
import Button from "../../../../components/ui/Button";
import EmptyState from "../../../../components/ui/EmptyState";
import ErrorState from "../../../../components/ui/ErrorState";
import ListSkeleton from "../../../../components/ui/ListSkeleton";
import { useAuth } from "../../../../context/AuthContext";
import { useCancelTransaction, useCustomer, useDeleteCustomer, useTransactions } from "../../../../hooks/useCustomer";
import { getErrorMessage } from "../../../../lib/errors";
import { formatFcfa, formatPhone } from "../../../../lib/format";
import { colors } from "../../../../lib/theme";
import type { Customer, Transaction, TransactionType } from "../../../../lib/types";

function BalanceCard({ customer }: { customer: Customer }) {
    const hasDebt = customer.balance > 0;
    const phone = formatPhone(customer.phone);

    return (
        <View className="items-center gap-1">
            <Avatar name={customer.name} size={64} />
            <Text className="mt-2 text-center font-jakarta-extrabold text-xl text-navy">{customer.name}</Text>
            {phone ? <Text className="font-jakarta text-muted">{phone}</Text> : null}
            {customer.note ? (
                <Text className="text-center font-jakarta text-sm text-ink">{customer.note}</Text>
            ) : null}
            <Text className="mt-3 font-jakarta-semibold text-sm text-muted">
                {hasDebt ? "Doit à la boutique" : "Compte soldé"}
            </Text>
            <Text
                accessibilityLabel={hasDebt ? `Solde : doit ${formatFcfa(customer.balance)}` : "Solde : soldé"}
                className={`font-jakarta-extrabold ${hasDebt ? "text-debt" : "text-ok"}`}
                style={{ fontSize: 34, fontVariant: ["tabular-nums"] }}
            >
                {formatFcfa(customer.balance)}
            </Text>
        </View>
    );
}

export default function CustomerScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuth();
    const isOwner = user?.role === "owner";
    const customer = useCustomer(id);
    const transactions = useTransactions(id);
    const cancelTransaction = useCancelTransaction(id);
    const deleteCustomer = useDeleteCustomer(id);

    if (customer.isPending) {
        return (
            <View className="flex-1 bg-canvas p-4">
                <ListSkeleton count={4} />
            </View>
        );
    }

    if (customer.isError) {
        return (
            <View className="flex-1 bg-canvas">
                <ErrorState message={getErrorMessage(customer.error)} onRetry={customer.refetch} />
            </View>
        );
    }

    const data = customer.data;
    const items = transactions.data?.pages.flatMap((page) => page.items) ?? [];

    const openOperation = (type: TransactionType) =>
        router.push({ pathname: "/customers/[id]/operation", params: { id, type } });

    const confirmDelete = () => {
        Alert.alert("Supprimer ce client ?", `${data.name} sera définitivement supprimé.`, [
            { text: "Annuler", style: "cancel" },
            {
                text: "Supprimer",
                style: "destructive",
                onPress: () =>
                    deleteCustomer.mutate(undefined, {
                        onSuccess: () => router.back(),
                        // 409 : solde non nul ou historique existant, l'API explique pourquoi
                        onError: (error) => Alert.alert("Suppression impossible", getErrorMessage(error)),
                    }),
            },
        ]);
    };

    const confirmCancel = (transaction: Transaction) => {
        const label = transaction.type === "DEBT" ? "la dette" : "le remboursement";
        Alert.alert(
            "Annuler cette opération ?",
            `${label.charAt(0).toUpperCase()}${label.slice(1)} de ${formatFcfa(transaction.amount)} sera annulé${transaction.type === "DEBT" ? "e" : ""} et le solde corrigé.`,
            [
                { text: "Non", style: "cancel" },
                {
                    text: "Annuler l'opération",
                    style: "destructive",
                    onPress: () =>
                        cancelTransaction.mutate(transaction._id, {
                            onError: (error) => Alert.alert("Annulation impossible", getErrorMessage(error)),
                        }),
                },
            ]
        );
    };

    const header = (
        <View className="gap-4 p-4">
            <View className="gap-4 rounded-2xl border border-line bg-white p-5">
                <BalanceCard customer={data} />
                <View className="flex-row gap-3">
                    <View className="flex-1">
                        <Button title="+ Dette" onPress={() => openOperation("DEBT")} />
                    </View>
                    {isOwner ? (
                        <View className="flex-1">
                            <Button
                                title="Remboursement"
                                variant="secondary"
                                onPress={() => openOperation("PAYMENT")}
                                disabled={data.balance === 0}
                            />
                        </View>
                    ) : null}
                </View>
                <View className="flex-row gap-3">
                    <View className="flex-1">
                        <Button
                            title="Modifier"
                            variant="secondary"
                            onPress={() => router.push({ pathname: "/customers/[id]/edit", params: { id } })}
                        />
                    </View>
                    {isOwner ? (
                        <View className="flex-1">
                            <Button
                                title="Supprimer"
                                variant="danger"
                                onPress={confirmDelete}
                                loading={deleteCustomer.isPending}
                            />
                        </View>
                    ) : null}
                </View>
            </View>
            <View className="flex-row items-baseline justify-between">
                <Text className="font-jakarta-bold text-lg text-navy">Historique</Text>
                {isOwner && items.length > 0 ? (
                    <Text className="font-jakarta text-xs text-muted">Appui long pour annuler</Text>
                ) : null}
            </View>
        </View>
    );

    const emptyHistory = transactions.isPending ? (
        <View className="px-4">
            <ListSkeleton count={3} />
        </View>
    ) : transactions.isError ? (
        <ErrorState message={getErrorMessage(transactions.error)} onRetry={transactions.refetch} />
    ) : (
        <EmptyState title="Aucune opération" message="Les dettes et remboursements de ce client apparaîtront ici" />
    );

    return (
        <View className="flex-1 bg-canvas">
            <Stack.Screen options={{ title: data.name }} />
            <FlatList
                data={items}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <TransactionRow
                        transaction={item}
                        onLongPress={isOwner && !item.cancelled ? () => confirmCancel(item) : undefined}
                    />
                )}
                ListHeaderComponent={header}
                ListEmptyComponent={emptyHistory}
                ListFooterComponent={
                    transactions.isFetchingNextPage ? (
                        <View className="py-4">
                            <ActivityIndicator color={colors.brand} />
                        </View>
                    ) : undefined
                }
                onEndReached={() => {
                    if (transactions.hasNextPage && !transactions.isFetchingNextPage) {
                        transactions.fetchNextPage();
                    }
                }}
                onEndReachedThreshold={0.4}
                refreshing={transactions.isRefetching && !transactions.isFetchingNextPage}
                onRefresh={() => {
                    customer.refetch();
                    transactions.refetch();
                }}
                contentContainerStyle={{ paddingBottom: 32 }}
            />
        </View>
    );
}

