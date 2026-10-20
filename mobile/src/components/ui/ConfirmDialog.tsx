import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import Button from "./Button";

type ConfirmOptions = {
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel?: string;
    destructive?: boolean;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

// Boîte de confirmation unique pour toute l'app :
//   const confirm = useConfirm();
//   if (await confirm({ title, message, confirmLabel: "Supprimer", destructive: true })) { … }
export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const resolverRef = useRef<((value: boolean) => void) | null>(null);

    const confirm = useCallback<ConfirmFn>(
        (next) =>
            new Promise<boolean>((resolve) => {
                resolverRef.current?.(false);
                resolverRef.current = resolve;
                setOptions(next);
            }),
        []
    );

    const close = (result: boolean) => {
        resolverRef.current?.(result);
        resolverRef.current = null;
        setOptions(null);
    };

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            <Modal
                visible={options !== null}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => close(false)}
            >
                <View className="flex-1 items-center justify-center bg-overlay px-6">
                    {/* Appui en dehors de la carte = annuler */}
                    <Pressable
                        className="absolute inset-0"
                        onPress={() => close(false)}
                        accessibilityLabel="Fermer"
                    />
                    {options ? (
                        <View
                            accessibilityViewIsModal
                            className="w-full max-w-[420px] gap-3 rounded-card bg-surface p-6"
                        >
                            <Text accessibilityRole="header" className="font-jakarta-extrabold text-lg text-navy">
                                {options.title}
                            </Text>
                            <Text className="font-jakarta text-base text-ink">{options.message}</Text>
                            <View className="mt-2 gap-3">
                                <Button
                                    title={options.confirmLabel}
                                    variant={options.destructive ? "danger" : "primary"}
                                    onPress={() => close(true)}
                                />
                                <Button
                                    title={options.cancelLabel ?? "Annuler"}
                                    variant="secondary"
                                    onPress={() => close(false)}
                                />
                            </View>
                        </View>
                    ) : null}
                </View>
            </Modal>
        </ConfirmContext.Provider>
    );
}

export function useConfirm(): ConfirmFn {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error("useConfirm doit être utilisé dans un ConfirmProvider");
    }
    return context;
}
