import Constants from "expo-constants";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { useConfirm } from "../../../components/ui/ConfirmDialog";
import IconButton from "../../../components/ui/IconButton";
import Input from "../../../components/ui/Input";
import ScreenHeader from "../../../components/ui/ScreenHeader";
import { useToast } from "../../../components/ui/Toast";
import { useAuth } from "../../../context/AuthContext";
import { getErrorMessage, getFieldErrors } from "../../../lib/errors";
import { formatPhone } from "../../../lib/format";
import { hapticError, hapticSuccess } from "../../../lib/haptics";

// Nom de la boutique, modifiable par le propriétaire
function ShopName() {
    const { user, renameShop } = useAuth();
    const toast = useToast();
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(user?.shop.name ?? "");
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    if (!user) return null;
    const isOwner = user.role === "owner";

    const save = async () => {
        if (saving) return;
        if (!name.trim()) {
            setError("Le nom de la boutique est requis");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await renameShop(name.trim());
            hapticSuccess();
            toast("Boutique renommée");
            setEditing(false);
        } catch (err) {
            hapticError();
            setError(getFieldErrors(err).name ?? getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    if (editing) {
        return (
            <View className="w-full gap-3">
                <Input
                    label="Nom de la boutique"
                    value={name}
                    onChangeText={setName}
                    autoFocus
                    maxLength={100}
                    returnKeyType="done"
                    onSubmitEditing={save}
                    error={error ?? undefined}
                    editable={!saving}
                />
                <View className="flex-row gap-3">
                    <View className="flex-1">
                        <Button
                            title="Annuler"
                            variant="secondary"
                            onPress={() => {
                                setEditing(false);
                                setName(user.shop.name);
                                setError(null);
                            }}
                        />
                    </View>
                    <View className="flex-1">
                        <Button title="Enregistrer" onPress={save} loading={saving} />
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View className="w-full flex-row items-center justify-between gap-3">
            <View className="flex-1">
                <Text className="font-jakarta-semibold text-sm text-muted">Boutique</Text>
                <Text className="font-jakarta-bold text-base text-ink">{user.shop.name}</Text>
            </View>
            {isOwner ? (
                <IconButton
                    icon="create-outline"
                    label="Renommer la boutique"
                    onPress={() => {
                        setName(user.shop.name);
                        setEditing(true);
                    }}
                />
            ) : null}
        </View>
    );
}

export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    const { user, signOut } = useAuth();
    const confirm = useConfirm();

    if (!user) {
        return null;
    }

    const confirmSignOut = async () => {
        const accepted = await confirm({
            title: "Se déconnecter ?",
            message: "Tu devras saisir à nouveau ton mot de passe pour revenir.",
            confirmLabel: "Se déconnecter",
            destructive: true,
        });
        if (accepted) signOut();
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-canvas">
            <ScrollView
                contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
            >
                <ScreenHeader title="Profil" minHeight={160} />

                <View className="-mt-10 mx-4">
                    <Card className="items-center gap-4">
                        <View className="items-center gap-1">
                            <Avatar name={user.name} size={72} />
                            <Text className="mt-2 text-center font-jakarta-extrabold text-xl text-navy">{user.name}</Text>
                            <Text className="font-jakarta text-muted">{formatPhone(user.phone)}</Text>
                            <View className="mt-1">
                                <Badge
                                    tone="muted"
                                    icon={user.role === "owner" ? "key-outline" : "person-outline"}
                                    label={user.role === "owner" ? "Propriétaire" : "Collaborateur"}
                                />
                            </View>
                        </View>

                        <View className="w-full border-t border-line pt-4">
                            <ShopName />
                        </View>

                        <View className="w-full gap-3 border-t border-line pt-4">
                            <Button
                                title="Changer mon mot de passe"
                                onPress={() => router.push("/password")}
                                variant="secondary"
                            />
                            <Button title="Se déconnecter" onPress={confirmSignOut} variant="danger" />
                        </View>
                    </Card>
                </View>

                <Text className="mt-6 text-center font-jakarta text-xs text-muted">
                    {`Carnet de crédits · version ${Constants.expoConfig?.version ?? "?"}`}
                </Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
