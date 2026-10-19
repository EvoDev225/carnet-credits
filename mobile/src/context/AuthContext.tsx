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
import { ApiError, type AuthResponse, type User } from "../lib/types";

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    signIn: (phone: string, password: string) => Promise<void>;
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
        setUser(null);
    }, []);

    const signIn = useCallback(async (phone: string, password: string) => {
        const data = await api.post<AuthResponse>("/api/auth/login", { phone, password }, false);
        await setToken(data.token);
        setUser(data.user);
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
        () => ({ user, isLoading, signIn, signOut }),
        [user, isLoading, signIn, signOut]
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