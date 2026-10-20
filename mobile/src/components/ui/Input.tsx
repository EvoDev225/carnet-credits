import { useState, type ReactNode, type Ref } from "react";
import { Text, TextInput, View, type TextInputInstance, type TextInputProps } from "react-native";
import { colors } from "../../lib/theme";

type InputProps = TextInputProps & {
    ref?: Ref<TextInputInstance>;
    label: string;
    error?: string;
    // Élément affiché à droite du champ (ex. bouton afficher / masquer)
    right?: ReactNode;
};

export default function Input({ label, error, right, onFocus, onBlur, style, ...rest }: InputProps) {
    const [isFocused, setIsFocused] = useState(false);

    const borderClass = error
        ? "border-debt"
        : isFocused
            ? "border-brand"
            : "border-line";

    return (
        <View className="w-full">
            <Text className="mb-2 font-jakarta-semibold text-sm text-ink">{label}</Text>
            {/* Hauteur minimale et non fixe : le texte n'est pas coupé avec les grandes polices */}
            <View className={`min-h-12 flex-row items-center rounded-control border bg-surface ${borderClass}`}>
                <TextInput
                    accessibilityLabel={label}
                    placeholderTextColor={colors.muted}
                    {...rest}
                    onFocus={(e) => {
                        setIsFocused(true);
                        onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        setIsFocused(false);
                        onBlur?.(e);
                    }}
                    style={[{ paddingVertical: 12 }, style]}
                    className="flex-1 px-4 font-jakarta text-base text-ink"
                />
                {right}
            </View>
            {error ? (
                <Text accessibilityRole="alert" className="mt-1 font-jakarta text-xs text-debt">
                    {error}
                </Text>
            ) : null}
        </View>
    );
}
