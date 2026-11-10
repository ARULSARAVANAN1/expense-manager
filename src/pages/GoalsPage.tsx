import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Icon from "../components/Icon";
import {
  ConfirmDialog,
  GoalAssistantPanel,
  GoalCard,
  GoalRecommendations,
  GoalSummaryCard,
} from "../components/goals/GoalComponents";
import { deleteGoal, getGoals, updateGoalStatus } from "../services/goals.service";
import type { FinancialGoal } from "../types/goals";
import { formatCurrency } from "../utils.ts/finance";
import "./GoalsPage.css";

function GoalsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(() => {
    const state = location.state as { notice?: string } | null;
    return state?.notice ?? "";
  });
  const [pendingDelete, setPendingDelete] = useState<FinancialGoal | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const state = location.state as { notice?: string } | null;
    if (state?.notice) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    let active = true;
    void getGoals().then((data) => {
      if (active) { setGoals(data); setError(""); }
    }).catch((loadError: unknown) => {
      if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load financial goals.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [reload]);

  const totals = useMemo(() => {
    const activeGoals = goals.filter((goal) => goal.status !== "Completed" && goal.status !== "Paused");
    return {
      saved: goals.reduce((sum, goal) => sum + goal.currentAmount, 0),
      target: goals.reduce((sum, goal) => sum + goal.targetAmount, 0),
      active: activeGoals.length,
      monthly: activeGoals.reduce((sum, goal) => sum + goal.monthlyContribution, 0),
    };
  }, [goals]);

  async function removeGoal() {
    if (!pendingDelete || busy) return;
    setBusy(true);
    try {
      await deleteGoal(pendingDelete.id);
      setGoals((current) => current.filter((goal) => goal.id !== pendingDelete.id));
      setNotice(`${pendingDelete.name} deleted.`);
      setError("");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete this goal.");
    } finally {
      setPendingDelete(null);
      setBusy(false);
    }
  }

  async function togglePause(goal: FinancialGoal) {
    if (busy) return;
    setBusy(true);
    try {
      const updated = await updateGoalStatus(goal.id, goal.status === "Paused" ? "On Track" : "Paused");
      setGoals((current) => current.map((item) => item.id === goal.id ? updated : item));
      setNotice(goal.status === "Paused" ? `${goal.name} resumed.` : `${goal.name} paused.`);
      setError("");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to update this goal.");
    } finally {
      setBusy(false);
    }
  }

  const assistantGoal = goals.find((goal) => goal.status !== "Completed" && goal.status !== "Paused") ?? goals[0];

  return (
    <div className="financial-goals-page">
      <PageHeader
        title="Financial Goals"
        subtitle="Turn your financial dreams into achievable plans."
        action={<Link className="button button-primary" to="/app/goals/new"><Icon name="plus" size={18} />Create Goal</Link>}
      />
      {notice && <div className="toast-message" role="status">{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss notification">×</button></div>}
      {error && <div className="inline-error" role="alert">{error}<button type="button" className="button button-secondary" disabled={busy || loading} onClick={() => { setLoading(true); setReload((value) => value + 1); }}>Retry</button></div>}
      {loading && <div className="goal-loading" role="status"><span className="goal-loading-spinner" />Loading your goals…</div>}
      {busy && !pendingDelete && <div className="goal-loading" role="status"><span className="button-spinner" aria-hidden="true" />Updating goal...</div>}
      {!loading && (!error || goals.length > 0) && <>
        <section className="goal-summary-grid" aria-label="Goal summary">
          <GoalSummaryCard title="Total saved" value={formatCurrency(totals.saved)} detail="Across all your goals" icon="wallet" tone="emerald" />
          <GoalSummaryCard title="Total target amount" value={formatCurrency(totals.target)} detail={`${goals.length} financial ${goals.length === 1 ? "goal" : "goals"}`} icon="target" tone="purple" />
          <GoalSummaryCard title="Active goals" value={String(totals.active)} detail="Ready for your next contribution" icon="flag" tone="amber" />
          <GoalSummaryCard title="Monthly savings commitment" value={formatCurrency(totals.monthly)} detail="Planned across active goals" icon="income" tone="emerald" />
        </section>

        {assistantGoal && <section className="goal-assistant-section">
          <GoalAssistantPanel goal={assistantGoal} recommendation />
          <button className="goal-recommendation-toggle" type="button" aria-expanded={showRecommendations} onClick={() => setShowRecommendations((shown) => !shown)}>
            {showRecommendations ? "Hide recommendations" : "View Recommendations"}<Icon name={showRecommendations ? "back" : "next"} size={15} />
          </button>
          {showRecommendations && <div className="goal-recommendations-expanded"><GoalRecommendations goal={assistantGoal} /></div>}
        </section>}

        <section className="goal-grid-section">
          <div className="goal-grid-heading"><div><h2>Your goals</h2><p>Keep an eye on progress and stay close to what matters.</p></div><span className="goal-count">{goals.length} {goals.length === 1 ? "goal" : "goals"}</span></div>
          {goals.length ? <div className="goal-grid">
            {goals.map((goal) => <GoalCard key={goal.id} goal={goal} disabled={busy} onDelete={setPendingDelete} onTogglePause={togglePause} />)}
          </div> : <div className="goal-empty-state"><span><Icon name="target" size={25} /></span><h3>No financial goals yet</h3><p>Create a goal for something you are looking forward to and start building your savings plan.</p><Link className="button button-primary" to="/app/goals/new"><Icon name="plus" size={17} />Create your first goal</Link></div>}
        </section>
      </>}
      {pendingDelete && <ConfirmDialog busy={busy} title="Delete this goal?" message={`“${pendingDelete.name}” and its contribution history will be permanently deleted from your account.`} onCancel={() => setPendingDelete(null)} onConfirm={removeGoal} />}
    </div>
  );
}

export default GoalsPage;
