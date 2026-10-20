import { router } from "expo-router";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View, type TextInputInstance } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage, getFieldErrors } from "../../lib/errors";

type Fields = "shopName" | "name" | "phone" | "password" | "confirmation";

export default function Register() {
    const insets = useSafeAreaInsets();
    const { signUp } = useAuth();

    const [shopName, setShopName] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<Fields, string>>>({});
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const nameRef = useRef<TextInputInstance>(null);
    const phoneRef = useRef<TextInputInstance>(null);
    const passwordRef = useRef<TextInputInstance>(null);
    const confirmRef = useRef<TextInputInstance>(null);

    const validate = (): Partial<Record<Fields, string>> => {
        const errors: Partial<Record<Fields, string>> = {};
        if (!shopName.trim()) errors.shopName = "Le nom de la boutique est requis";
        if (!name.trim()) errors.name = "Ton nom est requis";
        if (!phone.trim()) errors.phone = "Le téléphone est requis";
        if (password.length < 8) errors.password = "Le mot de passe doit contenir au moins 8 caractères";
        if (password !== confirmation) errors.confirmation = "Les deux mots de passe ne correspondent pas";
        return errors;
    };

    const handleRegister = async () => {
        if (loading) return;
        setError(null);
        const errors = validate();
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setLoading(true);
        try {
            // En cas de succès, l'utilisateur est connecté et redirigé automatiquement
            await signUp({ shopName: shopName.trim(), name: name.trim(), phone: phone.trim(), password });
        } catch (err) {
            const fields = getFieldErrors(err);
            setFieldErrors(fields);
            if (Object.keys(fields).length === 0) {
                setError(getErrorMessage(err));
            }
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
                <View
                    className="h-[160px] items-center rounded-b-[28px] bg-navy px-5"
                    style={{ paddingTop: insets.top + 16 }}
                >
                    <Text className="font-jakarta-extrabold text-xl text-white">Carnet de crédits</Text>
                    <Text className="mt-1 text-center font-jakarta text-sm text-white/70">
                        Crée ta boutique en une minute
                    </Text>
                </View>

                <View className="-mt-12 px-6" style={{ paddingBottom: insets.bottom + 24 }}>
                    <View className="gap-4 rounded-2xl border border-line bg-white p-6">
                        <Text className="text-center font-jakarta-extrabold text-xl text-navy">Inscription</Text>

                        <Input
                            label="Nom de la boutique"
                            value={shopName}
                            onChangeText={setShopName}
                            placeholder="Ex : Boutique Awa"
                            autoCapitalize="words"
                            returnKeyType="next"
                            onSubmitEditing={() => nameRef.current?.focus()}
                            error={fieldErrors.shopName}
                            editable={!loading}
                        />
                        <Input
                            ref={nameRef}
                            label="Ton nom"
                            value={name}
                            onChangeText={setName}
                            placeholder="Ex : Awa Koné"
                            autoCapitalize="words"
                            autoComplete="name"
                            returnKeyType="next"
                            onSubmitEditing={() => phoneRef.current?.focus()}
                            error={fieldErrors.name}
                            editable={!loading}
                        />
                        <Input
                            ref={phoneRef}
                            label="Téléphone"
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="Ex : 07 00 00 00 00"
                            keyboardType="phone-pad"
                            autoComplete="tel"
                            returnKeyType="next"
                            onSubmitEditing={() => passwordRef.current?.focus()}
                            error={fieldErrors.phone}
                            editable={!loading}
                        />
                        <Input
                            ref={passwordRef}
                            label="Mot de passe"
                            value={password}
                            onChangeText={setPassword}
                            placeholder="8 caractères minimum"
                            secureTextEntry
                            autoCapitalize="none"
                            autoComplete="new-password"
                            returnKeyType="next"
                            onSubmitEditing={() => confirmRef.current?.focus()}
                            error={fieldErrors.password}
                            editable={!loading}
                        />
                        <Input
                            ref={confirmRef}
                            label="Confirme le mot de passe"
                            value={confirmation}
                            onChangeText={setConfirmation}
                            secureTextEntry
                            autoCapitalize="none"
                            autoComplete="new-password"
                            returnKeyType="go"
                            onSubmitEditing={handleRegister}
                            error={fieldErrors.confirmation}
                            editable={!loading}
                        />

                        {error ? (
                            <Text accessibilityRole="alert" className="text-center font-jakarta text-sm text-debt">
                                {error}
                            </Text>
                        ) : null}

                        <Button title="Créer ma boutique" onPress={handleRegister} loading={loading} />
                    </View>

                    <View className="mt-6 items-center gap-1">
                        <Text className="font-jakarta text-muted">Déjà un compte ?</Text>
                        <Pressable
                            onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
                            accessibilityRole="link"
                            className="min-h-[44px] justify-center px-4"
                        >
                            <Text className="font-jakarta-bold text-base text-brand">Se connecter</Text>
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
