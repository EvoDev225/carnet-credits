import { router } from "expo-router";
import { useRef, useState } from "react";
import { Text, type TextInputInstance } from "react-native";
import Button from "../../components/ui/Button";
import FormScreen from "../../components/ui/FormScreen";
import PasswordInput from "../../components/ui/PasswordInput";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage, getFieldErrors } from "../../lib/errors";
import { hapticError, hapticSuccess } from "../../lib/haptics";

export default function PasswordScreen() {
    const { changePassword } = useAuth();
    const toast = useToast();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const newRef = useRef<TextInputInstance>(null);
    const confirmRef = useRef<TextInputInstance>(null);

    const handleSubmit = async () => {
        if (loading) return;
        setError(null);
        if (!currentPassword || !newPassword) {
            setFieldErrors({});
            setError("Renseigne ton mot de passe actuel et le nouveau");
            return;
        }
        if (newPassword.length < 8) {
            setFieldErrors({ newPassword: "Le mot de passe doit contenir au moins 8 caractères" });
            return;
        }
        if (newPassword !== confirmation) {
            setFieldErrors({ confirmation: "Les deux mots de passe ne correspondent pas" });
            return;
        }
        setFieldErrors({});
        setLoading(true);
        try {
            await changePassword(currentPassword, newPassword);
            hapticSuccess();
            toast("Mot de passe modifié, tes autres appareils ont été déconnectés");
            router.back();
        } catch (err) {
            hapticError();
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
        <FormScreen>
            <PasswordInput
                label="Mot de passe actuel"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                autoComplete="current-password"
                returnKeyType="next"
                onSubmitEditing={() => newRef.current?.focus()}
                error={fieldErrors.currentPassword}
                editable={!loading}
            />
            <PasswordInput
                ref={newRef}
                label="Nouveau mot de passe"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="8 caractères minimum"
                autoComplete="new-password"
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
                error={fieldErrors.newPassword}
                editable={!loading}
            />
            <PasswordInput
                ref={confirmRef}
                label="Confirme le nouveau mot de passe"
                value={confirmation}
                onChangeText={setConfirmation}
                autoComplete="new-password"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                error={fieldErrors.confirmation}
                editable={!loading}
            />
            {error ? (
                <Text accessibilityRole="alert" className="text-center font-jakarta text-sm text-debt">
                    {error}
                </Text>
            ) : null}
            <Button title="Changer mon mot de passe" onPress={handleSubmit} loading={loading} />
        </FormScreen>
    );
}
