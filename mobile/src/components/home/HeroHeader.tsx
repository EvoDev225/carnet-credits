import { Image, Text, View } from "react-native";
import { formatFcfa } from "../../lib/format";
import { tabularNums } from "../../lib/theme";
import type { DashboardResponse, User } from "../../lib/types";
import AnimatedAmount from "../ui/AnimatedAmount";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import ScreenHeader from "../ui/ScreenHeader";

type HeroHeaderProps = {
    user: User;
    dashboard: DashboardResponse | undefined;
    isLoading: boolean;
    isError: boolean;
    onRetry: () => void;
};

function Stat({ label, value, tone }: { label: string; value: string; tone: "navy" | "payment" }) {
    return (
        <View className="flex-1 items-center gap-1">
            <Text className="text-center font-jakarta text-xs text-muted">{label}</Text>
            <Text
                className={`font-jakarta-bold text-base ${tone === "payment" ? "text-payment" : "text-navy"}`}
                style={tabularNums}
            >
                {value}
            </Text>
        </View>
    );
}

function OwnerSummary({
    dashboard,
    isLoading,
    isError,
    onRetry,
}: Omit<HeroHeaderProps, "user">) {
    if (isLoading) {
        return (
            <View className="items-center gap-3">
                <View className="h-4 w-36 rounded-full bg-line" />
                <View className="h-9 w-52 rounded-xl bg-line" />
            </View>
        );
    }

    if (isError) {
        return (
            <View className="items-center gap-3">
                <Text className="font-jakarta text-muted">Impossible de charger le résumé</Text>
                <Button title="Réessayer" onPress={onRetry} variant="secondary" />
            </View>
        );
    }

    if (!dashboard) {
        return null;
    }

    const { summary, month } = dashboard;
    const count = summary.customersWithDebt;

    return (
        <>
            <Text className="font-jakarta-semibold text-sm text-muted">Total des impayés</Text>
            <AnimatedAmount
                value={summary.totalOutstanding}
                accessibilityLabel={`Total des impayés : ${formatFcfa(summary.totalOutstanding)}`}
                className="text-center font-jakarta-extrabold text-display text-navy"
            />
            <View className="mt-2">
                {count === 0 ? (
                    <Badge tone="payment" icon="checkmark-circle" label="Aucun client endetté" />
                ) : (
                    <Badge
                        tone="debt"
                        icon="alert-circle"
                        label={`${count} ${count > 1 ? "clients endettés" : "client endetté"}`}
                    />
                )}
            </View>
            <View className="mt-4 w-full flex-row border-t border-line pt-3">
                <Stat label="Dettes du mois" value={formatFcfa(month.debts.total)} tone="navy" />
                <Stat label="Remboursé ce mois" value={formatFcfa(month.payments.total)} tone="payment" />
            </View>
        </>
    );
}

function StaffWelcome() {
    return (
        <View className="items-center gap-1">
            <Text className="font-jakarta-extrabold text-xl text-navy">Bonne journée</Text>
            <Text className="text-center font-jakarta text-muted">
                Retrouve ici les clients de la boutique.
            </Text>
        </View>
    );
}

export default function HeroHeader({ user, dashboard, isLoading, isError, onRetry }: HeroHeaderProps) {
    const firstName = user.name.split(" ")[0];

    return (
        <View>
            <ScreenHeader
                title={`Bonjour, ${firstName}`}
                subtitle={user.role === "owner" ? "Propriétaire" : "Collaborateur"}
                minHeight={220}
                decoration={
                    <View className="absolute left-0 right-0 top-[29px] items-center">
                        <View className="h-[156px] w-[156px] rounded-full bg-navy-light" />
                    </View>
                }
            />

            <View className="-mt-14 mx-4 items-center rounded-card border border-line bg-surface px-5 pb-4 pt-5">
                <View pointerEvents="none" className="absolute -top-[122px] left-0 right-0 items-center">
                    <Image
                        source={require("../../../assets/images/mascotte.png")}
                        style={{ width: 117, height: 130 }}
                        resizeMode="contain"
                        accessibilityIgnoresInvertColors
                    />
                </View>

                <View className="h-[14px]" />

                {user.role === "owner" ? (
                    <OwnerSummary
                        dashboard={dashboard}
                        isLoading={isLoading}
                        isError={isError}
                        onRetry={onRetry}
                    />
                ) : (
                    <StaffWelcome />
                )}
            </View>
        </View>
    );
}
