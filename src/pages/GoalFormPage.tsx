import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Icon from "../components/Icon";
import { GoalForm } from "../components/goals/GoalComponents";
import { getGoal, saveGoal } from "../services/goals.service";
import type { FinancialGoal, GoalInput } from "../types/goals";
import "./GoalFormPage.css";

function GoalFormPage() {
  const { goalId } = useParams();
  const navigate = useNavigate();
  const [goal, setGoal] = useState<FinancialGoal>();
  const [loading, setLoading] = useState(Boolean(goalId));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!goalId) return;
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

  async function handleSave(input: GoalInput) {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await saveGoal(input, goalId);
      navigate("/app/goals", { state: { notice: goalId ? "Goal updated." : "Goal created." } });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save this goal.");
    } finally {
      setSaving(false);
    }
  }

  const editing = Boolean(goalId);
  return (
    <div className="goal-form-page">
      <Link className="back-link" to="/app/goals"><Icon name="back" size={16} />Back to Financial Goals</Link>
      <PageHeader title={editing ? "Edit Goal" : "Create a Goal"} subtitle={editing ? "Update your plan and keep your goal within reach." : "Turn something you care about into a clear savings plan."} />
      {error && <div className="inline-error" role="alert">{error}</div>}
      {loading ? <div className="goal-loading" role="status">Loading goal…</div>
        : editing && !goal ? <section className="goal-form-error content-card"><Icon name="warning" size={22} /><h3>Unable to load this goal</h3><p>Check your connection and try again.</p><button className="button button-secondary" type="button" onClick={() => { setError(""); setLoading(true); setReload((value) => value + 1); }}>Retry</button><Link className="button button-secondary" to="/app/goals">Return to goals</Link></section>
          : <GoalForm key={goalId ?? "new"} initial={goal} saving={saving} onSave={handleSave} onCancel={() => navigate("/app/goals")} />}
    </div>
  );
}

export default GoalFormPage;
