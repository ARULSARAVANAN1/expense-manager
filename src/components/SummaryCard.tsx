type FinanceTone = "income" | "expense" | "positive" | "negative" | "warning";

interface SummaryCardProps {
  label: string;
  value: string;
  detail: string;
  icon: string;
  tone?: string;
  valueTone?: FinanceTone;
  detailTone?: FinanceTone;
}

function SummaryCard({ label, value, detail, icon, tone = "blue", valueTone, detailTone }: SummaryCardProps) {
  return (
    <article className="summary-card">
      <div className={`summary-icon ${tone}`}><Icon name={icon} size={19} /></div>
      <span className="summary-label">{label}</span>
      <strong className="summary-value" data-finance-tone={valueTone}>{value}</strong>
      <span className="summary-detail" data-finance-tone={detailTone}>{detail}</span>
    </article>
  );
}

export default SummaryCard;
import Icon from "./Icon";
