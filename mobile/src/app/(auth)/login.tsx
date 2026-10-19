import { useState } from "react";
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../lib/types";

function getLoginErrorMessage(err: unknown): string {
    if (err instanceof ApiError) {
        if (err.status === 401) return "Téléphone ou mot de passe incorrect";
        if (err.status === 0) return err.message;
    }
    return "Une erreur est survenue, réessaie";
}

export default function Login() {
    const insets = useSafeAreaInsets();
    const { signIn } = useAuth();

    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (loading) return;

        if (!phone.trim() || !password) {
            setError("Renseigne ton téléphone et ton mot de passe");
            return;
        }

        setError(null);
        setLoading(true);
        try {
            await signIn(phone.trim(), password);
        } catch (err) {
            setError(getLoginErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="flex-1 bg-canvas"
        >
            <ScrollView
                contentContainerClassName="flex-grow"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View
                    className="h-[290px] items-center rounded-b-[28px] bg-navy"
                    style={{ paddingTop: insets.top + 16 }}
                >
                    <Text className="font-jakarta-extrabold text-xl text-white">
                        Carnet de crédits
                    </Text>
                    <View
                        pointerEvents="none"
                        className="absolute left-0 right-0 top-[99px] items-center"
                    >
                        <View className="h-[156px] w-[156px] rounded-full bg-navy-light" />
                    </View>
                </View>

                <View className="-mt-14 px-6" style={{ paddingBottom: insets.bottom + 24 }}>
                    <View className="rounded-2xl border border-line bg-white p-6">
                        <View
                            pointerEvents="none"
                            className="absolute -top-[122px] left-0 right-0 items-center"
                        >
                            <Image
                                source={require("../../../assets/images/ecureuil.png")}
                                className="h-[130px] w-[117px]"
                                resizeMode="contain"
                            />
                        </View>

                        <Text className="mb-5 mt-2 text-center font-jakarta-extrabold text-xl text-navy">
                            Connexion
                        </Text>

                        <View className="gap-4">
                            <Input
                                label="Téléphone"
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="Ex : 0700000000"
                                keyboardType="phone-pad"
                                autoComplete="tel"
                                editable={!loading}
                            />
                            <Input
                                label="Mot de passe"
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Ton mot de passe"
                                secureTextEntry
                                autoCapitalize="none"
                                autoComplete="current-password"
                                returnKeyType="go"
                                onSubmitEditing={handleLogin}
                                editable={!loading}
                            />

                            {error ? (
                                <Text
                                    accessibilityRole="alert"
                                    className="text-center font-jakarta text-sm text-debt"
                                >
                                    {error}
                                </Text>
                            ) : null}

                            <Button title="Se connecter" onPress={handleLogin} loading={loading} />
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}