import { router } from "expo-router";
import CustomerForm from "../../../components/customers/CustomerForm";
import { useToast } from "../../../components/ui/Toast";
import { useCreateCustomer } from "../../../hooks/useCustomer";
import { hapticError, hapticSuccess } from "../../../lib/haptics";

export default function NewCustomerScreen() {
    const createCustomer = useCreateCustomer();
    const toast = useToast();

    return (
        <CustomerForm
            submitLabel="Ajouter le client"
            isPending={createCustomer.isPending}
            error={createCustomer.error}
            onSubmit={(input) =>
                createCustomer.mutate(input, {
                    // La fiche remplace le formulaire : « retour » ramène à la liste
                    onSuccess: (customer) => {
                        hapticSuccess();
                        toast(`${customer.name} a été ajouté`);
                        router.replace({ pathname: "/customers/[id]", params: { id: customer._id } });
                    },
                    onError: hapticError,
                })
            }
        />
    );
}
