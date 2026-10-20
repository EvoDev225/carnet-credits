import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
    type ReactNode,
} from "react";
import { api, setUnauthorizedHandler } from "../lib/api";
import { getToken, setToken, deleteToken } from "../lib/storage";
import { ApiError, type AuthResponse, type Shop, type User } from "../lib/types";
import {queryClient} from "../lib/queryClient"

export type SignUpInput = {
    shopName: string;
    name: string;
    phone: string;
    password: string;
};

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    signIn: (phone: string, password: string) => Promise<void>;
    signUp: (input: SignUpInput) => Promise<void>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
    renameShop: (name: string) => Promise<void>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const initAuth = async () => {
            try {
                const token = await getToken();
                if (!token) {
                    return;
                }

                try {
                    const data = await api.get<{ user: User }>("/api/auth/me");
                    if (isMounted) {
                        setUser(data.user);
                    }
                } catch (error) {
                    if (error instanceof ApiError && error.status === 401) {
                        await deleteToken();
                    }
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        initAuth();

        return () => {
            isMounted = false;
        };
    }, []);

    const signOut = useCallback(async () => {
        await deleteToken();
        queryClient.clear();
        setUser(null);
    }, []);

    // Commun à la connexion, l'inscription et au changement de mot de passe
    const applyAuth = useCallback(async (data: AuthResponse) => {
        await setToken(data.token);
        setUser(data.user);
    }, []);

    const signIn = useCallback(async (phone: string, password: string) => {
        const data = await api.post<AuthResponse>("/api/auth/login", { phone, password }, false);
        await applyAuth(data);
    }, [applyAuth]);

    const signUp = useCallback(async (input: SignUpInput) => {
        const data = await api.post<AuthResponse>("/api/auth/register", input, false);
        await applyAuth(data);
    }, [applyAuth]);

    // L'API révoque les anciens tokens et en renvoie un nouveau
    const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
        const data = await api.patch<AuthResponse>("/api/auth/password", { currentPassword, newPassword });
        await applyAuth(data);
    }, [applyAuth]);

    // Propriétaire uniquement : le nouveau nom est reporté dans l'utilisateur connecté
    const renameShop = useCallback(async (name: string) => {
        const data = await api.patch<{ shop: Shop }>("/api/shop", { name });
        setUser((current) => (current ? { ...current, shop: data.shop } : current));
    }, []);

    useEffect(() => {
        setUnauthorizedHandler(() => {
            signOut();
        });
        return () => {
            setUnauthorizedHandler(null);
        };
    }, [signOut]);

    const value = useMemo(
        () => ({ user, isLoading, signIn, signUp, changePassword, renameShop, signOut }),
        [user, isLoading, signIn, signUp, changePassword, renameShop, signOut]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth doit être utilisé dans un AuthProvider");
    }
    return context;
}
