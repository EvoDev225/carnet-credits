import { Ionicons } from "@expo/vector-icons";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown, ReduceMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../lib/theme";

type ToastTone = "success" | "error";
type ToastState = { id: number; message: string; tone: ToastTone };
type ShowToast = (message: string, tone?: ToastTone) => void;

const ToastContext = createContext<ShowToast | null>(null);

const DISPLAY_MS = 2500;
const entering = FadeInDown.duration(200).reduceMotion(ReduceMotion.System);
const exiting = FadeOutDown.duration(200).reduceMotion(ReduceMotion.System);

// Bandeau de confirmation en bas de l'écran (« Opération enregistrée »…)
export function ToastProvider({ children }: { children: ReactNode }) {
    const insets = useSafeAreaInsets();
    const [toast, setToast] = useState<ToastState | null>(null);
    const counter = useRef(0);

    const show = useCallback<ShowToast>((message, tone = "success") => {
        counter.current += 1;
        setToast({ id: counter.current, message, tone });
    }, []);

    useEffect(() => {
        if (!toast) return;
        const timeout = setTimeout(() => setToast(null), DISPLAY_MS);
        return () => clearTimeout(timeout);
    }, [toast]);

    return (
        <ToastContext.Provider value={show}>
            {children}
            <View
                pointerEvents="none"
                className="absolute left-4 right-4 items-center"
                style={{ bottom: insets.bottom + 88 }}
            >
                {toast ? (
                    // Animated.View porte seulement l'animation : NativeWind ne stylise
                    // pas ses classes, le style est sur la View intérieure
                    <Animated.View key={toast.id} entering={entering} exiting={exiting}>
                        <View
                            accessibilityRole="alert"
                            accessibilityLiveRegion="polite"
                            className="max-w-[480px] flex-row items-center gap-2 rounded-control bg-navy px-4 py-3"
                        >
                            <Ionicons
                                name={toast.tone === "success" ? "checkmark-circle" : "alert-circle"}
                                size={20}
                                color={toast.tone === "success" ? colors["payment-soft"] : colors["debt-soft"]}
                            />
                            <Text className="shrink font-jakarta-semibold text-sm text-white">{toast.message}</Text>
                        </View>
                    </Animated.View>
                ) : null}
            </View>
        </ToastContext.Provider>
    );
}

export function useToast(): ShowToast {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast doit être utilisé dans un ToastProvider");
    }
    return context;
}
