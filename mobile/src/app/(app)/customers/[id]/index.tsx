import { router, Stack, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, FlatList, Linking, Platform, Text, View } from "react-native";
import TransactionRow from "../../../../components/customers/TransactionRow";
import AnimatedAmount from "../../../../components/ui/AnimatedAmount";
import Avatar from "../../../../components/ui/Avatar";
import Badge from "../../../../components/ui/Badge";
import Button from "../../../../components/ui/Button";
import Card from "../../../../components/ui/Card";
import { useConfirm } from "../../../../components/ui/ConfirmDialog";
import EmptyState from "../../../../components/ui/EmptyState";
import ErrorState from "../../../../components/ui/ErrorState";
import IconButton from "../../../../components/ui/IconButton";
import ListSkeleton from "../../../../components/ui/ListSkeleton";
import SectionHeader from "../../../../components/ui/SectionHeader";
import { useToast } from "../../../../components/ui/Toast";
import { useAuth } from "../../../../context/AuthContext";
import { useCancelTransaction, useCustomer, useDeleteCustomer, useTransactions } from "../../../../hooks/useCustomer";
import { getErrorMessage } from "../../../../lib/errors";
import { dayKey, formatFcfa, formatPhone, formatRelativeDay, formatSignedFcfa } from "../../../../lib/format";
import { hapticError, hapticSuccess } from "../../../../lib/haptics";
import { colors } from "../../../../lib/theme";
import type { Customer, Transaction, TransactionType } from "../../../../lib/types";

type HistoryRow = { kind: "day"; key: string; label: string } | { kind: "transaction"; key: string; transaction: Transaction };

// Historique à plat → intertitres par jour (« Aujourd'hui », « Hier », « 12 octobre »)
function groupByDay(transactions: Transaction[]): HistoryRow[] {
    const rows: HistoryRow[] = [];
    let currentDay = "";
    for (const transaction of transactions) {
        const day = dayKey(transaction.createdAt);
        if (day !== currentDay) {
            currentDay = day;
            rows.push({ kind: "day", key: `day-${day}`, label: formatRelativeDay(transaction.createdAt) });
        }
        rows.push({ kind: "transaction", key: transaction._id, transaction });
    }
    return rows;
}

function reminderMessage(customer: Customer, shopName: string): string {
    return `Bonjour ${customer.name}, c'est ${shopName}. Petit rappel : votre solde est de ${formatFcfa(customer.balance)}. Merci !`;
}

function BalanceBlock({ customer }: { customer: Customer }) {
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
            <View className="mt-3">
                {hasDebt ? (
                    <Badge tone="debt" icon="alert-circle" label="Doit à la boutique" />
                ) : (
                    <Badge tone="payment" icon="checkmark-circle" label="Compte soldé" />
                )}
            </View>
            <AnimatedAmount
                value={customer.balance}
                accessibilityLabel={hasDebt ? `Solde : doit ${formatFcfa(customer.balance)}` : "Solde : soldé"}
                className="mt-1 text-center font-jakarta-extrabold text-display"
                // Couleur en style et non en classe : sur Expo web, NativeWind cumulait
                // l'ancienne et la nouvelle classe quand le solde passait de soldé à dette
                style={{ color: hasDebt ? colors.debt : colors.payment }}
            />
        </View>
    );
}

export default function CustomerScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuth();
    const isOwner = user?.role === "owner";
    const confirm = useConfirm();
    const toast = useToast();
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
                <ErrorState error={customer.error} onRetry={customer.refetch} />
            </View>
        );
    }

    const data = customer.data;
    const rows = groupByDay(transactions.data?.pages.flatMap((page) => page.items) ?? []);
    const phoneDigits = data.phone?.replace(/\D/g, "");

    const openOperation = (type: TransactionType) =>
        router.push({ pathname: "/customers/[id]/operation", params: { id, type } });

    const openUrl = (url: string) =>
        Linking.openURL(url).catch(() => toast("Aucune application disponible pour cette action", "error"));

    const sendSms = () => {
        const body = encodeURIComponent(reminderMessage(data, user?.shop.name ?? "la boutique"));
        // iOS sépare le corps avec « & », Android avec « ? »
        openUrl(`sms:+${phoneDigits}${Platform.OS === "ios" ? "&" : "?"}body=${body}`);
    };

    const sendWhatsApp = () => {
        const text = encodeURIComponent(reminderMessage(data, user?.shop.name ?? "la boutique"));
        openUrl(`https://wa.me/${phoneDigits}?text=${text}`);
    };

    const handleDelete = async () => {
        const accepted = await confirm({
            title: "Supprimer ce client ?",
            message: `${data.name} sera définitivement supprimé.`,
            confirmLabel: "Supprimer",
            destructive: true,
        });
        if (!accepted) return;
        deleteCustomer.mutate(undefined, {
            onSuccess: () => {
                hapticSuccess();
                toast("Client supprimé");
                router.back();
            },
            // 409 : solde non nul ou historique existant, l'API explique pourquoi
            onError: async (error) => {
                hapticError();
                await confirm({
                    title: "Suppression impossible",
                    message: getErrorMessage(error),
                    confirmLabel: "J'ai compris",
                    cancelLabel: "Fermer",
                });
            },
        });
    };

    const handleCancel = async (transaction: Transaction) => {
        const label = transaction.type === "DEBT" ? "Dette" : "Remboursement";
        const accepted = await confirm({
            title: "Annuler cette opération ?",
            message: `${label} de ${formatSignedFcfa(transaction.amount, transaction.type)} : l'opération restera visible, barrée, et le solde sera corrigé.`,
            confirmLabel: "Annuler l'opération",
            cancelLabel: "Garder",
            destructive: true,
        });
        if (!accepted) return;
        cancelTransaction.mutate(transaction._id, {
            onSuccess: () => {
                hapticSuccess();
                toast("Opération annulée");
            },
            onError: (error) => {
                hapticError();
                toast(getErrorMessage(error), "error");
            },
        });
    };

    const header = (
        <View className="gap-4 p-4">
            <Card className="gap-4">
                <BalanceBlock customer={data} />
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
                                accessibilityHint={data.balance === 0 ? "Le client ne doit rien" : undefined}
                            />
                        </View>
                    ) : null}
                </View>
                <View className="flex-row flex-wrap justify-center gap-4 border-t border-line pt-4">
                    {phoneDigits ? (
                        <>
                            <IconButton icon="call-outline" label={`Appeler ${data.name}`} caption="Appeler" onPress={() => openUrl(`tel:+${phoneDigits}`)} />
                            {data.balance > 0 ? (
                                <>
                                    <IconButton icon="chatbubble-outline" label="Envoyer un rappel par SMS" caption="SMS" onPress={sendSms} />
                                    <IconButton icon="logo-whatsapp" label="Envoyer un rappel par WhatsApp" caption="WhatsApp" onPress={sendWhatsApp} />
                                </>
                            ) : null}
                        </>
                    ) : null}
                    <IconButton
                        icon="create-outline"
                        label="Modifier le client"
                        caption="Modifier"
                        onPress={() => router.push({ pathname: "/customers/[id]/edit", params: { id } })}
                    />
                    {isOwner ? (
                        <IconButton
                            icon="trash-outline"
                            label="Supprimer le client"
                            caption="Supprimer"
                            tone="danger"
                            onPress={handleDelete}
                            disabled={deleteCustomer.isPending}
                        />
                    ) : null}
                </View>
            </Card>
            <View className="flex-row items-baseline justify-between">
                <Text accessibilityRole="header" className="font-jakarta-bold text-lg text-navy">Historique</Text>
                {isOwner && rows.length > 0 ? (
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
        <ErrorState error={transactions.error} onRetry={transactions.refetch} />
    ) : (
        <EmptyState
            title="Aucune opération"
            message="Les dettes et remboursements de ce client apparaîtront ici"
            actionLabel="Enregistrer une dette"
            onAction={() => openOperation("DEBT")}
        />
    );

    return (
        <View className="flex-1 bg-canvas">
            <Stack.Screen options={{ title: data.name }} />
            <FlatList
                data={rows}
                keyExtractor={(row) => row.key}
                renderItem={({ item: row }) =>
                    row.kind === "day" ? (
                        <SectionHeader title={row.label} />
                    ) : (
                        <TransactionRow
                            transaction={row.transaction}
                            onLongPress={isOwner && !row.transaction.cancelled ? () => handleCancel(row.transaction) : undefined}
                        />
                    )
                }
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
