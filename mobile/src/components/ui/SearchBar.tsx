import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { colors } from "../../lib/theme";

export default function SearchBar({
    value,
    onChangeText,
    placeholder = "Rechercher",
}: {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
}) {
    const [focused, setFocused] = useState(false);

    return (
        <View
            className={`h-12 flex-row items-center gap-2 rounded-xl border bg-white px-3 ${focused ? "border-brand" : "border-line"
                }`}
        >
            <Ionicons name="search" size={20} color={colors.muted} />
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors.muted}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
                accessibilityLabel={placeholder}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className="flex-1 py-0 font-jakarta text-base text-ink"
            />
            {value.length > 0 ? (
                <Pressable
                    onPress={() => onChangeText("")}
                    accessibilityLabel="Effacer la recherche"
                    className="h-11 w-11 items-center justify-center"
                >
                    <Ionicons name="close-circle" size={20} color={colors.muted} />
                </Pressable>
            ) : null}
        </View>
    );
}