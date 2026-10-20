import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../lib/theme";

// Bouton d'action flottant, en bas à droite de l'écran
export default function Fab({ label, onPress }: { label: string; onPress: () => void }) {
    const insets = useSafeAreaInsets();

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
            className="absolute right-4 min-h-[52px] flex-row items-center gap-2 rounded-full bg-brand px-5 active:opacity-80"
            style={{
                bottom: Math.max(insets.bottom, 16),
                elevation: 4,
                shadowColor: colors.navy,
                shadowOpacity: 0.2,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
            }}
        >
            <Ionicons name="add" size={22} color={colors.white} />
            <Text className="font-jakarta-bold text-base text-white">{label}</Text>
        </Pressable>
    );
}
