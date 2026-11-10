import api, { unwrapResponse } from "./api";

import type {
    ApiResponse,
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    User,
} from "../types/auth";

let currentUserRequest: Promise<User> | null = null;

export async function register(
    data: RegisterRequest
): Promise<AuthResponse> {
    return unwrapResponse(
        api.post<ApiResponse<AuthResponse>>("/auth/register", data),
    );
}

export async function login(
    data: LoginRequest
): Promise<AuthResponse> {
    return unwrapResponse(
        api.post<ApiResponse<AuthResponse>>("/auth/login", data),
    );
}

export function getCurrentUser(): Promise<User> {
    if (!currentUserRequest) {
        currentUserRequest = unwrapResponse(
            api.get<ApiResponse<User>>("/auth/me"),
        ).finally(() => {
            currentUserRequest = null;
        });
    }

    return currentUserRequest;
}

export async function loginWithGoogle(credential: string): Promise<AuthResponse> {
    const result = await unwrapResponse(
        api.post<ApiResponse<AuthResponse>>("/auth/google", { credential }),
    );
    if (!result?.token || !result.user?.id || !result.user.name || !result.user.email) {
        throw new Error("Google sign-in returned an invalid session.");
    }
    return result;
}

export async function logout(): Promise<void> {
    await unwrapResponse(api.post<ApiResponse<{ id: string }>>("/auth/logout"));
}

export async function updateCurrentUser(
    updates: { name?: string; preferredCurrency?: string },
): Promise<User> {
    return unwrapResponse(
        api.patch<ApiResponse<User>>("/users/me", updates),
    );
}

export async function changePassword(
    currentPassword: string,
    newPassword: string,
): Promise<void> {
    await unwrapResponse(
        api.post<ApiResponse<{ reauthenticate?: boolean }>>(
            "/users/me/change-password",
            { currentPassword, newPassword },
        ),
    );
}