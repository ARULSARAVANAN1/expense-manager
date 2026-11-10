import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Icon from "../Icon";
import type { FinancialGoal, GoalCategory, GoalContribution, GoalInput } from "../../types/goals";
import { formatCurrency } from "../../utils.ts/finance";
import { goalCategoryIcons } from "./goal-icons";
import "./GoalComponents.css";

const categories: GoalCategory[] = ["Emergency Fund", "Travel", "Gadgets", "Vehicle", "Education", "Home", "Wedding", "Debt Repayment", "Other"];

function formatGoalDate(value: string) {
  if (!value) return "Choose a date";
  return new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function monthsUntil(dateValue: string): number {
  const date = new Date(`${dateValue}T00:00:00`);
  const now = new Date();
  return Math.max(1, (date.getFullYear() - now.getFullYear()) * 12 + date.getMonth() - now.getMonth());
}

export function GoalSummaryCard({ title, value, detail, icon, tone }: {
  title: string; value: string; detail: string; icon: string; tone: string;
}) {
  return (
    <article className="goal-summary-card">
      <span className={`goal-summary-icon ${tone}`}><Icon name={icon} size={19} /></span>
      <span className="goal-summary-title">{title}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

export function GoalProgress({ goal, compact = false }: { goal: FinancialGoal; compact?: boolean }) {
  const progress = goal.targetAmount > 0 ? Math.min(100, Math.round(goal.currentAmount / goal.targetAmount * 100)) : 0;
  return (
    <div className={`goal-progress${compact ? " is-compact" : ""}`}>
      <div className="goal-progress-track" role="progressbar" aria-label={`${goal.name} progress`} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="goal-progress-labels"><span>{progress}% saved</span><span>{formatCurrency(goal.targetAmount)}</span></div>
    </div>
  );
}

export function GoalCard({ goal, disabled = false, onDelete, onTogglePause }: {
  goal: FinancialGoal; disabled?: boolean; onDelete: (goal: FinancialGoal) => void; onTogglePause: (goal: FinancialGoal) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  return (
    <article className="goal-card">
      <div className="goal-card-heading">
        <span className={`goal-icon goal-icon-${goal.category.toLowerCase().replace(/\s+/g, "-")}`}><Icon name={goalCategoryIcons[goal.category]} size={21} /></span>
        <div className="goal-card-title"><span>{goal.category}</span><h3>{goal.name}</h3></div>
        <span className={`goal-status goal-status-${goal.status.toLowerCase().replace(/\s+/g, "-")}`}>{goal.status}</span>
      </div>
      <div className="goal-card-amounts">
        <div><span>Saved so far</span><strong>{formatCurrency(goal.currentAmount)}</strong></div>
        <div><span>Remaining</span><strong>{formatCurrency(remaining)}</strong></div>
      </div>
      <GoalProgress goal={goal} compact />
      <div className="goal-card-meta">
        <span><Icon name="clock" size={15} /> Due {formatGoalDate(goal.targetDate)}</span>
        <span><Icon name="income" size={15} /> {formatCurrency(goal.monthlyContribution)}/mo</span>
      </div>
      <div className="goal-card-actions">
        <Link className="button button-secondary" to={`/app/goals/${goal.id}`}>View Details</Link>
        <Link className="goal-icon-action" to={`/app/goals/${goal.id}/edit`} aria-label={`Edit ${goal.name}`} title="Edit goal"><Icon name="edit" size={17} /></Link>
        <div className="goal-more-wrap">
          <button className="goal-icon-action" type="button" disabled={disabled} aria-label={`More actions for ${goal.name}`} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><Icon name="more" size={18} /></button>
          {menuOpen && <div className="goal-more-menu">
            <button type="button" disabled={disabled || goal.status === "Completed"} onClick={() => { onTogglePause(goal); setMenuOpen(false); }}><Icon name={goal.status === "Paused" ? "next" : "pause"} size={16} />{goal.status === "Paused" ? "Resume goal" : "Pause goal"}</button>
            <button type="button" disabled={disabled} className="is-danger" onClick={() => { onDelete(goal); setMenuOpen(false); }}><Icon name="delete" size={16} />Delete goal</button>
          </div>}
        </div>
      </div>
    </article>
  );
}

export function GoalMilestones({ goal }: { goal: FinancialGoal }) {
  const progress = goal.targetAmount ? goal.currentAmount / goal.targetAmount * 100 : 0;
  return (
    <div className="goal-milestones" aria-label="Goal milestones">
      {[25, 50, 75, 100].map((milestone) => <div className={`goal-milestone${progress >= milestone ? " is-reached" : ""}`} key={milestone}>
        <span><Icon name="check" size={12} /></span><small>{milestone}%</small>
      </div>)}
    </div>
  );
}

export function GoalProgressChart({ goal }: { goal: FinancialGoal }) {
  const data = Array.from({ length: 7 }, (_, index) => {
    const planned = Math.min(goal.targetAmount, goal.monthlyContribution * index);
    const current = Math.round(goal.currentAmount * index / 6);
    return { month: index === 0 ? "Now" : `M${index}`, planned, actual: index === 6 ? goal.currentAmount : current };
  });
  return (
    <div className="goal-chart-wrap">
      <div className="goal-chart-legend"><span><i className="goal-chart-dot actual" /> Your savings</span><span><i className="goal-chart-dot planned" /> Monthly plan</span></div>
      <div className="goal-progress-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: 4 }}>
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: "var(--chart-axis)", fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis width={66} tickFormatter={(value: number) => value >= 1000 ? `₹${Math.round(value / 1000)}k` : `₹${value}`} tick={{ fill: "var(--chart-axis)", fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ background: "var(--surface)", borderColor: "var(--border)", borderRadius: 10, color: "var(--text-primary)" }} />
            <Line type="monotone" dataKey="actual" name="Your savings" stroke="var(--primary)" strokeWidth={3} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="planned" name="Monthly plan" stroke="var(--success)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ContributionHistory({ contributions, disabled = false, onDelete }: {
  contributions: GoalContribution[]; disabled?: boolean; onDelete: (contribution: GoalContribution) => void;
}) {
  return (
    <div className="contribution-list">
      {contributions.length ? contributions.map((item) => <article className="contribution-row" key={item.id}>
        <span className="contribution-check"><Icon name="check" size={16} /></span>
        <div className="contribution-description"><strong>{item.description}</strong><span>{new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${item.date}T00:00:00`))}</span></div>
        <strong className="contribution-amount">+{formatCurrency(item.amount)}</strong>
        <button className="goal-icon-action" type="button" disabled={disabled} aria-label={`Delete contribution ${item.description}`} onClick={() => onDelete(item)}><Icon name="delete" size={16} /></button>
      </article>) : <div className="goal-inline-empty">No contributions yet. Add your first contribution to start the journey.</div>}
    </div>
  );
}

export function ContributionDialog({ onClose, onSave, busy = false, error }: {
  onClose: () => void; onSave: (value: Omit<GoalContribution, "id">) => void; busy?: boolean; error?: string;
}) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!busy) onSave({ amount: Number(amount), description: description.trim(), date });
  }
  return (
    <div className="goal-dialog-backdrop" onMouseDown={(event) => { if (!busy && event.target === event.currentTarget) onClose(); }}>
      <form className="goal-dialog" role="dialog" aria-modal="true" aria-labelledby="contribution-title" onSubmit={submit}>
        <button className="goal-dialog-close" type="button" disabled={busy} aria-label="Close dialog" onClick={onClose}><Icon name="close" /></button>
        <span className="goal-dialog-icon"><Icon name="plus" /></span><h2 id="contribution-title">Add contribution</h2><p>Record money you have put toward this goal.</p>
        {error && <p className="inline-error" role="alert">{error}</p>}
        <label className="field-label">Amount (INR)<input disabled={busy} type="number" min="0.01" step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" /></label>
        <label className="field-label">Description<input disabled={busy} maxLength={500} required value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Monthly savings" /></label>
        <label className="field-label">Date<input disabled={busy} type="date" required value={date} onChange={(event) => setDate(event.target.value)} /></label>
        <div className="dialog-actions"><button disabled={busy} className="button button-secondary" type="button" onClick={onClose}>Cancel</button><button disabled={busy} className="button button-primary">{busy ? "Saving..." : "Add contribution"}</button></div>
      </form>
    </div>
  );
}

export function ConfirmDialog({ title, message, confirmLabel = "Delete", onCancel, onConfirm, busy = false }: {
  title: string; message: string; confirmLabel?: string; onCancel: () => void; onConfirm: () => void; busy?: boolean;
}) {
  return (
    <div className="goal-dialog-backdrop" onMouseDown={(event) => { if (!busy && event.target === event.currentTarget) onCancel(); }}>
      <section className="goal-dialog confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="goal-confirm-title">
        <span className="goal-dialog-icon danger"><Icon name="warning" /></span><h2 id="goal-confirm-title">{title}</h2><p>{message}</p>
        <div className="dialog-actions"><button disabled={busy} className="button button-secondary" type="button" onClick={onCancel}>Cancel</button><button disabled={busy} className="button button-danger" type="button" onClick={onConfirm}>{busy ? "Deleting..." : confirmLabel}</button></div>
      </section>
    </div>
  );
}

export function GoalAssistantPanel({ goal, onAccept, onModify, recommendation = false, disabled = false }: {
  goal: FinancialGoal; onAccept?: (monthlyAmount: number) => void; onModify?: () => void; recommendation?: boolean; disabled?: boolean;
}) {
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  const months = monthsUntil(goal.targetDate);
  const suggested = remaining === 0
    ? goal.monthlyContribution
    : Math.max(goal.monthlyContribution + 1500, Math.ceil(remaining / months / 500) * 500);
  const increase = Math.max(1500, suggested - goal.monthlyContribution);
  const projectedMonths = Math.max(1, Math.ceil(remaining / Math.max(1, suggested)));
  const projectedDate = new Date();
  projectedDate.setMonth(projectedDate.getMonth() + projectedMonths);
  return (
    <section className="goal-assistant-panel">
      <div className="goal-assistant-heading"><span className="goal-assistant-icon"><Icon name="sparkle" size={20} /></span><div><span>AI Goal Assistant</span><h3>Your Personalized Savings Plan</h3></div><span className="goal-ai-label">AI INSIGHT</span></div>
      <p className="goal-assistant-intro">A practical plan for <strong>{goal.name}</strong>, based on your current progress.</p>
      <div className="goal-assistant-metrics">
        <div><span>Remaining</span><strong>{formatCurrency(remaining)}</strong></div>
        <div><span>Months left</span><strong>{months}</strong></div>
        <div><span>Suggested monthly</span><strong>{formatCurrency(suggested)}</strong></div>
        <div><span>Projected completion</span><strong>{formatGoalDate(projectedDate.toISOString().slice(0, 10))}</strong></div>
      </div>
      <div className="goal-opportunities">
        <span>Small changes that can help</span>
        <ul><li>Reduce food delivery spending.</li><li>Review recurring subscriptions.</li><li>Reduce unnecessary shopping.</li></ul>
      </div>
      {(onAccept || onModify) && <div className="goal-assistant-actions">
        {onModify && <button disabled={disabled} className="button button-secondary" type="button" onClick={onModify}>Modify plan</button>}
        {onAccept && <button disabled={disabled} className="button button-primary" type="button" onClick={() => onAccept(suggested)}>Accept plan</button>}
      </div>}
      {recommendation && <div className="goal-assistant-note"><Icon name="sparkle" size={15} />{remaining === 0 ? `${goal.name} has reached its savings target.` : `Based on your current savings, you could reach your ${goal.name} faster by increasing your monthly contribution by ${formatCurrency(increase)}.`}</div>}
    </section>
  );
}

export function GoalScenarioPlanner({ goal, onApply, disabled = false }: { goal: FinancialGoal; onApply?: (monthlyAmount: number) => void; disabled?: boolean }) {
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  const max = Math.max(20000, Math.ceil(remaining / 500) * 500);
  const [monthly, setMonthly] = useState(Math.min(max, Math.max(1000, goal.monthlyContribution)));
  const months = remaining === 0 ? 0 : Math.ceil(remaining / monthly);
  const projected = new Date();
  projected.setMonth(projected.getMonth() + months);
  return (
    <section className="goal-scenario content-card">
      <div className="card-heading"><div><h3>What-if scenario planner</h3><p>Adjust your monthly savings to see how quickly you could reach this goal.</p></div><Icon name="sparkle" /></div>
      <label className="scenario-slider-label" htmlFor="goal-monthly-slider"><span>Monthly savings</span><strong>{formatCurrency(monthly)}</strong></label>
      <input id="goal-monthly-slider" className="goal-savings-slider" type="range" min="500" max={max} step="500" value={Math.min(monthly, max)} onChange={(event) => setMonthly(Number(event.target.value))} />
      <div className="scenario-slider-ends"><span>{formatCurrency(500)}</span><span>{formatCurrency(max)}</span></div>
      <div className="scenario-results">
        <div><span>Remaining</span><strong>{formatCurrency(remaining)}</strong></div>
        <div><span>Estimated time</span><strong>{months ? `${months} ${months === 1 ? "month" : "months"}` : "Complete"}</strong></div>
        <div><span>Projected date</span><strong>{months ? formatGoalDate(projected.toISOString().slice(0, 10)) : "Reached!"}</strong></div>
      </div>
      {onApply && <button disabled={disabled} className="button button-secondary" type="button" onClick={() => onApply(monthly)}>Use this monthly plan</button>}
    </section>
  );
}

export function GoalForm({ initial, onSave, onCancel, saving = false }: {
  initial?: FinancialGoal; onSave: (input: GoalInput) => void; onCancel: () => void; saving?: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<GoalCategory>(initial?.category ?? "Gadgets");
  const [targetAmount, setTargetAmount] = useState(initial ? String(initial.targetAmount) : "");
  const [currentAmount, setCurrentAmount] = useState(initial ? String(initial.currentAmount) : "0");
  const [targetDate, setTargetDate] = useState(initial?.targetDate ?? (() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString().slice(0, 10);
  }));
  const [priority, setPriority] = useState<GoalInput["priority"]>(initial?.priority ?? "Medium");
  const [monthlyContribution, setMonthlyContribution] = useState(initial ? String(initial.monthlyContribution) : "");
  const [planGenerated, setPlanGenerated] = useState(false);
  const target = Number(targetAmount);
  const saved = Number(currentAmount);
  const preview: FinancialGoal = {
    id: initial?.id ?? "preview",
    name: name.trim() || "Your goal",
    category,
    targetAmount: Math.max(1, target || 1),
    currentAmount: Math.max(0, saved || 0),
    targetDate,
    priority,
    monthlyContribution: Number(monthlyContribution) || 0,
    status: saved >= target && target > 0 ? "Completed" : "On Track",
    createdAt: initial?.createdAt ?? new Date().toISOString(),
    contributions: initial?.contributions ?? [],
  };
  function generatePlan() {
    const remaining = Math.max(0, target - saved);
    const monthly = Math.ceil(remaining / monthsUntil(targetDate) / 500) * 500;
    setMonthlyContribution(String(Math.max(500, monthly)));
    setPlanGenerated(true);
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    onSave({ name: name.trim(), category, targetAmount: target, currentAmount: saved, targetDate, priority, monthlyContribution: Number(monthlyContribution) });
  }
  return (
    <form className="goal-form-layout" onSubmit={submit}>
      <fieldset disabled={saving} className="goal-form-card content-card">
        <div className="card-heading"><div><h3>Goal details</h3><p>Give your goal a clear target and a plan you can keep up with.</p></div></div>
        <label className="field-label">Goal name<input required maxLength={70} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. New laptop" /></label>
        <div className="goal-form-fields">
          <label className="field-label">Goal category<select value={category} onChange={(event) => setCategory(event.target.value as GoalCategory)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="field-label">Priority<select value={priority} onChange={(event) => setPriority(event.target.value as GoalInput["priority"])}>{["High", "Medium", "Low"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="field-label">Target amount (INR)<input type="number" required min="1" step="0.01" value={targetAmount} onChange={(event) => setTargetAmount(event.target.value)} placeholder="80,000" /></label>
          <label className="field-label">{initial ? "Current saved amount (INR)" : "Starting saved amount (INR)"}<input type="number" min="0" max={target || undefined} step="0.01" readOnly={Boolean(initial)} value={currentAmount} onChange={(event) => setCurrentAmount(event.target.value)} placeholder="0" />{initial && <span className="field-hint">Add or remove contributions from the goal details to change savings.</span>}</label>
          <label className="field-label">Target date<input type="date" required min={initial ? undefined : new Date().toISOString().slice(0, 10)} value={targetDate} onChange={(event) => setTargetDate(event.target.value)} /></label>
          <label className="field-label">Monthly savings preference (INR)<input required type="number" min="0.01" step="0.01" value={monthlyContribution} onChange={(event) => { setMonthlyContribution(event.target.value); setPlanGenerated(false); }} placeholder="5,000" /></label>
        </div>
        <button className="goal-generate-plan" type="button" onClick={generatePlan}><Icon name="sparkle" size={17} />Generate AI savings plan</button>
        {planGenerated && <p className="goal-plan-feedback" role="status">Suggested monthly savings: {formatCurrency(Number(monthlyContribution))}</p>}
        <div className="form-actions"><button className="button button-secondary" type="button" onClick={onCancel}>Cancel</button><button className="button button-primary"><Icon name="check" size={17} />{saving ? "Saving..." : initial ? "Save changes" : "Save goal"}</button></div>
      </fieldset>
      <aside className="goal-form-preview content-card">
        <div className="card-heading"><div><h3>Live goal preview</h3><p>Your plan takes shape as you fill in the details.</p></div></div>
        <div className="goal-preview-icon"><Icon name={goalCategoryIcons[category]} size={24} /></div>
        <span className="goal-preview-category">{category}</span>
        <h3 className="goal-preview-name">{preview.name}</h3>
        <div className="goal-preview-amount"><strong>{formatCurrency(preview.currentAmount)}</strong><span>of {formatCurrency(preview.targetAmount)}</span></div>
        <GoalProgress goal={preview} />
        <div className="goal-preview-detail"><span>Target date</span><strong>{formatGoalDate(targetDate)}</strong></div>
        <div className="goal-preview-detail"><span>Monthly savings</span><strong>{formatCurrency(preview.monthlyContribution)}</strong></div>
        <div className="goal-preview-detail"><span>Priority</span><strong className={`goal-priority priority-${priority.toLowerCase()}`}>{priority}</strong></div>
      </aside>
    </form>
  );
}

export function GoalRecommendations({ goal }: { goal: FinancialGoal }) {
  const tips = [
    { title: "Review flexible spending", detail: "Reduce food delivery spending and redirect a small weekly amount toward this goal.", icon: "food" },
    { title: "Check recurring payments", detail: "Review subscriptions and pause anything you no longer use.", icon: "recurring" },
    { title: "Make savings automatic", detail: `Set aside ${formatCurrency(goal.monthlyContribution)} soon after payday to stay consistent.`, icon: "income" },
  ];
  return <section className="goal-recommendations content-card"><div className="card-heading"><div><h3>Recommendations for {goal.name}</h3><p>Simple, sample ideas to help your savings plan stay on track.</p></div></div><div className="goal-recommendation-list">{tips.map((tip) => <article key={tip.title}><span><Icon name={tip.icon} size={17} /></span><div><strong>{tip.title}</strong><p>{tip.detail}</p></div></article>)}</div></section>;
}

export function GoalSection({ title, subtitle, action, children }: {
  title: string; subtitle?: string; action?: ReactNode; children: ReactNode;
}) {
  return <section className="goal-section"><div className="goal-section-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>{children}</section>;
}
