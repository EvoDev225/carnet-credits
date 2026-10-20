import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useAuth } from "../../../context/AuthContext";
import { colors } from "../../../lib/theme";

export default function AppTabs() {
    const { user } = useAuth();
    const isOwner = user?.role === "owner";

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
            {/* Onglet invisible et inaccessible pour un collaborateur */}
            <Tabs.Protected guard={isOwner}>
                <Tabs.Screen
                    name="team"
                    options={{
                        title: "Équipe",
                        tabBarIcon: ({ focused }) => (
                            <Ionicons
                                name={focused ? "briefcase" : "briefcase-outline"}
                                size={24}
                                color={focused ? colors.brand : colors.muted}
                            />
                        ),
                    }}
                />
            </Tabs.Protected>
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
