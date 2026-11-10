type FinanceTone = "income" | "expense" | "positive" | "negative" | "warning";

interface SummaryCardProps {
  label: string;
  value: string;
  detail: string;
  icon: string;
  tone?: string;
  valueTone?: FinanceTone;
  detailTone?: FinanceTone;
  featured?: boolean;
  loading?: boolean;
  unavailable?: boolean;
  surfaceTone?: "income" | "expense" | "purple" | "warning";
}

function SummaryCard({ label, value, detail, icon, tone = "blue", valueTone, detailTone, featured = false, loading = false, unavailable = false, surfaceTone }: SummaryCardProps) {
  return (
    <article className={`summary-card${featured ? " summary-card--featured" : ""}`} aria-busy={loading} data-surface-tone={loading || unavailable ? undefined : surfaceTone}>
      <div className={`summary-icon ${tone}`}><Icon name={icon} size={19} /></div>
      <span className="summary-label">{label}</span>
      <strong className="summary-value" data-finance-tone={loading || unavailable ? undefined : valueTone} aria-label={loading ? `Loading ${label.toLowerCase()}` : undefined}>
        {loading ? <span className="summary-skeleton summary-skeleton-value" aria-hidden="true" /> : unavailable ? "Unavailable" : value}
      </strong>
      <span className="summary-detail" data-finance-tone={loading || unavailable ? undefined : detailTone}>
        {loading ? <span className="summary-skeleton summary-skeleton-detail" aria-hidden="true" /> : unavailable ? "Unable to load data" : detail}
      </span>
    </article>
  );
}

export default SummaryCard;
import Icon from "./Icon";
