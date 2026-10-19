import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { colors } from "../../lib/theme";
import Button from "./Button";

export default function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <View className="items-center justify-center gap-3 py-12">
            <Ionicons name="cloud-offline-outline" size={40} color={colors.muted} />
            <Text className="text-center font-jakarta-semibold text-ink">{message}</Text>
            <Button title="Réessayer" onPress={onRetry} variant="secondary" />
        </View>
    );
}