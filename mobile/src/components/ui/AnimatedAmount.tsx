import { useEffect, useRef, useState } from "react";
import { Text, type StyleProp, type TextStyle } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { formatFcfa } from "../../lib/format";
import { tabularNums } from "../../lib/theme";

const DURATION_MS = 600;

// Montant qui « compte » jusqu'à sa nouvelle valeur après une opération.
// Valeur affichée directement si « Réduire les animations » est activé.
export default function AnimatedAmount({
    value,
    className,
    style,
    accessibilityLabel,
}: {
    value: number;
    className?: string;
    style?: StyleProp<TextStyle>;
    accessibilityLabel?: string;
}) {
    const reduceMotion = useReducedMotion();
    const [displayed, setDisplayed] = useState(value);
    const fromRef = useRef(value);

    useEffect(() => {
        const from = fromRef.current;
        fromRef.current = value;
        if (reduceMotion || from === value) {
            setDisplayed(value);
            return;
        }

        let frame = 0;
        const start = Date.now();
        const tick = () => {
            const progress = Math.min(1, (Date.now() - start) / DURATION_MS);
            const eased = 1 - (1 - progress) ** 3;
            setDisplayed(Math.round(from + (value - from) * eased));
            if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [value, reduceMotion]);

    return (
        <Text
            accessibilityLabel={accessibilityLabel ?? formatFcfa(value)}
            className={className}
            style={[tabularNums, style]}
        >
            {formatFcfa(displayed)}
        </Text>
    );
}
