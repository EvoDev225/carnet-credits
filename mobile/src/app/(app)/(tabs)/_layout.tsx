import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { colors } from "../../lib/theme";

export default function AppTabs() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.brand,
                tabBarInactiveTintColor: colors.muted,
                tabBarLabelStyle: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 11 },
                tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.line },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Clients",
                    tabBarIcon: ({ focused }) => (
                        <Ionicons
                            name={focused ? "people" : "people-outline"}
                            size={24}
                            color={focused ? colors.brand : colors.muted}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profil",
                    tabBarIcon: ({ focused }) => (
                        <Ionicons
                            name={focused ? "person" : "person-outline"}
                            size={24}
                            color={focused ? colors.brand : colors.muted}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}