import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import type {
    LoginRequest,
    RegisterRequest,
    User,
} from "../types/auth";

import {
    getCurrentUser,
    login as loginApi,
    loginWithGoogle as googleLoginApi,
    logout as logoutApi,
    register as registerApi,
    updateCurrentUser,
    changePassword as changePasswordApi,
} from "../services/auth.service";
import { getToken, removeToken, setToken } from "../utils.ts/auth-storage";


interface AuthContextValue {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (data: LoginRequest) => Promise<void>;
    loginWithGoogle: (credential: string) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    updateProfile: (updates: { name?: string; preferredCurrency?: string }) => Promise<void>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<
    AuthContextValue | undefined
>(undefined);

export function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(() => !!getToken());

    async function login(data: LoginRequest) {
        const result = await loginApi(data);

        setToken(result.token);
        setUser(result.user);
    }

    async function register(data: RegisterRequest) {
        const result = await registerApi(data);

        setToken(result.token);
        setUser(result.user);
    }

    async function loginWithGoogle(credential: string) {
        const result = await googleLoginApi(credential);
        setToken(result.token);
        setUser(result.user);
    }

    async function updateProfile(updates: { name?: string; preferredCurrency?: string }) {
        const updatedUser = await updateCurrentUser(updates);
        setUser(updatedUser);
    }

    async function changePassword(currentPassword: string, newPassword: string) {
        await changePasswordApi(currentPassword, newPassword);
        removeToken();
        setUser(null);
    }

    async function logout() {
        try {
            await logoutApi();
        } finally {
            removeToken();
            setUser(null);
        }
    }

    useEffect(() => {
        const token = getToken();

        if (!token) {
            return;
        }

        let isMounted = true;

        void (async () => {
            try {
                const currentUser = await getCurrentUser();

                if (isMounted) {
                    setUser(currentUser);
                }
            } catch {
                removeToken();

                if (isMounted) {
                    setUser(null);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        })();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                loginWithGoogle,
                register,
                updateProfile,
                changePassword,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider"
        );
    }

    return context;
}