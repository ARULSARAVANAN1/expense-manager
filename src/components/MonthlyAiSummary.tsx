import { useEffect, useState } from "react";
import { getMonthlySummary } from "../services/summary.service";
import type { MonthlySummary } from "../types/summary";
import Icon from "./Icon";
import "./MonthlyAiSummary.css";

function insightIcon(type: string): string {
  switch (type) {
    case "trend": return "trend";
    case "saving": return "bulb";
    case "progress": return "circle-check";
    default: return "sparkle";
  }
}

function SummaryLoader({ monthLabel }: { monthLabel: string }) {
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = [
    `Preparing your ${monthLabel} insights`,
    "Good insights take a little thought",
    "Your personalized summary is still being prepared",
    "Still working on it. You can explore the dashboard while you wait.",
  ];

  useEffect(() => {
    const timers = [6000, 14000, 28000].map((delay, index) =>
      window.setTimeout(() => setMessageIndex(index + 1), delay));
    return () => timers.forEach(window.clearTimeout);
  }, []);

  return <div className="monthly-ai-summary-loader">
    <div className="monthly-ai-summary-loading-copy">
      <span className="monthly-ai-summary-orbit" aria-hidden="true"><Icon name="sparkle" size={23} /></span>
      <div>
        <p className="monthly-ai-summary-loading-message" role="status" aria-live="polite" aria-atomic="true">{messages[messageIndex]}</p>
        <p className="monthly-ai-summary-loading-hint">A fresh perspective on your income, spending, and savings.</p>
      </div>
      <span className="monthly-ai-summary-dots" aria-hidden="true"><i /><i /><i /></span>
    </div>
    <div className="monthly-ai-summary-skeletons" aria-hidden="true">
      {["trend", "saving", "progress"].map((type) => <div className="monthly-ai-summary-skeleton-row" key={type}>
        <span className={`monthly-ai-summary-icon monthly-ai-summary-icon--${type}`}><Icon name={insightIcon(type)} size={19} /></span>
        <div><span className="monthly-ai-summary-skeleton monthly-ai-summary-skeleton-title" /><span className="monthly-ai-summary-skeleton monthly-ai-summary-skeleton-line" /><span className="monthly-ai-summary-skeleton monthly-ai-summary-skeleton-short" /></div>
      </div>)}
    </div>
  </div>;
}

export default function MonthlyAiSummary({ month }: { month: string }) {
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [year, monthNumber] = month.split("-").map(Number);
  const monthLabel = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" })
    .format(new Date(year, monthNumber - 1, 1));

  useEffect(() => {
    if (attempt === 0) return;
    let active = true;
    const controller = new AbortController();
    void getMonthlySummary(month, controller.signal).then((result) => {
      if (active) setSummary(result);
    }).catch((summaryError: unknown) => {
      if (active) setError(summaryError instanceof Error ? summaryError.message : "Unable to load your monthly summary.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
      controller.abort();
    };
  }, [month, attempt]);

  function generateSummary() {
    if (loading) return;
    setError("");
    setLoading(true);
    setAttempt((value) => value + 1);
  }

  return <section className="content-card monthly-ai-summary" aria-label={`${monthLabel} monthly insights`} aria-busy={loading}>
    <header className="monthly-ai-summary-header">
      <h2>{summary?.card.greeting ?? "Your monthly insights"}</h2>
      <span className="monthly-ai-summary-badge"><Icon name="sparkle" size={13} />{summary?.source === "ai" || !summary ? "AI summary" : "Monthly summary"}</span>
    </header>
    {loading ? <SummaryLoader key={`${month}-${attempt}`} monthLabel={monthLabel} />
      : error ? <div className="monthly-ai-summary-error">
        <p className="inline-error" role="alert">{error}</p>
        <button type="button" className="button button-secondary" onClick={generateSummary}><Icon name="reset" size={15} />Retry summary</button>
      </div>
        : !summary ? <div className="monthly-ai-summary-invite">
          <span className="monthly-ai-summary-invite-icon" aria-hidden="true"><Icon name="sparkle" size={25} /></span>
          <div>
            <h3>A fresh perspective on your month</h3>
            <p>Discover spending trends and savings opportunities for {monthLabel}. Generate your AI summary when you're ready.</p>
          </div>
          <button type="button" className="button button-primary" onClick={generateSummary}><Icon name="sparkle" size={16} />Generate insights</button>
        </div> : <>
          <p className="monthly-ai-summary-introduction">{summary.card.introduction}</p>
          {summary.card.insights.length > 0 ? <ul className="monthly-ai-summary-list">
            {summary.card.insights.map((insight, index) => <li key={`${insight.type}-${index}`}>
              <span className={`monthly-ai-summary-icon${["trend", "saving", "progress"].includes(insight.type) ? ` monthly-ai-summary-icon--${insight.type}` : ""}`}>
                <Icon name={insightIcon(insight.type)} size={19} />
              </span>
              <div><h3>{insight.title}</h3><p>{insight.message}</p></div>
            </li>)}
          </ul> : <p className="monthly-ai-summary-status">No insights are available for this month yet.</p>}
          {summary.source === "ai" && <p className="monthly-ai-summary-disclaimer">AI-generated insights. Check your records before making financial decisions.</p>}
        </>}
  </section>;
}
