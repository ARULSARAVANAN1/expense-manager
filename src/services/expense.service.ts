import type { Expense, ExpenseInput } from "../types/expense";
import api, { getAllPages, unwrapResponse } from "./api";
import type { ApiResponse } from "../types/auth";

type ExpensePayload = Omit<ExpenseInput, "categoryName" | "accountName">;

function toPayload(input: ExpenseInput): ExpensePayload {
  const { description, amount, categoryId, accountId, date, notes } = input;
  return { description, amount, categoryId, accountId, date, notes };
}

export function getExpenses(): Promise<Expense[]> {
  return getAllPages<Expense>("/expenses");
}

export function getExpense(id: string): Promise<Expense> {
  return unwrapResponse(api.get<ApiResponse<Expense>>(`/expenses/${id}`));
}

export function addExpense(input: ExpenseInput): Promise<Expense> {
  return unwrapResponse(
    api.post<ApiResponse<Expense>>("/expenses", toPayload(input)),
  );
}

export interface ParsedExpenseDraft {
  description: string;
  amount: number;
  categoryId: string;
  accountId: string;
  date: string;
  notes?: string;
}

export interface ExpenseParseResult {
  draft: ParsedExpenseDraft;
  needsClarification: { field: string; message: string }[];
  source: string;
  referenceDate: string;
}

export function parseExpense(text: string): Promise<ExpenseParseResult> {
  return unwrapResponse(
    api.post<ApiResponse<ExpenseParseResult>>("/expenses/parse", { text }),
  );
}

export function updateExpense(id: string, input: ExpenseInput): Promise<Expense> {
  return unwrapResponse(
    api.patch<ApiResponse<Expense>>(`/expenses/${id}`, toPayload(input)),
  );
}

export async function deleteExpense(id: string): Promise<void> {
  await unwrapResponse(api.delete<ApiResponse<{ id: string }>>(`/expenses/${id}`));
}
