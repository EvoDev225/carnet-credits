import { ActivityIndicator, Pressable, Text } from "react-native";
import { colors } from "../../lib/theme";

type ButtonProps = {
    title: string;
    onPress: () => void;
    variant?: "primary" | "secondary";
    loading?: boolean;
    disabled?: boolean;
};

export default function Button({
    title,
    onPress,
    variant = "primary",
    loading = false,
    disabled = false,
}: ButtonProps) {
    const isDisabled = disabled || loading;
    const isPrimary = variant === "primary";

    return (
        <Pressable
            onPress={() => onPress()}
            disabled={isDisabled}
            accessibilityRole="button"
            accessibilityState={{ disabled: isDisabled, busy: loading }}
            className={`min-h-[48px] flex-row items-center justify-center rounded-xl px-6 ${isPrimary ? "bg-brand" : "border border-line bg-white"
                } ${isDisabled ? "opacity-50" : "active:opacity-80"}`}
        >
            {loading ? (
                <ActivityIndicator color={isPrimary ? colors.white : colors.navy} />
            ) : (
                <Text
                    className={`font-jakarta-bold text-base ${isPrimary ? "text-white" : "text-navy"
                        }`}
                >
                    {title}
                </Text>
            )}
        </Pressable>
    );
}