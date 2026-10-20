import { Pressable, Text, View } from "react-native";

// Choix exclusif entre quelques options (ex. Dette / Remboursement)
export default function SegmentedControl<T extends string>({
    options,
    value,
    onChange,
    disabled = false,
}: {
    options: { value: T; label: string }[];
    value: T;
    onChange: (value: T) => void;
    disabled?: boolean;
}) {
    return (
        <View accessibilityRole="radiogroup" className="flex-row gap-1 rounded-control border border-line bg-canvas p-1">
            {options.map((option) => {
                const selected = option.value === value;
                return (
                    <Pressable
                        key={option.value}
                        onPress={() => onChange(option.value)}
                        disabled={disabled}
                        accessibilityRole="radio"
                        accessibilityState={{ selected, checked: selected, disabled }}
                        className={`min-h-[44px] flex-1 items-center justify-center rounded-chip px-3 py-2 ${
                            selected ? "bg-navy" : "active:bg-avatar"
                        }`}
                    >
                        <Text
                            className={`text-center font-jakarta-semibold text-sm ${selected ? "text-white" : "text-ink"}`}
                        >
                            {option.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}
