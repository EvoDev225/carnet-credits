import { useState } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";
import { colors } from "../../lib/theme";

type InputProps = TextInputProps & {
    label: string;
    error?: string;
};

export default function Input({ label, error, onFocus, onBlur, ...rest }: InputProps) {
    const [isFocused, setIsFocused] = useState(false);

    const borderClass = error
        ? "border-debt"
        : isFocused
            ? "border-brand"
            : "border-line";

    return (
        <View className="w-full">
            <Text className="mb-2 font-jakarta-semibold text-sm text-ink">{label}</Text>
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
                className={`h-12 rounded-xl border bg-white px-4 font-jakarta text-base text-ink ${borderClass}`}
            />
            {error ? (
                <Text accessibilityRole="alert" className="mt-1 font-jakarta text-xs text-debt">
                    {error}
                </Text>
            ) : null}
        </View>
    );
}