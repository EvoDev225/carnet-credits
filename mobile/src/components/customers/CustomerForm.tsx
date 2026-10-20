import { useRef, useState } from "react";
import { Text, type TextInputInstance } from "react-native";
import { getErrorMessage, getFieldErrors } from "../../lib/errors";
import { formatPhone } from "../../lib/format";
import type { Customer, CustomerInput } from "../../lib/types";
import Button from "../ui/Button";
import FormScreen from "../ui/FormScreen";
import Input from "../ui/Input";

type CustomerFormProps = {
    initial?: Customer;
    submitLabel: string;
    isPending: boolean;
    error: unknown;
    onSubmit: (input: CustomerInput) => void;
};

// Partagé entre la création et la modification d'un client
export default function CustomerForm({ initial, submitLabel, isPending, error, onSubmit }: CustomerFormProps) {
    const [name, setName] = useState(initial?.name ?? "");
    const [phone, setPhone] = useState(formatPhone(initial?.phone));
    const [note, setNote] = useState(initial?.note ?? "");
    const [localError, setLocalError] = useState<string | null>(null);
    const phoneRef = useRef<TextInputInstance>(null);
    const noteRef = useRef<TextInputInstance>(null);

    const fieldErrors = getFieldErrors(error);
    const globalError = localError ?? (error && Object.keys(fieldErrors).length === 0 ? getErrorMessage(error) : null);

    const handleSubmit = () => {
        if (isPending) return;
        if (!name.trim()) {
            setLocalError("Le nom du client est requis");
            return;
        }
        setLocalError(null);
        onSubmit({ name: name.trim(), phone: phone.trim(), note: note.trim() });
    };

    return (
        <FormScreen>
            <Input
                label="Nom"
                value={name}
                onChangeText={setName}
                placeholder="Ex : Awa Koné"
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => phoneRef.current?.focus()}
                error={fieldErrors.name}
                editable={!isPending}
            />
            <Input
                ref={phoneRef}
                label="Téléphone (facultatif)"
                value={phone}
                onChangeText={setPhone}
                placeholder="Ex : 07 00 00 00 00"
                keyboardType="phone-pad"
                returnKeyType="next"
                onSubmitEditing={() => noteRef.current?.focus()}
                error={fieldErrors.phone}
                editable={!isPending}
            />
            <Input
                ref={noteRef}
                label="Note (facultatif)"
                value={note}
                onChangeText={setNote}
                placeholder="Ex : paie en fin de mois"
                maxLength={500}
                error={fieldErrors.note}
                editable={!isPending}
            />
            {globalError ? (
                <Text accessibilityRole="alert" className="text-center font-jakarta text-sm text-debt">
                    {globalError}
                </Text>
            ) : null}
            <Button title={submitLabel} onPress={handleSubmit} loading={isPending} />
        </FormScreen>
    );
}
