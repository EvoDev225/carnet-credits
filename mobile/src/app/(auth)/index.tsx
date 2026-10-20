import { useRef, useState } from "react";
import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, View, type TextInputInstance } from "react-native";
import { Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import PasswordInput from "../../components/ui/PasswordInput";
import ScreenHeader from "../../components/ui/ScreenHeader";
import { useAuth } from "../../context/AuthContext";
import { hapticError } from "../../lib/haptics";
import { ApiError } from "../../lib/types";

function getLoginErrorMessage(err: unknown): string {
    if (err instanceof ApiError) {
        if (err.status === 401) return "Téléphone ou mot de passe incorrect";
        // 429 : trop d'essais, l'API indique combien de temps attendre
        if (err.status === 429) return err.message;
        if (err.status === 0) return "Serveur injoignable. Vérifie ta connexion internet.";
        if (err.status === 400) return err.details[0]?.message ?? err.message;
    }
    return "Une erreur est survenue, réessaie";
}

export default function Login() {
    const insets = useSafeAreaInsets();
    const { signIn } = useAuth();
    const passwordRef = useRef<TextInputInstance>(null);

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
            hapticError();
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
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
            >
                <ScreenHeader
                    title="Carnet de crédits"
                    align="center"
                    minHeight={290}
                    decoration={
                        <View className="absolute left-0 right-0 top-[99px] items-center">
                            <View className="h-[156px] w-[156px] rounded-full bg-navy-light" />
                        </View>
                    }
                />

                <View className="-mt-14 px-6" style={{ paddingBottom: insets.bottom + 24 }}>
                    <View className="rounded-card border border-line bg-surface p-6">
                        <View
                            pointerEvents="none"
                            className="absolute -top-[122px] left-0 right-0 items-center"
                        >
                            <Image
                                source={require("../../../assets/images/mascotte.png")}
                                style={{ width: 117, height: 130 }}
                                resizeMode="contain"
                                accessibilityIgnoresInvertColors
                            />
                        </View>

                        <Text
                            accessibilityRole="header"
                            className="mb-5 mt-2 text-center font-jakarta-extrabold text-xl text-navy"
                        >
                            Connexion
                        </Text>

                        <View className="gap-4">
                            <Input
                                label="Téléphone"
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="Ex : 07 00 00 00 00"
                                keyboardType="phone-pad"
                                autoComplete="tel"
                                returnKeyType="next"
                                onSubmitEditing={() => passwordRef.current?.focus()}
                                editable={!loading}
                            />
                            <PasswordInput
                                ref={passwordRef}
                                label="Mot de passe"
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Ton mot de passe"
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

                    <View className="mt-6 items-center gap-1">
                        <Text className="font-jakarta text-muted">Pas encore de compte ?</Text>
                        <Link href="/register" asChild>
                            <Text
                                accessibilityRole="link"
                                className="min-h-[44px] px-4 py-2 font-jakarta-bold text-base text-brand"
                            >
                                Créer ma boutique
                            </Text>
                        </Link>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
