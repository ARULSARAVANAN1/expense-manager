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

export function validateExpenseImage(image: File): void {
  if (!image.type.startsWith("image/")) {
    throw new Error("Please choose an image file, such as PNG or JPG.");
  }
  if (image.size === 0) {
    throw new Error("This image is empty. Please choose another bill image.");
  }
  if (image.size > 2 * 1024 * 1024) {
    throw new Error("Bill images must be 2 MB or smaller.");
  }
}

export async function parseExpense(text: string, image?: File): Promise<ExpenseParseResult> {
  if (image) {
    validateExpenseImage(image);
    const formData = new FormData();
    formData.append("image", image);
    if (text.trim()) formData.append("text", text);
    return unwrapResponse(
      api.post<ApiResponse<ExpenseParseResult>>("/expenses/parse", formData, {
        headers: { "Content-Type": undefined },
      }),
    );
  }
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
