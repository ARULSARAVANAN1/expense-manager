import api, { getAllPages, unwrapResponse } from "./api";
import type { ApiResponse } from "../types/auth";
import type {
  Budget,
  Expense,
  ExpenseAccount,
  ExpenseCategory,
  ExpenseInput,
  FinanceCategory,
  Income,
} from "../types/expense";

type TransactionPayload = Omit<ExpenseInput, "categoryName" | "accountName">;

function toPayload(input: ExpenseInput): TransactionPayload {
  const { description, amount, categoryId, accountId, date, notes } = input;
  return { description, amount, categoryId, accountId, date, notes };
}

export function getIncomes(): Promise<Income[]> {
  return getAllPages<Income>("/incomes");
}

export function addIncome(input: ExpenseInput): Promise<Income> {
  return unwrapResponse(
    api.post<ApiResponse<Income>>("/incomes", toPayload(input)),
  );
}

export function updateIncome(id: string, input: ExpenseInput): Promise<Income> {
  return unwrapResponse(
    api.patch<ApiResponse<Income>>(`/incomes/${id}`, toPayload(input)),
  );
}

export async function deleteIncome(id: string): Promise<void> {
  await unwrapResponse(api.delete<ApiResponse<{ id: string }>>(`/incomes/${id}`));
}

export function getFinanceCategories(): Promise<FinanceCategory[]> {
  return unwrapResponse(
    api.get<ApiResponse<FinanceCategory[]>>("/categories"),
  );
}

export function getCategories(
  type: FinanceCategory["type"],
): Promise<ExpenseCategory[]> {
  return unwrapResponse(
    api.get<ApiResponse<ExpenseCategory[]>>("/categories", { params: { type } }),
  );
}

export function saveCategory(
  input: Omit<FinanceCategory, "id">,
  id?: string,
): Promise<FinanceCategory> {
  const request = id
    ? api.patch<ApiResponse<FinanceCategory>>(`/categories/${id}`, input)
    : api.post<ApiResponse<FinanceCategory>>("/categories", input);
  return unwrapResponse(request);
}

export async function deleteCategory(id: string): Promise<void> {
  await unwrapResponse(api.delete<ApiResponse<{ id: string }>>(`/categories/${id}`));
}

export function getAccounts(): Promise<ExpenseAccount[]> {
  return unwrapResponse(
    api.get<ApiResponse<ExpenseAccount[]>>("/accounts"),
  );
}

export function saveAccount(
  name: string,
  id?: string,
  type?: string,
): Promise<ExpenseAccount> {
  const payload = type ? { name: name.trim(), type } : { name: name.trim() };
  const request = id
    ? api.patch<ApiResponse<ExpenseAccount>>(`/accounts/${id}`, payload)
    : api.post<ApiResponse<ExpenseAccount>>("/accounts", payload);
  return unwrapResponse(request);
}

export async function deleteAccount(id: string): Promise<void> {
  await unwrapResponse(api.delete<ApiResponse<{ id: string }>>(`/accounts/${id}`));
}

export function getBudgets(): Promise<Budget[]> {
  return getAllPages<Budget>("/budgets");
}

export function saveBudget(
  input: Omit<Budget, "id" | "spent" | "remaining" | "percent">,
  id?: string,
): Promise<Budget> {
  const { categoryId, month, amount } = input;
  const payload = { categoryId, month, amount };
  const request = id
    ? api.patch<ApiResponse<Budget>>(`/budgets/${id}`, payload)
    : api.post<ApiResponse<Budget>>("/budgets", payload);
  return unwrapResponse(request);
}

export async function deleteBudget(id: string): Promise<void> {
  await unwrapResponse(api.delete<ApiResponse<{ id: string }>>(`/budgets/${id}`));
}

export type { Expense };
