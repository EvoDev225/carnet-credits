import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { formatDateTime, formatFcfa } from "../../lib/format";
import { colors } from "../../lib/theme";
import type { Transaction } from "../../lib/types";

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
    const sign = isDebt ? "+" : "−";
    const cancelled = transaction.cancelled;
    const amountColor = cancelled ? "text-muted" : isDebt ? "text-debt" : "text-ok";
    const author = transaction.createdBy?.name ?? "Utilisateur supprimé";

    return (
        <Pressable
            onLongPress={onLongPress}
            delayLongPress={400}
            accessibilityRole={onLongPress ? "button" : undefined}
            accessibilityHint={onLongPress ? "Appui long pour annuler l'opération" : undefined}
            accessibilityLabel={`${label} de ${formatFcfa(transaction.amount)}${cancelled ? ", annulée" : ""}, ${formatDateTime(transaction.createdAt)}, par ${author}`}
            className="flex-row items-start gap-3 border-b border-line bg-white px-4 py-3 active:bg-avatar/40"
        >
            <View
                className={`mt-1 h-9 w-9 items-center justify-center rounded-full ${isDebt ? "bg-debt-soft" : "bg-ok/10"}`}
            >
                <Ionicons
                    name={isDebt ? "arrow-up" : "arrow-down"}
                    size={18}
                    color={cancelled ? colors.muted : isDebt ? colors.debt : colors.ok}
                />
            </View>
            <View className="flex-1">
                <View className="flex-row items-center justify-between gap-2">
                    <Text className={`font-jakarta-bold text-base text-ink ${cancelled ? "line-through" : ""}`}>
                        {label}
                    </Text>
                    <Text
                        className={`font-jakarta-bold text-base ${amountColor} ${cancelled ? "line-through" : ""}`}
                        style={{ fontVariant: ["tabular-nums"] }}
                    >
                        {`${sign}${formatFcfa(transaction.amount)}`}
                    </Text>
                </View>
                {transaction.description ? (
                    <Text className="font-jakarta text-sm text-ink">{transaction.description}</Text>
                ) : null}
                <Text className="font-jakarta text-xs text-muted">
                    {`${formatDateTime(transaction.createdAt)} · ${author}`}
                </Text>
                {cancelled ? (
                    <Text className="mt-1 font-jakarta-semibold text-xs text-debt">
                        {`Annulée${transaction.cancelledBy ? ` par ${transaction.cancelledBy.name}` : ""}`}
                    </Text>
                ) : null}
            </View>
        </Pressable>
    );
}
