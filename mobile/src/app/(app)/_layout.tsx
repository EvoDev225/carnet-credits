import { Stack } from "expo-router";
import { colors } from "../../lib/theme";

// Les onglets sont l'écran de base ; les écrans de détail s'empilent au-dessus
export default function AppStack() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: colors.navy },
                headerTintColor: colors.white,
                headerTitleStyle: { fontFamily: "PlusJakartaSans_700Bold" },
                headerBackButtonDisplayMode: "minimal",
                contentStyle: { backgroundColor: colors.canvas },
            }}
        >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="customers/new" options={{ title: "Nouveau client" }} />
            <Stack.Screen name="customers/[id]/index" options={{ title: "Fiche client" }} />
            <Stack.Screen name="customers/[id]/edit" options={{ title: "Modifier le client" }} />
            <Stack.Screen name="customers/[id]/operation" options={{ title: "Nouvelle opération" }} />
            <Stack.Screen name="team/new" options={{ title: "Nouveau collaborateur" }} />
            <Stack.Screen name="team/[id]" options={{ title: "Collaborateur" }} />
            <Stack.Screen name="password" options={{ title: "Mot de passe" }} />
        </Stack>
    );
}
