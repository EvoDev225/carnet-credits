import { Image, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatFcfa, formatNumber } from "../../lib/format";
import type { DashboardResponse, User } from "../../lib/types";
import Button from "../ui/Button";

export default function HeroHeader({
    user,
    dashboard,
    isLoading,
    isError,
    onRetry,
}: {
    user: User;
    dashboard: DashboardResponse | undefined;
    isLoading: boolean;
    isError: boolean;
    onRetry: () => void;
}) {
    const insets = useSafeAreaInsets();
    const firstName = user.name.split(" ")[0];

    return (
        <View>
            <View
                className="h-[220px] rounded-b-[28px] bg-navy px-5"
                style={{ paddingTop: insets.top + 16 }}
            >
                <View
                    pointerEvents="none"
                    className="absolute left-0 right-0 top-[29px] items-center"
                >
                    <View className="h-[156px] w-[156px] rounded-full bg-navy-light" />
                </View>
                <Text className="font-jakarta-bold text-base text-white">
                    {"Bonjour, " + firstName}
                </Text>
                <Text className="font-jakarta text-xs text-white/70">
                    {user.role === "owner" ? "Propriétaire" : "Collaborateur"}
                </Text>
            </View>

            <View className="-mt-14 mx-4 items-center rounded-2xl border border-line bg-white px-5 pb-4 pt-5 shadow-sm">
                <View
                    pointerEvents="none"
                    className="absolute -top-[122px] left-0 right-0 items-center"
                >
                    <Image
                        source={require("../../../assets/images/mascotte.png")}
                        style={{ width: 117, height: 130 }}
                        resizeMode="contain"
                    />
                </View>

                <View className="h-[14px]" />

                {user.role === "owner" ? (
                    isLoading ? (
                        <View className="items-center gap-3">
                            <View className="h-4 w-36 rounded-full bg-line" />
                            <View className="h-9 w-52 rounded-xl bg-line" />
                        </View>
                    ) : isError ? (
                        <View className="items-center gap-3">
                            <Text className="font-jakarta text-muted">
                                Impossible de charger le résumé
                            </Text>
                            <Button title="Réessayer" onPress={onRetry} variant="secondary" />
                        </View>
                    ) : dashboard ? (
                        <>
                            <Text className="font-jakarta-semibold text-sm text-muted">
                                Total des impayés
                            </Text>
                            <Text
                                className="font-jakarta-extrabold text-navy"
                                style={{ fontSize: 34 }}
                            >
                                {formatFcfa(dashboard.summary.totalOutstanding)}
                            </Text>

                            {dashboard.summary.customersWithDebt > 0 ? (
                                <View className="mt-2 rounded-full bg-debt-soft px-3 py-1">
                                    <Text className="font-jakarta text-debt">
                                        {dashboard.summary.customersWithDebt > 1
                                            ? `${formatNumber(dashboard.summary.customersWithDebt)} clients endettés`
                                            : `${formatNumber(dashboard.summary.customersWithDebt)} client endetté`}
                                    </Text>
                                </View>
                            ) : (
                                <View className="mt-2 rounded-full bg-ok/10 px-3 py-1">
                                    <Text className="font-jakarta text-ok">Aucun client endetté</Text>
                                </View>
                            )}

                            <View className="mt-4 w-full flex-row border-t border-line pt-3">
                                <View className="flex-1 items-center gap-1">
                                    <Text className="font-jakarta text-xs text-muted">
                                        Dettes du mois
                                    </Text>
                                    <Text className="font-jakarta-bold text-base text-navy">
                                        {formatFcfa(dashboard.month.debts.total)}
                                    </Text>
                                </View>
                                <View className="flex-1 items-center gap-1">
                                    <Text className="font-jakarta text-xs text-muted">
                                        Remboursé
                                    </Text>
                                    <Text className="font-jakarta-bold text-base text-ok">
                                        {formatFcfa(dashboard.month.payments.total)}
                                    </Text>
                                </View>
                            </View>
                        </>
                    ) : null
                ) : (
                    <View className="items-center gap-1">
                        <Text className="font-jakarta-extrabold text-xl text-navy">
                            Bonne journée
                        </Text>
                        <Text className="text-center font-jakarta text-muted">
                            Retrouve ici les clients de la boutique.
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}