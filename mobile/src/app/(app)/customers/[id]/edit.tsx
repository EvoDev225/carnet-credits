import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import CustomerForm from "../../../../components/customers/CustomerForm";
import ErrorState from "../../../../components/ui/ErrorState";
import ListSkeleton from "../../../../components/ui/ListSkeleton";
import { useToast } from "../../../../components/ui/Toast";
import { useCustomer, useUpdateCustomer } from "../../../../hooks/useCustomer";
import { hapticError, hapticSuccess } from "../../../../lib/haptics";

export default function EditCustomerScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const customer = useCustomer(id);
    const updateCustomer = useUpdateCustomer(id);
    const toast = useToast();

    if (customer.isPending) {
        return (
            <View className="flex-1 bg-canvas p-4">
                <ListSkeleton count={3} />
            </View>
        );
    }

    if (customer.isError) {
        return (
            <View className="flex-1 bg-canvas">
                <ErrorState error={customer.error} onRetry={customer.refetch} />
            </View>
        );
    }

    return (
        <CustomerForm
            initial={customer.data}
            submitLabel="Enregistrer"
            isPending={updateCustomer.isPending}
            error={updateCustomer.error}
            onSubmit={(input) =>
                updateCustomer.mutate(input, {
                    onSuccess: () => {
                        hapticSuccess();
                        toast("Client modifié");
                        router.back();
                    },
                    onError: hapticError,
                })
            }
        />
    );
}
