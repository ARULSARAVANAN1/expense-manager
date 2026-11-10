import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Icon from "../components/Icon";
import {
  ConfirmDialog,
  ContributionDialog,
  ContributionHistory,
  GoalAssistantPanel,
  GoalMilestones,
  GoalProgress,
  GoalProgressChart,
  GoalScenarioPlanner,
} from "../components/goals/GoalComponents";
import { goalCategoryIcons } from "../components/goals/goal-icons";
import {
  addGoalContribution,
  deleteGoal,
  deleteGoalContribution,
  getGoal,
  saveGoal,
  updateGoalStatus,
} from "../services/goals.service";
import type { FinancialGoal, GoalContribution } from "../types/goals";
import { formatCurrency } from "../utils.ts/finance";
import "./GoalDetailsPage.css";

function formatTargetDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function GoalDetailsPage() {
  const { goalId = "" } = useParams();
  const navigate = useNavigate();
  const [goal, setGoal] = useState<FinancialGoal>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showContribution, setShowContribution] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"delete-goal" | GoalContribution | null>(null);
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    void getGoal(goalId).then((current) => {
      if (active) { setGoal(current); setError(""); }
    }).catch((loadError: unknown) => {
      if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load this goal.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [goalId, reload]);

  function retryLoad() {
    setError("");
    setLoading(true);
    setReload((value) => value + 1);
  }

  async function addContribution(contribution: Omit<GoalContribution, "id">) {
    if (busy) return;
    setBusy(true);
    try {
      await addGoalContribution(goalId, contribution);
      setGoal(await getGoal(goalId));
      setShowContribution(false);
      setNotice("Contribution added to your goal.");
      setError("");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to add this contribution.");
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (busy) return;
    setBusy(true);
    try {
      if (confirmAction === "delete-goal") {
        await deleteGoal(goalId);
        navigate("/app/goals", { state: { notice: "Goal deleted." } });
        return;
      }
      if (confirmAction) {
        await deleteGoalContribution(goalId, confirmAction.id);
        setNotice("Contribution removed.");
        setGoal(await getGoal(goalId));
      }
      setError("");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to complete this action.");
    } finally {
      setConfirmAction(null);
      setBusy(false);
    }
  }

  async function togglePause() {
    if (!goal || busy) return;
    setBusy(true);
    try {
      const updated = await updateGoalStatus(goal.id, goal.status === "Paused" ? "On Track" : "Paused");
      setGoal({ ...updated, contributions: goal.contributions });
      setNotice(goal.status === "Paused" ? "Goal resumed." : "Goal paused.");
      setError("");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to update this goal.");
    } finally {
      setBusy(false);
    }
  }

  async function applyMonthlyPlan(monthlyContribution: number) {
    if (!goal || busy) return;
    setBusy(true);
    try {
      const updated = await saveGoal({
        name: goal.name,
        category: goal.category,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        targetDate: goal.targetDate,
        priority: goal.priority,
        monthlyContribution,
      }, goal.id);
      setGoal({ ...updated, contributions: goal.contributions });
      setNotice(`Monthly plan updated to ${formatCurrency(monthlyContribution)}.`);
      setError("");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update the monthly plan.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="goal-loading" role="status">Loading goal…</div>;
  if (!goal) return (
    <div className="goal-detail-page">
      {error && <div className="inline-error" role="alert">{error}</div>}
      <section className="goal-detail-not-found content-card"><Icon name="target" size={28} /><h2>Unable to load this goal</h2><p>Check your connection and try again. The goal may also have been removed.</p><button type="button" className="button button-secondary" onClick={retryLoad}>Retry</button><Link className="button button-secondary" to="/app/goals">Back to Financial Goals</Link></section>
    </div>
  );

  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  const progress = goal.targetAmount ? Math.min(100, Math.round(goal.currentAmount / goal.targetAmount * 100)) : 0;
  return (
    <div className="goal-detail-page">
      <Link className="back-link" to="/app/goals"><Icon name="back" size={16} />Back to Financial Goals</Link>
      <PageHeader title={goal.name} subtitle={`${goal.category} · Target date ${formatTargetDate(goal.targetDate)}`} action={
        <div className="goal-detail-header-actions">
          <Link className="button button-secondary" to={`/app/goals/${goal.id}/edit`}><Icon name="edit" size={16} />Edit Goal</Link>
          <button className="button button-secondary" type="button" disabled={busy || goal.status === "Completed"} onClick={togglePause}><Icon name={goal.status === "Paused" ? "next" : "pause"} size={16} />{goal.status === "Paused" ? "Resume" : "Pause"}</button>
          <button className="goal-detail-delete" type="button" disabled={busy} onClick={() => setConfirmAction("delete-goal")} aria-label="Delete goal"><Icon name="delete" size={17} /></button>
        </div>
      } />
      {notice && <div className="toast-message" role="status">{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss notification">×</button></div>}
      {error && <div className="inline-error" role="alert">{error}<button type="button" className="button button-secondary" disabled={busy} onClick={retryLoad}>Reload goal</button></div>}
      {busy && !showContribution && !confirmAction && <div className="goal-loading" role="status"><span className="button-spinner" aria-hidden="true" />Updating goal...</div>}

      <section className="goal-overview-card content-card">
        <div className="goal-overview-main">
          <div className="goal-overview-heading"><span className="goal-overview-icon"><Icon name={goalCategoryIcons[goal.category]} size={25} /></span><div><span className={`goal-status goal-status-${goal.status.toLowerCase().replace(/\s+/g, "-")}`}>{goal.status}</span><h2>{goal.name}</h2><p>{goal.category} · {goal.priority} priority</p></div></div>
          <div className="goal-overview-values">
            <div><span>Current savings</span><strong>{formatCurrency(goal.currentAmount)}</strong></div>
            <div><span>Target amount</span><strong>{formatCurrency(goal.targetAmount)}</strong></div>
            <div><span>Still to save</span><strong>{formatCurrency(remaining)}</strong></div>
          </div>
          <GoalProgress goal={goal} />
          <div className="goal-overview-progress-label"><strong>{progress}% complete</strong><span>Target {formatTargetDate(goal.targetDate)}</span></div>
        </div>
        <aside className="goal-overview-plan"><span className="goal-plan-icon"><Icon name="income" size={20} /></span><span>Monthly contribution</span><strong>{formatCurrency(goal.monthlyContribution)}</strong><small>Based on your current savings plan</small><button disabled={busy} className="button button-primary" type="button" onClick={() => { setError(""); setShowContribution(true); }}><Icon name="plus" size={17} />Add Contribution</button></aside>
      </section>

      <div className="goal-detail-grid">
        <section className="content-card goal-detail-progress">
          <div className="card-heading"><div><h3>Your progress</h3><p>Actual savings compared with your monthly plan.</p></div></div>
          <GoalProgressChart goal={goal} />
          <div className="goal-milestone-heading"><strong>Milestones</strong><span>Keep going, every step counts.</span></div>
          <GoalMilestones goal={goal} />
        </section>
        <GoalScenarioPlanner goal={goal} disabled={busy} onApply={applyMonthlyPlan} />
      </div>

      <section className="content-card goal-contributions-section">
        <div className="card-heading"><div><h3>Contribution history</h3><p>Every deposit brings you closer to this goal.</p></div><button disabled={busy} className="button button-secondary" type="button" onClick={() => { setError(""); setShowContribution(true); }}><Icon name="plus" size={16} />Add Contribution</button></div>
        <ContributionHistory contributions={goal.contributions} disabled={busy} onDelete={setConfirmAction} />
      </section>
      <GoalAssistantPanel goal={goal} disabled={busy} onAccept={applyMonthlyPlan} onModify={() => document.getElementById("goal-monthly-slider")?.focus()} />

      {showContribution && <ContributionDialog busy={busy} error={error} onClose={() => setShowContribution(false)} onSave={addContribution} />}
      {confirmAction && <ConfirmDialog
        busy={busy}
        title={confirmAction === "delete-goal" ? "Delete this goal?" : "Remove this contribution?"}
        message={confirmAction === "delete-goal"
          ? `“${goal.name}” and its contribution history will be permanently deleted from your account.`
          : `Remove ${formatCurrency(confirmAction.amount)} from the saved amount for this goal?`}
        onCancel={() => setConfirmAction(null)}
        onConfirm={confirm}
      />}
    </div>
  );
}

export default GoalDetailsPage;
