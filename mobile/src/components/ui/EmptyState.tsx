import { Image, Text, View } from "react-native";
import Button from "./Button";

export default function EmptyState({
    title,
    message,
    actionLabel,
    onAction,
}: {
    title: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
}) {
    return (
        <View className="items-center justify-center gap-3 py-16">
            <Image
                source={require("../../../assets/images/mascotte.png")}
                style={{ width: 90, height: 100 }}
                resizeMode="contain"
            />
            <Text className="text-center font-jakarta-bold text-lg text-navy">{title}</Text>
            <Text className="text-center font-jakarta text-muted">{message}</Text>
            {actionLabel && onAction ? (
                <Button title={actionLabel} onPress={onAction} variant="secondary" />
            ) : null}
        </View>
    );
}