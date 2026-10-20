import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import IconButton from "./IconButton";

// Bandeau navy à bas arrondi, commun à la connexion, l'inscription, l'accueil,
// l'équipe et le profil.
//  - minHeight : hauteur minimale (le bandeau grandit avec les grandes polices)
//  - decoration : élément décoratif derrière le contenu (cercle, mascotte…)
export default function ScreenHeader({
    title,
    subtitle,
    onBack,
    right,
    align = "left",
    minHeight,
    decoration,
    children,
}: {
    title?: string;
    subtitle?: string;
    onBack?: () => void;
    right?: ReactNode;
    align?: "left" | "center";
    minHeight?: number;
    decoration?: ReactNode;
    children?: ReactNode;
}) {
    const insets = useSafeAreaInsets();
    const centered = align === "center";

    return (
        <View
            className="overflow-hidden rounded-b-header bg-navy px-5 pb-6"
            style={{ paddingTop: insets.top + 16, minHeight }}
        >
            {decoration ? (
                <View pointerEvents="none" className="absolute inset-0">
                    {decoration}
                </View>
            ) : null}
            <View className="flex-row items-center gap-3">
                {onBack ? <IconButton icon="arrow-back" label="Retour" onPress={onBack} tone="inverse" /> : null}
                <View className={`flex-1 ${centered ? "items-center" : ""}`}>
                    {title ? (
                        <Text accessibilityRole="header" className="font-jakarta-extrabold text-xl text-white">
                            {title}
                        </Text>
                    ) : null}
                    {subtitle ? (
                        <Text className={`font-jakarta text-sm text-white/80 ${centered ? "text-center" : ""}`}>
                            {subtitle}
                        </Text>
                    ) : null}
                </View>
                {right}
            </View>
            {children}
        </View>
    );
}
