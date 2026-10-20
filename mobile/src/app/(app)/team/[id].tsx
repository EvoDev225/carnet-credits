import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import { useConfirm } from "../../../components/ui/ConfirmDialog";
import ErrorState from "../../../components/ui/ErrorState";
import FormScreen from "../../../components/ui/FormScreen";
import ListSkeleton from "../../../components/ui/ListSkeleton";
import PasswordInput from "../../../components/ui/PasswordInput";
import { useToast } from "../../../components/ui/Toast";
import { useStaff, useUpdateStaff } from "../../../hooks/useStaff";
import { getErrorMessage, getFieldErrors } from "../../../lib/errors";
import { formatPhone } from "../../../lib/format";
import { hapticError, hapticSuccess } from "../../../lib/haptics";
import { ApiError } from "../../../lib/types";

export default function StaffScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const staffList = useStaff();
    const updateStaff = useUpdateStaff(id);
    const confirm = useConfirm();
    const toast = useToast();
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
                    error={staffList.isError ? staffList.error : new ApiError(404, "Collaborateur introuvable")}
                    onRetry={staffList.refetch}
                />
            </View>
        );
    }

    const toggleActive = async () => {
        const nextActive = !staff.active;
        const accepted = await confirm({
            title: nextActive ? "Réactiver ce collaborateur ?" : "Désactiver ce collaborateur ?",
            message: nextActive
                ? `${staff.name} pourra de nouveau se connecter.`
                : `${staff.name} sera déconnecté de tous ses appareils et ne pourra plus se connecter.`,
            confirmLabel: nextActive ? "Réactiver" : "Désactiver",
            destructive: !nextActive,
        });
        if (!accepted) return;
        updateStaff.mutate(
            { active: nextActive },
            {
                onSuccess: () => {
                    hapticSuccess();
                    toast(nextActive ? `${staff.name} est réactivé` : `${staff.name} est désactivé`);
                },
                onError: (error) => {
                    hapticError();
                    toast(getErrorMessage(error), "error");
                },
            }
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
                    hapticSuccess();
                    toast(`Mot de passe réinitialisé, ${staff.name} a été déconnecté`);
                },
                onError: (error) => {
                    hapticError();
                    setPasswordError(getFieldErrors(error).password ?? getErrorMessage(error));
                },
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
                <View className="mt-2">
                    {staff.active ? (
                        <Badge tone="payment" icon="checkmark-circle" label="Actif" />
                    ) : (
                        <Badge tone="muted" icon="pause-circle" label="Désactivé" />
                    )}
                </View>
            </View>

            <Button
                title={staff.active ? "Désactiver" : "Réactiver"}
                variant={staff.active ? "danger" : "secondary"}
                onPress={toggleActive}
                loading={updateStaff.isPending && updateStaff.variables?.active !== undefined}
            />

            <View className="gap-3 border-t border-line pt-4">
                <Text accessibilityRole="header" className="font-jakarta-bold text-base text-navy">
                    Réinitialiser le mot de passe
                </Text>
                <PasswordInput
                    label="Nouveau mot de passe"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="8 caractères minimum"
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
