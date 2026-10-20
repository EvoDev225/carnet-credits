import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Text, View } from "react-native";
import Avatar from "../../../components/ui/Avatar";
import Button from "../../../components/ui/Button";
import ErrorState from "../../../components/ui/ErrorState";
import FormScreen from "../../../components/ui/FormScreen";
import Input from "../../../components/ui/Input";
import ListSkeleton from "../../../components/ui/ListSkeleton";
import { useStaff, useUpdateStaff } from "../../../hooks/useStaff";
import { getErrorMessage, getFieldErrors } from "../../../lib/errors";
import { formatPhone } from "../../../lib/format";

export default function StaffScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const staffList = useStaff();
    const updateStaff = useUpdateStaff(id);
    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState<string | null>(null);

    if (staffList.isPending) {
        return (
            <View className="flex-1 bg-canvas p-4">
                <ListSkeleton count={2} />
            </View>
        );
    }

    const staff = staffList.data?.find((item) => item.id === id);
    if (staffList.isError || !staff) {
        return (
            <View className="flex-1 bg-canvas">
                <ErrorState
                    message={staffList.isError ? getErrorMessage(staffList.error) : "Collaborateur introuvable"}
                    onRetry={staffList.refetch}
                />
            </View>
        );
    }

    const toggleActive = () => {
        const nextActive = !staff.active;
        Alert.alert(
            nextActive ? "Réactiver ce collaborateur ?" : "Désactiver ce collaborateur ?",
            nextActive
                ? `${staff.name} pourra de nouveau se connecter.`
                : `${staff.name} sera déconnecté et ne pourra plus se connecter.`,
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: nextActive ? "Réactiver" : "Désactiver",
                    style: nextActive ? "default" : "destructive",
                    onPress: () =>
                        updateStaff.mutate(
                            { active: nextActive },
                            { onError: (error) => Alert.alert("Modification impossible", getErrorMessage(error)) }
                        ),
                },
            ]
        );
    };

    const resetPassword = () => {
        if (updateStaff.isPending) return;
        if (password.length < 8) {
            setPasswordError("Le mot de passe doit contenir au moins 8 caractères");
            return;
        }
        setPasswordError(null);
        updateStaff.mutate(
            { password },
            {
                onSuccess: () => {
                    setPassword("");
                    Alert.alert("Mot de passe réinitialisé", `${staff.name} a été déconnecté de ses appareils.`);
                },
                onError: (error) =>
                    setPasswordError(getFieldErrors(error).password ?? getErrorMessage(error)),
            }
        );
    };

    return (
        <FormScreen>
            <Stack.Screen options={{ title: staff.name }} />
            <View className="items-center gap-1">
                <Avatar name={staff.name} size={64} />
                <Text className="mt-2 font-jakarta-extrabold text-xl text-navy">{staff.name}</Text>
                <Text className="font-jakarta text-muted">{formatPhone(staff.phone)}</Text>
                <View className={`mt-2 rounded-full px-3 py-1 ${staff.active ? "bg-ok/10" : "bg-debt-soft"}`}>
                    <Text className={`font-jakarta-semibold text-xs ${staff.active ? "text-ok" : "text-debt"}`}>
                        {staff.active ? "Actif" : "Désactivé"}
                    </Text>
                </View>
            </View>

            <Button
                title={staff.active ? "Désactiver" : "Réactiver"}
                variant={staff.active ? "danger" : "secondary"}
                onPress={toggleActive}
                loading={updateStaff.isPending && updateStaff.variables?.active !== undefined}
            />

            <View className="gap-3 border-t border-line pt-4">
                <Text className="font-jakarta-bold text-base text-navy">Réinitialiser le mot de passe</Text>
                <Input
                    label="Nouveau mot de passe"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="8 caractères minimum"
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="new-password"
                    returnKeyType="done"
                    onSubmitEditing={resetPassword}
                    error={passwordError ?? undefined}
                    editable={!updateStaff.isPending}
                />
                <Button
                    title="Réinitialiser"
                    variant="secondary"
                    onPress={resetPassword}
                    loading={updateStaff.isPending && updateStaff.variables?.password !== undefined}
                />
            </View>
        </FormScreen>
    );
}
