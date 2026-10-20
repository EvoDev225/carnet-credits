import { Text, View } from "react-native";

// Intertitre de liste (ex. « Aujourd'hui », « Hier », « 12 octobre »)
export default function SectionHeader({ title }: { title: string }) {
    return (
        <View accessibilityRole="header" className="bg-canvas px-4 pb-2 pt-4">
            <Text className="font-jakarta-bold text-sm text-muted">{title}</Text>
        </View>
    );
}
