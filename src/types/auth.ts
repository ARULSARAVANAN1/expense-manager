export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    preferredCurrency?: string;
    hasPassword?: boolean;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}