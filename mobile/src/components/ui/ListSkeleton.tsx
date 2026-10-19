import { View } from "react-native";

function SkeletonRow() {
    return (
        <View className="flex-row items-center gap-3 border-b border-line py-3">
            <View className="h-11 w-11 rounded-full bg-line" />
            <View className="flex-1 gap-2">
                <View className="h-3 w-2/3 rounded-full bg-line" />
                <View className="h-3 w-1/3 rounded-full bg-line" />
            </View>
            <View className="h-3 w-12 rounded-full bg-line" />
        </View>
    );
}

export default function ListSkeleton({ count = 6 }: { count?: number }) {
    return (
        <View accessibilityLabel="Chargement en cours">
            {Array.from({ length: count }, (_, index) => (
                <SkeletonRow key={index} />
            ))}
        </View>
    );
}