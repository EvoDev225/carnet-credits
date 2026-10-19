import { colors } from "@/lib/theme";
import { Tabs } from "expo-router";

export default function AppLayout() {
    return (
        <Tabs screenOptions={{ headerShown: false,tabBarActiveTintColor: colors.brand }}>
            <Tabs.Screen name="index" options={{ title: "Clients" }} />
        </Tabs>
    );
}