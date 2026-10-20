import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeIn, ReduceMotion } from "react-native-reanimated";
import { formatSignedFcfa, formatTime } from "../../lib/format";
import { colors, tabularNums } from "../../lib/theme";
import type { Transaction } from "../../lib/types";
import Badge from "../ui/Badge";

const entering = FadeIn.duration(200).reduceMotion(ReduceMotion.System);

// Une ligne de l'historique. Dette = rouge et « + », remboursement = vert et « − » :
// le libellé et l'icône portent aussi l'information (jamais la couleur seule).
export default function TransactionRow({
    transaction,
    onLongPress,
}: {
    transaction: Transaction;
    onLongPress?: () => void;
}) {
    const isDebt = transaction.type === "DEBT";
    const label = isDebt ? "Dette" : "Remboursement";
    const cancelled = transaction.cancelled;
    const amountColor = cancelled ? "text-muted" : isDebt ? "text-debt" : "text-payment";
    const author = transaction.createdBy?.name ?? "Utilisateur supprimé";
    const amount = formatSignedFcfa(transaction.amount, transaction.type);

    return (
        <Animated.View entering={entering}>
            <Pressable
                onLongPress={onLongPress}
                delayLongPress={400}
                accessibilityRole={onLongPress ? "button" : undefined}
                accessibilityHint={onLongPress ? "Appui long pour annuler l'opération" : undefined}
                accessibilityLabel={`${label} de ${amount}${cancelled ? ", annulée" : ""}, à ${formatTime(transaction.createdAt)}, par ${author}`}
                className="flex-row items-start gap-3 border-b border-line bg-surface px-4 py-3 active:bg-avatar/40"
            >
                <View
                    className={`mt-1 h-9 w-9 items-center justify-center rounded-full ${
                        cancelled ? "bg-canvas" : isDebt ? "bg-debt-soft" : "bg-payment-soft"
                    }`}
                >
                    <Ionicons
                        name={isDebt ? "arrow-up" : "arrow-down"}
                        size={18}
                        color={cancelled ? colors.muted : isDebt ? colors.debt : colors.payment}
                    />
                </View>
                <View className="flex-1 gap-0.5">
                    <View className="flex-row items-center justify-between gap-2">
                        <Text className={`shrink font-jakarta-bold text-base text-ink ${cancelled ? "line-through" : ""}`}>
                            {label}
                        </Text>
                        <Text
                            className={`font-jakarta-bold text-base ${amountColor} ${cancelled ? "line-through" : ""}`}
                            style={tabularNums}
                        >
                            {amount}
                        </Text>
                    </View>
                    {transaction.description ? (
                        <Text className="font-jakarta text-sm text-ink">{transaction.description}</Text>
                    ) : null}
                    <Text className="font-jakarta text-xs text-muted">
                        {`${formatTime(transaction.createdAt)} · ${author}`}
                    </Text>
                    {cancelled ? (
                        <View className="mt-1 items-start">
                            <Badge
                                tone="muted"
                                icon="close-circle-outline"
                                label={`Annulée${transaction.cancelledBy ? ` par ${transaction.cancelledBy.name}` : ""}`}
                            />
                        </View>
                    ) : null}
                </View>
            </Pressable>
        </Animated.View>
    );
}
