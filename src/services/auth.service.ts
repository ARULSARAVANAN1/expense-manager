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