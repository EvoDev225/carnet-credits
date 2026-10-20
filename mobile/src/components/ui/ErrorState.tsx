import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { getErrorMessage, isOfflineError } from "../../lib/errors";
import { colors } from "../../lib/theme";
import Button from "./Button";

// État d'erreur avec bouton « Réessayer ». Distingue le serveur injoignable (hors ligne)
// des autres erreurs.
export default function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
    const offline = isOfflineError(error);

    return (
        <View className="items-center justify-center gap-3 px-6 py-12">
            <Ionicons name={offline ? "cloud-offline-outline" : "alert-circle-outline"} size={40} color={colors.muted} />
            <Text accessibilityRole="header" className="text-center font-jakarta-bold text-lg text-navy">
                {offline ? "Serveur injoignable" : "Un problème est survenu"}
            </Text>
            <Text className="text-center font-jakarta text-muted">
                {offline
                    ? "Vérifie ta connexion internet, puis réessaie."
                    : getErrorMessage(error)}
            </Text>
            <Button title="Réessayer" onPress={onRetry} variant="secondary" />
        </View>
    );
}
