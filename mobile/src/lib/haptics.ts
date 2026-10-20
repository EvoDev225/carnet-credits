import * as Haptics from "expo-haptics";

// Retour haptique « best effort » : jamais bloquant (appareil sans moteur, web…)
export function hapticSuccess() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function hapticError() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}
