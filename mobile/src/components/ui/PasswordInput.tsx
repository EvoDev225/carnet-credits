import { Ionicons } from "@expo/vector-icons";
import { useState, type ComponentProps } from "react";
import { Pressable } from "react-native";
import { colors } from "../../lib/theme";
import Input from "./Input";

// Champ mot de passe avec un œil pour afficher / masquer la saisie
export default function PasswordInput(props: Omit<ComponentProps<typeof Input>, "secureTextEntry" | "right">) {
    const [visible, setVisible] = useState(false);

    return (
        <Input
            autoCapitalize="none"
            autoCorrect={false}
            {...props}
            secureTextEntry={!visible}
            right={
                <Pressable
                    onPress={() => setVisible((value) => !value)}
                    accessibilityRole="button"
                    accessibilityLabel={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    className="h-11 w-11 items-center justify-center"
                >
                    <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={20} color={colors.muted} />
                </Pressable>
            }
        />
    );
}
