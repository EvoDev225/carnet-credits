import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { formatFcfa, formatRelativeDay, formatSignedFcfa, formatTime } from "../../lib/format";
import { tabularNums } from "../../lib/theme";
import type { DashboardResponse } from "../../lib/types";
import Avatar from "../ui/Avatar";

const openCustomer = (id: string) => router.push({ pathname: "/customers/[id]", params: { id } });

// Sous l'en-tête du propriétaire : plus gros débiteurs et dernières opérations
// (données déjà renvoyées par /api/dashboard)
export default function DashboardHighlights({ dashboard }: { dashboard: DashboardResponse }) {
    const { topDebtors, recentTransactions } = dashboard;
    if (topDebtors.length === 0 && recentTransactions.length === 0) {
        return null;
    }

    return (
        <View className="gap-4 pt-5">
            {topDebtors.length > 0 ? (
                <View className="gap-2">
                    <Text accessibilityRole="header" className="px-4 font-jakarta-bold text-base text-navy">
                        Plus gros débiteurs
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                    >
                        {topDebtors.map((debtor) => (
                            <Pressable
                                key={debtor._id}
                                onPress={() => openCustomer(debtor._id)}
                                accessibilityRole="button"
                                accessibilityLabel={`${debtor.name}, doit ${formatFcfa(debtor.balance)}`}
                                className="w-[140px] gap-2 rounded-card border border-line bg-surface p-3 active:bg-avatar/40"
                            >
                                <Avatar name={debtor.name} size={36} />
                                <Text className="font-jakarta-semibold text-sm text-ink" numberOfLines={1}>
                                    {debtor.name}
                                </Text>
                                <Text className="font-jakarta-bold text-sm text-debt" style={tabularNums}>
                                    {formatFcfa(debtor.balance)}
                                </Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>
            ) : null}

            {recentTransactions.length > 0 ? (
                <View className="mx-4 gap-1 rounded-card border border-line bg-surface px-4 py-3">
                    <Text accessibilityRole="header" className="pb-1 font-jakarta-bold text-base text-navy">
                        Dernières opérations
                    </Text>
                    {recentTransactions.map((transaction) => {
                        const isDebt = transaction.type === "DEBT";
                        const name = transaction.customer?.name ?? "Client supprimé";
                        const amount = formatSignedFcfa(transaction.amount, transaction.type);
                        const when = `${formatRelativeDay(transaction.createdAt)}, ${formatTime(transaction.createdAt)}`;
                        return (
                            <Pressable
                                key={transaction._id}
                                disabled={!transaction.customer}
                                onPress={() => transaction.customer && openCustomer(transaction.customer._id)}
                                accessibilityRole="button"
                                accessibilityLabel={`${isDebt ? "Dette" : "Remboursement"} de ${amount}, ${name}, ${when}${transaction.cancelled ? ", annulée" : ""}`}
                                className="min-h-[44px] flex-row items-center justify-between gap-3 py-2"
                            >
                                <View className="flex-1">
                                    <Text
                                        className={`font-jakarta-semibold text-sm text-ink ${transaction.cancelled ? "line-through" : ""}`}
                                        numberOfLines={1}
                                    >
                                        {name}
                                    </Text>
                                    <Text className="font-jakarta text-xs text-muted">
                                        {`${isDebt ? "Dette" : "Remboursement"} · ${when}`}
                                    </Text>
                                </View>
                                <Text
                                    className={`font-jakarta-bold text-sm ${
                                        transaction.cancelled ? "text-muted line-through" : isDebt ? "text-debt" : "text-payment"
                                    }`}
                                    style={tabularNums}
                                >
                                    {amount}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            ) : null}
        </View>
    );
}
