import { router } from "expo-router";
import { useRef, useState } from "react";
import { Text, type TextInputInstance } from "react-native";
import Button from "../../../components/ui/Button";
import FormScreen from "../../../components/ui/FormScreen";
import Input from "../../../components/ui/Input";
import { useCreateStaff } from "../../../hooks/useStaff";
import { getErrorMessage, getFieldErrors } from "../../../lib/errors";

export default function NewStaffScreen() {
    const createStaff = useCreateStaff();
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [localError, setLocalError] = useState<string | null>(null);
    const phoneRef = useRef<TextInputInstance>(null);
    const passwordRef = useRef<TextInputInstance>(null);

    const fieldErrors = getFieldErrors(createStaff.error);
    const globalError =
        localError ??
        (createStaff.error && Object.keys(fieldErrors).length === 0 ? getErrorMessage(createStaff.error) : null);

    const handleSubmit = () => {
        if (createStaff.isPending) return;
        if (!name.trim() || !phone.trim() || !password) {
            setLocalError("Tous les champs sont requis");
            return;
        }
        if (password.length < 8) {
            setLocalError("Le mot de passe doit contenir au moins 8 caractères");
            return;
        }
        setLocalError(null);
        createStaff.mutate(
            { name: name.trim(), phone: phone.trim(), password },
            { onSuccess: () => router.back() }
        );
    };

    return (
        <FormScreen>
            <Input
                label="Nom"
                value={name}
                onChangeText={setName}
                placeholder="Ex : Moussa Traoré"
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => phoneRef.current?.focus()}
                error={fieldErrors.name}
                editable={!createStaff.isPending}
            />
            <Input
                ref={phoneRef}
                label="Téléphone"
                value={phone}
                onChangeText={setPhone}
                placeholder="Ex : 07 00 00 00 00"
                keyboardType="phone-pad"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                error={fieldErrors.phone}
                editable={!createStaff.isPending}
            />
            <Input
                ref={passwordRef}
                label="Mot de passe provisoire"
                value={password}
                onChangeText={setPassword}
                placeholder="8 caractères minimum"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                error={fieldErrors.password}
                editable={!createStaff.isPending}
            />
            <Text className="font-jakarta text-xs text-muted">
                Communique-lui ce mot de passe : il pourra le changer depuis son profil.
            </Text>
            {globalError ? (
                <Text accessibilityRole="alert" className="text-center font-jakarta text-sm text-debt">
                    {globalError}
                </Text>
            ) : null}
            <Button title="Ajouter le collaborateur" onPress={handleSubmit} loading={createStaff.isPending} />
        </FormScreen>
    );
}
