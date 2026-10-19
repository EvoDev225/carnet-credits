import { Text, View } from "react-native";
import { getInitials } from "../../lib/format";

export default function Avatar({ name, size = 44 }: { name: string; size?: number }) {
    return (
        <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className="items-center justify-center bg-avatar"
            style={{ width: size, height: size, borderRadius: size / 2 }}
        >
            <Text style={{ fontSize: size * 0.36 }} className="font-jakarta-bold text-navy">{getInitials(name)}</Text>
        </View>
    );
}