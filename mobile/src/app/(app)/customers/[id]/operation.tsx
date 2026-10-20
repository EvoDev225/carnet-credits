import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Button from "../../../../components/ui/Button";
import FilterChips from "../../../../components/ui/FilterChips";
import FormScreen from "../../../../components/ui/FormScreen";
import Input from "../../../../components/ui/Input";
import { useAuth } from "../../../../context/AuthContext";
import { useCreateTransaction, useCustomer } from "../../../../hooks/useCustomer";
import { getErrorMessage } from "../../../../lib/errors";
import { formatFcfa, formatNumber, parseAmount } from "../../../../lib/format";
import type { TransactionType } from "../../../../lib/types";

const MAX_AMOUNT = 100_000_000;

export default function OperationScreen() {
    const params = useLocalSearchParams<{ id: string; type?: string }>();
    const id = params.id;
    const { user } = useAuth();
    const isOwner = user?.role === "owner";
    const customer = useCustomer(id);
    const createTransaction = useCreateTransaction(id);

    // Un collaborateur n'enregistre que des dettes (matrice des droits)
    const [type, setType] = useState<TransactionType>(isOwner && params.type === "PAYMENT" ? "PAYMENT" : "DEBT");
    const [amount, setAmount] = useState(0);
    const [description, setDescription] = useState("");
    const [error, setError] = useState<string | null>(null);

    const balance = customer.data?.balance ?? 0;
    const isPayment = type === "PAYMENT";

    const typeOptions: { value: TransactionType; label: string }[] = isOwner
        ? [
              { value: "DEBT", label: "Dette" },
              { value: "PAYMENT", label: "Remboursement" },
          ]
        : [{ value: "DEBT", label: "Dette" }];

    const handleSubmit = () => {
        if (createTransaction.isPending) return;
        if (amount < 1) {
            setError("Saisis un montant");
            return;
        }
        if (amount > MAX_AMOUNT) {
            setError(`Le montant ne peut pas dépasser ${formatFcfa(MAX_AMOUNT)}`);
            return;
        }
        if (isPayment && amount > balance) {
            setError(`Le remboursement dépasse le solde (${formatFcfa(balance)})`);
            return;
        }
        setError(null);
        createTransaction.mutate(
            { type, amount, description: description.trim() || undefined },
            {
                onSuccess: () => router.back(),
                onError: (mutationError) => setError(getErrorMessage(mutationError)),
            }
        );
    };

    return (
        <FormScreen>
            {customer.data ? (
                <View className="items-center">
                    <Text className="font-jakarta-bold text-lg text-navy">{customer.data.name}</Text>
                    <Text className="font-jakarta text-sm text-muted">{`Solde actuel : ${formatFcfa(balance)}`}</Text>
                </View>
            ) : null}

            <FilterChips options={typeOptions} value={type} onChange={setType} />

            <Input
                label="Montant (FCFA)"
                value={amount > 0 ? formatNumber(amount) : ""}
                onChangeText={(text) => setAmount(parseAmount(text))}
                placeholder="0"
                keyboardType="number-pad"
                autoFocus
                editable={!createTransaction.isPending}
                style={{ fontVariant: ["tabular-nums"] }}
            />

            {isPayment && balance > 0 ? (
                <Pressable
                    onPress={() => setAmount(balance)}
                    accessibilityRole="button"
                    className="min-h-[44px] items-center justify-center self-start rounded-[10px] border border-line bg-white px-4 active:bg-avatar/40"
                >
                    <Text className="font-jakarta-semibold text-sm text-brand">
                        {`Tout rembourser (${formatFcfa(balance)})`}
                    </Text>
                </Pressable>
            ) : null}

            <Input
                label="Description (facultatif)"
                value={description}
                onChangeText={setDescription}
                placeholder={isPayment ? "Ex : paiement en espèces" : "Ex : riz 5 kg, huile"}
                maxLength={200}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                editable={!createTransaction.isPending}
            />

            {error ? (
                <Text accessibilityRole="alert" className="text-center font-jakarta text-sm text-debt">
                    {error}
                </Text>
            ) : null}

            <Button
                title={isPayment ? "Enregistrer le remboursement" : "Enregistrer la dette"}
                onPress={handleSubmit}
                loading={createTransaction.isPending}
            />
        </FormScreen>
    );
}
