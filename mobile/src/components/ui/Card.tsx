import type { ReactNode } from "react";
import { View } from "react-native";

// Carte blanche bordée, utilisée pour regrouper un contenu sur fond canvas
export default function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
    return <View className={`rounded-card border border-line bg-surface p-5 ${className}`}>{children}</View>;
}
