import type { ApiResponse } from "../types/auth";
import type { MonthlySummary } from "../types/summary";
import api, { unwrapResponse } from "./api";

export async function getMonthlySummary(month: string, signal?: AbortSignal): Promise<MonthlySummary> {
  const result = await unwrapResponse(
    api.post<ApiResponse<MonthlySummary>>("/summaries/monthly", { month }, { signal }),
  );
  if (!result || result.month !== month || typeof result.source !== "string"
    || !result.card || typeof result.card.greeting !== "string"
    || !result.card.greeting.trim() || typeof result.card.introduction !== "string"
    || !result.card.introduction.trim() || !Array.isArray(result.card.insights)
    || result.card.insights.some((insight) => !insight || typeof insight.type !== "string"
      || typeof insight.title !== "string" || !insight.title.trim()
      || typeof insight.message !== "string" || !insight.message.trim())) {
    throw new Error("The server returned an invalid monthly summary.");
  }
  return result;
}
