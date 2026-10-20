import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";

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

// Lignes fantômes pendant le chargement, avec une pulsation douce (figée si
// « Réduire les animations » est activé)
export default function ListSkeleton({ count = 6 }: { count?: number }) {
    const reduceMotion = useReducedMotion();
    const opacity = useSharedValue(1);

    useEffect(() => {
        if (reduceMotion) return;
        opacity.set(withRepeat(withTiming(0.45, { duration: 750, easing: Easing.inOut(Easing.ease) }), -1, true));
    }, [opacity, reduceMotion]);

    const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

    return (
        <Animated.View accessible accessibilityLabel="Chargement en cours" style={animatedStyle}>
            {Array.from({ length: count }, (_, index) => (
                <SkeletonRow key={index} />
            ))}
        </Animated.View>
    );
}
