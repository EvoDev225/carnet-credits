import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Avatar from "../../components/ui/Avatar";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { formatPhone } from "../../lib/format";

export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    const { user, signOut } = useAuth();

    if (!user) {
        return null;
    }

    return (
        <View className="flex-1 bg-canvas">
            <View
                className="h-[160px] rounded-b-[28px] bg-navy px-5"
                style={{ paddingTop: insets.top + 16 }}
            >
                <Text className="font-jakarta-extrabold text-xl text-white">Profil</Text>
            </View>

            <View className="-mt-10 mx-4 items-center rounded-2xl border border-line bg-white p-5">
                <Avatar name={user.name} size={72} />
                <Text className="mt-3 font-jakarta-extrabold text-xl text-navy">
                    {user.name}
                </Text>
                <Text className="mt-1 font-jakarta text-muted">{formatPhone(user.phone)}</Text>
                <View className="mt-3 rounded-full bg-avatar px-3 py-1">
                    <Text className="font-jakarta text-navy">
                        {user.role === "owner" ? "Propriétaire" : "Collaborateur"}
                    </Text>
                </View>
                <View className="mt-5">
                    <Button title="Se déconnecter" onPress={signOut} variant="secondary" />
                </View>
            </View>
        </View>
    );
}