import { router } from "expo-router";
import CustomerForm from "../../../components/customers/CustomerForm";
import { useCreateCustomer } from "../../../hooks/useCustomer";

export default function NewCustomerScreen() {
    const createCustomer = useCreateCustomer();

    return (
        <CustomerForm
            submitLabel="Ajouter le client"
            isPending={createCustomer.isPending}
            error={createCustomer.error}
            onSubmit={(input) =>
                createCustomer.mutate(input, {
                    // La fiche remplace le formulaire : « retour » ramène à la liste
                    onSuccess: (customer) =>
                        router.replace({ pathname: "/customers/[id]", params: { id: customer._id } }),
                })
            }
        />
    );
}
