import api from "./api";

import type {
    ApiResponse,
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    User,
} from "../types/auth";

export async function register(
    data: RegisterRequest
): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>(
        "/auth/register",
        data
    );

    return response.data.data;
}

export async function login(
    data: LoginRequest
): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>(
        "/auth/login",
        data
    );

    return response.data.data;
}

export async function getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<User>>(
        "/auth/me"
    );

    return response.data.data;
}

export async function loginWithGoogle(credential: string): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>("/auth/google", { credential });
    const result = response.data.data;
    if (!response.data.success || !result?.token || !result.user?.id || !result.user.name || !result.user.email) {
        throw new Error("Google sign-in returned an invalid session.");
    }
    return result;
}