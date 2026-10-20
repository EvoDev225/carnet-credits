import { Pressable, Text, View } from "react-native";

export default function FilterChips<T extends string>({
    options,
    value,
    onChange,
}: {
    options: { value: T; label: string }[];
    value: T;
    onChange: (value: T) => void;
}) {
    return (
        <View className="flex-row gap-2">
            {options.map((option) => {
                const selected = option.value === value;
                return (
                    <Pressable
                        key={option.value}
                        onPress={() => onChange(option.value)}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        className={`min-h-[44px] items-center justify-center rounded-chip border px-4 ${selected ? "border-navy bg-navy" : "border-line bg-surface"
                            }`}
                    >
                        <Text
                            className={`font-jakarta-semibold text-sm ${selected ? "text-white" : "text-ink"
                                }`}
                        >
                            {option.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}