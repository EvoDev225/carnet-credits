import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Text, View } from "react-native";
import { colors } from "../../lib/theme";
import PressableScale from "./PressableScale";

type Tone = "default" | "danger" | "inverse";

const toneStyles: Record<Tone, { container: string; icon: string; text: string }> = {
    default: { container: "border border-line bg-surface", icon: colors.navy, text: "text-navy" },
    danger: { container: "border border-debt bg-surface", icon: colors.debt, text: "text-debt" },
    // Sur fond navy (en-têtes)
    inverse: { container: "bg-navy-light", icon: colors.white, text: "text-white" },
};

// Bouton rond à icône : zone tactile de 44×44 minimum et libellé d'accessibilité obligatoire.
// caption affiche un court libellé visible sous l'icône.
export default function IconButton({
    icon,
    label,
    onPress,
    tone = "default",
    caption,
    disabled = false,
}: {
    icon: ComponentProps<typeof Ionicons>["name"];
    label: string;
    onPress: () => void;
    tone?: Tone;
    caption?: string;
    disabled?: boolean;
}) {
    const style = toneStyles[tone];

    return (
        <View className="items-center gap-1">
            <PressableScale
                onPress={onPress}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ disabled }}
                hitSlop={4}
                className={`h-12 w-12 items-center justify-center rounded-full ${style.container} ${disabled ? "opacity-50" : ""}`}
            >
                <Ionicons name={icon} size={22} color={style.icon} />
            </PressableScale>
            {caption ? (
                <Text importantForAccessibility="no" className={`font-jakarta-semibold text-xs ${style.text}`}>
                    {caption}
                </Text>
            ) : null}
        </View>
    );
}
