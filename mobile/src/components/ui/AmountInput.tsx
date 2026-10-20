import { Pressable, Text, TextInput, View } from "react-native";
import { formatFcfa, formatNumber, parseAmount } from "../../lib/format";
import { colors, tabularNums } from "../../lib/theme";

const QUICK_AMOUNTS = [500, 1000, 5000];

// Saisie d'un montant en FCFA : pavé numérique, formatage en direct, montants rapides
export default function AmountInput({
    value,
    onChange,
    label = "Montant",
    error,
    editable = true,
    autoFocus = false,
}: {
    value: number;
    onChange: (value: number) => void;
    label?: string;
    error?: string;
    editable?: boolean;
    autoFocus?: boolean;
}) {
    return (
        <View className="gap-3">
            <Text className="font-jakarta-semibold text-sm text-ink">{label}</Text>
            <View
                className={`min-h-16 flex-row items-center justify-center gap-2 rounded-control border bg-surface px-4 ${
                    error ? "border-debt" : "border-line"
                }`}
            >
                <TextInput
                    accessibilityLabel={`${label} en FCFA`}
                    value={value > 0 ? formatNumber(value) : ""}
                    onChangeText={(text) => onChange(parseAmount(text))}
                    placeholder="0"
                    placeholderTextColor={colors.muted}
                    keyboardType="number-pad"
                    autoFocus={autoFocus}
                    editable={editable}
                    maxLength={13}
                    style={[{ paddingVertical: 10, minWidth: 80 }, tabularNums]}
                    className="text-center font-jakarta-extrabold text-3xl text-navy"
                />
                <Text className="font-jakarta-bold text-lg text-muted">FCFA</Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
                {QUICK_AMOUNTS.map((amount) => (
                    <Pressable
                        key={amount}
                        onPress={() => onChange(value + amount)}
                        disabled={!editable}
                        accessibilityRole="button"
                        accessibilityLabel={`Ajouter ${formatFcfa(amount)}`}
                        className="min-h-[44px] items-center justify-center rounded-chip border border-line bg-surface px-4 active:bg-avatar"
                    >
                        <Text className="font-jakarta-semibold text-sm text-ink" style={tabularNums}>
                            {`+${formatNumber(amount)}`}
                        </Text>
                    </Pressable>
                ))}
                {value > 0 ? (
                    <Pressable
                        onPress={() => onChange(0)}
                        disabled={!editable}
                        accessibilityRole="button"
                        accessibilityLabel="Effacer le montant"
                        className="min-h-[44px] items-center justify-center rounded-chip px-4 active:bg-avatar"
                    >
                        <Text className="font-jakarta-semibold text-sm text-muted">Effacer</Text>
                    </Pressable>
                ) : null}
            </View>
            {error ? (
                <Text accessibilityRole="alert" className="font-jakarta text-xs text-debt">
                    {error}
                </Text>
            ) : null}
        </View>
    );
}
