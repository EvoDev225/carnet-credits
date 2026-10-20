import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown, ReduceMotion } from "react-native-reanimated";
import { formatFcfa, formatPhone } from "../../lib/format";
import { tabularNums } from "../../lib/theme";
import type { Customer } from "../../lib/types";
import Avatar from "../ui/Avatar";

const entering = FadeInDown.duration(220).reduceMotion(ReduceMotion.System);

export default function CustomerRow({
    customer,
    onPress,
}: {
    customer: Customer;
    onPress?: () => void;
}) {
    const hasDebt = customer.balance > 0;
    const phone = formatPhone(customer.phone);

    return (
        <Animated.View entering={entering}>
            <Pressable
                onPress={onPress}
                accessibilityRole={onPress ? "button" : undefined}
                accessibilityLabel={
                    hasDebt
                        ? `${customer.name}, doit ${formatFcfa(customer.balance)}`
                        : `${customer.name}, soldé`
                }
                className="min-h-[64px] flex-row items-center gap-3 border-b border-line py-3 active:bg-avatar/40"
            >
                <Avatar name={customer.name} />
                <View className="flex-1">
                    <Text className="font-jakarta-bold text-base text-ink" numberOfLines={1}>
                        {customer.name}
                    </Text>
                    {phone.length > 0 ? (
                        <Text className="font-jakarta text-sm text-muted">{phone}</Text>
                    ) : null}
                </View>
                <View className="items-end">
                    {hasDebt ? (
                        <>
                            <Text className="font-jakarta-bold text-base text-debt" style={tabularNums}>
                                {formatFcfa(customer.balance)}
                            </Text>
                            <Text className="font-jakarta text-xs text-muted">doit</Text>
                        </>
                    ) : (
                        <>
                            <Text className="font-jakarta-bold text-base text-payment">Soldé</Text>
                            <Text className="font-jakarta text-xs text-muted" style={tabularNums}>
                                {formatFcfa(0)}
                            </Text>
                        </>
                    )}
                </View>
            </Pressable>
        </Animated.View>
    );
}
