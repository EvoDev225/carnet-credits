import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Conteneur commun des formulaires : le clavier ne cache jamais le champ actif,
// et il se ferme quand on fait défiler
export default function FormScreen({ children }: { children: ReactNode }) {
    const insets = useSafeAreaInsets();

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="flex-1 bg-canvas"
        >
            <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
            >
                <View className="gap-4 rounded-2xl border border-line bg-white p-5">{children}</View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
