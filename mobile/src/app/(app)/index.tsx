import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";

export default function Index() {
    const { user, signOut } = useAuth();

    const roleLabel = user?.role === "owner" ? "Propriétaire" : "Collaborateur";

    return (
        <SafeAreaView className="flex-1 bg-canvas items-center justify-center px-6">
            <Text className="font-jakarta-extrabold text-navy text-2xl text-center mb-2">
                Bonjour {user?.name}
            </Text>
            <Text className="font-jakarta text-muted text-base text-center mb-8">
                {roleLabel}
            </Text>
            <Button
                title="Se déconnecter"
                onPress={signOut}
                variant="secondary"
            />
        </SafeAreaView>
    );
}