import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

type FinanceTone = "income" | "expense" | "positive" | "negative" | "warning";

function SummaryValue({ value, animate }: { value: string; animate: boolean }) {
  const match = /^([^0-9]*)([\d,]+(?:\.\d+)?)(.*)$/.exec(value);
  const target = match ? Number(match[2].replace(/,/g, "")) : null;
  const decimals = match?.[2].split(".")[1]?.length ?? 0;
  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const initialValue = animate && target !== null && !reducedMotion ? 0 : target;
  const [current, setCurrent] = useState<number | null>(initialValue);
  const currentRef = useRef<number | null>(initialValue);

  useEffect(() => {
    if (!animate || target === null) {
      currentRef.current = target;
      return;
    }

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionPreference.matches) {
      currentRef.current = target;
      return;
    }

    const startValue = currentRef.current ?? 0;
    const startTime = performance.now();
    let frame = 0;
    const finishImmediately = () => {
      cancelAnimationFrame(frame);
      setCurrent(target);
      currentRef.current = target;
    };
    const animateFrame = (now: number) => {
      const progress = Math.min((now - startTime) / 550, 1);
      const eased = 1 - (1 - progress) ** 3;
      const next = startValue + (target - startValue) * eased;
      currentRef.current = next;
      setCurrent(next);
      if (progress < 1) frame = requestAnimationFrame(animateFrame);
    };

    motionPreference.addEventListener("change", finishImmediately);
    frame = requestAnimationFrame(animateFrame);
    return () => {
      cancelAnimationFrame(frame);
      motionPreference.removeEventListener("change", finishImmediately);
    };
  }, [animate, target]);

  if (!animate || target === null || !match || reducedMotion) return <>{value}</>;
  const number = current ?? 0;
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
  return <>{`${match[1]}${formatted}${match[3]}`}</>;
}

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
  to?: string;
  animateValue?: boolean;
}

function SummaryCard({ label, value, detail, icon, tone = "blue", valueTone, detailTone, featured = false, loading = false, unavailable = false, surfaceTone, to, animateValue = false }: SummaryCardProps) {
  const className = `summary-card${featured ? " summary-card--featured" : ""}`;
  const content = <>
      <div className={`summary-icon ${tone}`}><Icon name={icon} size={19} /></div>
      <span className="summary-label">{label}</span>
      <strong className="summary-value" data-finance-tone={loading || unavailable ? undefined : valueTone} aria-label={loading ? `Loading ${label.toLowerCase()}` : undefined}>
        {loading ? <span className="summary-skeleton summary-skeleton-value" aria-hidden="true" /> : unavailable ? "Unavailable" : <SummaryValue value={value} animate={animateValue} />}
      </strong>
      <span className="summary-detail" data-finance-tone={loading || unavailable ? undefined : detailTone}>
        {loading ? <span className="summary-skeleton summary-skeleton-detail" aria-hidden="true" /> : unavailable ? "Unable to load data" : detail}
      </span>
    </>;
  return to
    ? <Link className={`${className} summary-card-link`} to={to} aria-busy={loading} data-surface-tone={loading || unavailable ? undefined : surfaceTone}>{content}</Link>
    : <article className={className} aria-busy={loading} data-surface-tone={loading || unavailable ? undefined : surfaceTone}>{content}</article>;
}

export default SummaryCard;
import Icon from "./Icon";
