import { router } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";
import Animated, { FadeInDown, ReduceMotion } from "react-native-reanimated";
import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import Fab from "../../../components/ui/Fab";
import ListSkeleton from "../../../components/ui/ListSkeleton";
import ScreenHeader from "../../../components/ui/ScreenHeader";
import { useStaff } from "../../../hooks/useStaff";
import { formatPhone } from "../../../lib/format";
import type { Staff } from "../../../lib/types";

const entering = FadeInDown.duration(220).reduceMotion(ReduceMotion.System);

function StaffRow({ staff }: { staff: Staff }) {
    return (
        <Animated.View entering={entering}>
            <Pressable
                onPress={() => router.push({ pathname: "/team/[id]", params: { id: staff.id } })}
                accessibilityRole="button"
                accessibilityLabel={`${staff.name}, ${staff.active ? "actif" : "désactivé"}`}
                className="min-h-[64px] flex-row items-center gap-3 border-b border-line px-4 py-3 active:bg-avatar/40"
            >
                <Avatar name={staff.name} />
                <View className="flex-1">
                    <Text className="font-jakarta-bold text-base text-ink" numberOfLines={1}>
                        {staff.name}
                    </Text>
                    <Text className="font-jakarta text-sm text-muted">{formatPhone(staff.phone)}</Text>
                </View>
                {staff.active ? (
                    <Badge tone="payment" icon="checkmark-circle" label="Actif" />
                ) : (
                    <Badge tone="muted" icon="pause-circle" label="Désactivé" />
                )}
            </Pressable>
        </Animated.View>
    );
}

export default function TeamScreen() {
    const staff = useStaff();
    const openNewStaff = () => router.push("/team/new");

    const empty = staff.isPending ? (
        <View className="px-4">
            <ListSkeleton count={3} />
        </View>
    ) : staff.isError ? (
        <ErrorState error={staff.error} onRetry={staff.refetch} />
    ) : (
        <EmptyState
            title="Aucun collaborateur"
            message="Ajoute les personnes qui t'aident à la boutique : elles pourront enregistrer des clients et des dettes."
            actionLabel="Ajouter un collaborateur"
            onAction={openNewStaff}
        />
    );

    return (
        <View className="flex-1 bg-canvas">
            <ScreenHeader
                title="Équipe"
                subtitle="Les collaborateurs ne peuvent ni enregistrer de remboursement, ni annuler, ni supprimer."
            />
            <FlatList
                data={staff.data ?? []}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <StaffRow staff={item} />}
                ListEmptyComponent={empty}
                refreshing={staff.isRefetching}
                onRefresh={staff.refetch}
                contentContainerStyle={{ paddingTop: 8, paddingBottom: 96 }}
            />
            {staff.data && staff.data.length > 0 ? <Fab label="Ajouter" onPress={openNewStaff} /> : null}
        </View>
    );
}
