import { router } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Avatar from "../../../components/ui/Avatar";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import Fab from "../../../components/ui/Fab";
import ListSkeleton from "../../../components/ui/ListSkeleton";
import { useStaff } from "../../../hooks/useStaff";
import { getErrorMessage } from "../../../lib/errors";
import { formatPhone } from "../../../lib/format";
import type { Staff } from "../../../lib/types";

function StaffRow({ staff }: { staff: Staff }) {
    return (
        <Pressable
            onPress={() => router.push({ pathname: "/team/[id]", params: { id: staff.id } })}
            accessibilityRole="button"
            accessibilityLabel={`${staff.name}, ${staff.active ? "actif" : "désactivé"}`}
            className="flex-row items-center gap-3 border-b border-line px-4 py-3 active:bg-avatar/40"
        >
            <Avatar name={staff.name} />
            <View className="flex-1">
                <Text className="font-jakarta-bold text-base text-ink" numberOfLines={1}>
                    {staff.name}
                </Text>
                <Text className="font-jakarta text-sm text-muted">{formatPhone(staff.phone)}</Text>
            </View>
            <View className={`rounded-full px-3 py-1 ${staff.active ? "bg-ok/10" : "bg-debt-soft"}`}>
                <Text className={`font-jakarta-semibold text-xs ${staff.active ? "text-ok" : "text-debt"}`}>
                    {staff.active ? "Actif" : "Désactivé"}
                </Text>
            </View>
        </Pressable>
    );
}

export default function TeamScreen() {
    const insets = useSafeAreaInsets();
    const staff = useStaff();

    const empty = staff.isPending ? (
        <View className="px-4">
            <ListSkeleton count={3} />
        </View>
    ) : staff.isError ? (
        <ErrorState message={getErrorMessage(staff.error)} onRetry={staff.refetch} />
    ) : (
        <EmptyState
            title="Aucun collaborateur"
            message="Ajoute les personnes qui t'aident à la boutique : elles pourront enregistrer des clients et des dettes."
            actionLabel="Ajouter un collaborateur"
            onAction={() => router.push("/team/new")}
        />
    );

    return (
        <View className="flex-1 bg-canvas">
            <View className="rounded-b-[28px] bg-navy px-5 pb-6" style={{ paddingTop: insets.top + 16 }}>
                <Text className="font-jakarta-extrabold text-xl text-white">Équipe</Text>
                <Text className="font-jakarta text-sm text-white/70">
                    Les collaborateurs ne peuvent ni enregistrer de remboursement, ni annuler, ni supprimer.
                </Text>
            </View>
            <FlatList
                data={staff.data ?? []}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <StaffRow staff={item} />}
                ListEmptyComponent={empty}
                refreshing={staff.isRefetching}
                onRefresh={staff.refetch}
                contentContainerStyle={{ paddingTop: 8, paddingBottom: 96 }}
            />
            {staff.data && staff.data.length > 0 ? (
                <Fab label="Ajouter" onPress={() => router.push("/team/new")} />
            ) : null}
        </View>
    );
}
