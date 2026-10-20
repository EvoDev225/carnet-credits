import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";

type PressableScaleProps = PressableProps & {
    className?: string;
    // Style du conteneur animé (ex. positionnement absolu d'un bouton flottant)
    containerStyle?: StyleProp<ViewStyle>;
};

// Pressable qui se contracte légèrement à l'appui (désactivé si « Réduire les animations »)
export default function PressableScale({ containerStyle, onPressIn, onPressOut, ...rest }: PressableScaleProps) {
    const reduceMotion = useReducedMotion();
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

    return (
        <Animated.View style={[containerStyle, animatedStyle]}>
            <Pressable
                {...rest}
                onPressIn={(event) => {
                    if (!reduceMotion) scale.set(withTiming(0.97, { duration: 80 }));
                    onPressIn?.(event);
                }}
                onPressOut={(event) => {
                    scale.set(withTiming(1, { duration: 120 }));
                    onPressOut?.(event);
                }}
            />
        </Animated.View>
    );
}
