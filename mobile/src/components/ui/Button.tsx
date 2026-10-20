import { ActivityIndicator, Pressable, Text } from "react-native";
import { colors } from "../../lib/theme";

type ButtonProps = {
    title: string;
    onPress: () => void;
    variant?: "primary" | "secondary" | "danger";
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
    const containerClass = isPrimary
        ? "bg-brand"
        : variant === "danger"
            ? "border border-debt bg-white"
            : "border border-line bg-white";
    const textClass = isPrimary ? "text-white" : variant === "danger" ? "text-debt" : "text-navy";

    return (
        <Pressable
            onPress={() => onPress()}
            disabled={isDisabled}
            accessibilityRole="button"
            accessibilityState={{ disabled: isDisabled, busy: loading }}
            className={`min-h-[48px] flex-row items-center justify-center rounded-xl px-6 ${containerClass} ${isDisabled ? "opacity-50" : "active:opacity-80"}`}
        >
            {loading ? (
                <ActivityIndicator color={isPrimary ? colors.white : variant === "danger" ? colors.debt : colors.navy} />
            ) : (
                <Text
                    className={`font-jakarta-bold text-base ${textClass}`}
                >
                    {title}
                </Text>
            )}
        </Pressable>
    );
}