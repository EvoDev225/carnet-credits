import { ActivityIndicator, Text } from "react-native";
import { colors } from "../../lib/theme";
import PressableScale from "./PressableScale";

type ButtonProps = {
    title: string;
    onPress: () => void;
    variant?: "primary" | "secondary" | "danger";
    loading?: boolean;
    disabled?: boolean;
    accessibilityHint?: string;
};

const variants = {
    primary: { container: "bg-brand", text: "text-white", spinner: colors.white },
    secondary: { container: "border border-line bg-surface", text: "text-navy", spinner: colors.navy },
    danger: { container: "border border-debt bg-surface", text: "text-debt", spinner: colors.debt },
};

export default function Button({
    title,
    onPress,
    variant = "primary",
    loading = false,
    disabled = false,
    accessibilityHint,
}: ButtonProps) {
    const isDisabled = disabled || loading;
    const style = variants[variant];

    return (
        <PressableScale
            onPress={() => onPress()}
            disabled={isDisabled}
            accessibilityRole="button"
            accessibilityLabel={title}
            accessibilityHint={accessibilityHint}
            accessibilityState={{ disabled: isDisabled, busy: loading }}
            className={`min-h-[48px] flex-row items-center justify-center rounded-control px-6 py-3 ${style.container} ${
                isDisabled ? "opacity-50" : ""
            }`}
        >
            {loading ? (
                <ActivityIndicator color={style.spinner} />
            ) : (
                <Text className={`text-center font-jakarta-bold text-base ${style.text}`}>{title}</Text>
            )}
        </PressableScale>
    );
}
