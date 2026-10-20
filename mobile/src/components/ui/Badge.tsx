import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Text, View } from "react-native";
import { colors } from "../../lib/theme";

export type BadgeTone = "debt" | "payment" | "muted" | "warning";

const tones: Record<BadgeTone, { container: string; text: string; icon: string }> = {
    debt: { container: "bg-debt-soft", text: "text-debt", icon: colors.debt },
    payment: { container: "bg-payment-soft", text: "text-payment", icon: colors.payment },
    muted: { container: "bg-canvas border border-line", text: "text-muted", icon: colors.muted },
    warning: { container: "bg-warning-soft", text: "text-warning", icon: colors.warning },
};

// Pastille de statut (Dette, Soldé, Annulée, Désactivé…) : toujours un libellé, jamais la couleur seule
export default function Badge({
    label,
    tone,
    icon,
}: {
    label: string;
    tone: BadgeTone;
    icon?: ComponentProps<typeof Ionicons>["name"];
}) {
    const style = tones[tone];
    return (
        <View className={`flex-row items-center gap-1 rounded-full px-3 py-1 ${style.container}`}>
            {icon ? <Ionicons name={icon} size={12} color={style.icon} /> : null}
            <Text className={`font-jakarta-semibold text-xs ${style.text}`}>{label}</Text>
        </View>
    );
}
