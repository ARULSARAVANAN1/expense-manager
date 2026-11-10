import axios from "axios";
import { getToken } from "../utils.ts/auth-storage";
import type { ApiResponse } from "../types/auth";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api",
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = getToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(undefined, (error: unknown) => {
    if (axios.isAxiosError<{ message?: string }>(error)) {
        const message = error.response?.data?.message;
        if (message) {
            return Promise.reject(new Error(message, { cause: error }));
        }
    }

    return Promise.reject(error);
});

export async function unwrapResponse<T>(
    request: Promise<{ data: ApiResponse<T> }>,
): Promise<T> {
    const response = await request;
    if (!response.data || response.data.success !== true || !("data" in response.data)) {
        throw new Error(response.data?.message ?? "The server returned an invalid response.");
    }
    return response.data.data;
}

export interface PaginatedResponse<T> {
    items: T[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export async function getAllPages<T>(path: string): Promise<T[]> {
    const items: T[] = [];
    const pageSize = 100;
    let page = 1;

    for (;;) {
        const data = await unwrapResponse(
            api.get<ApiResponse<PaginatedResponse<T>>>(path, { params: { page, pageSize } }),
        );
        if (!data || !Array.isArray(data.items)
            || !Number.isInteger(data.totalPages) || data.totalPages < 0
            || data.page !== page) {
            throw new Error(`The server returned an invalid ${path} list.`);
        }
        items.push(...data.items);
        if (data.totalPages === 0 || page >= data.totalPages) break;
        page += 1;
    }

    return items;
}

export default api;
