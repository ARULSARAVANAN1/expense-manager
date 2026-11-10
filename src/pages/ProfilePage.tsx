import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Icon from "../components/Icon";
import { useAuth } from "../contexts/AuthContext";
import "./ProfilePage.css";

export default function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? "");
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [nameOpen, setNameOpen] = useState(false);
  const [preferredCurrency, setPreferredCurrency] = useState(user?.preferredCurrency ?? "INR");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const updates: { name?: string; preferredCurrency?: string } = {};
    if (name.trim() !== user?.name) updates.name = name.trim();
    if (preferredCurrency !== (user?.preferredCurrency ?? "INR")) updates.preferredCurrency = preferredCurrency;
    if (!Object.keys(updates).length) return;

    setSaving(true);
    setError("");
    setNotice("");
    try {
      await updateProfile(updates);
      setNotice("Profile updated.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update your profile.");
    } finally {
      setSaving(false);
    }
  }

  async function savePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentPassword || !newPassword) {
      setError("Enter your current and new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The new password and confirmation do not match.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await changePassword(currentPassword, newPassword);
      navigate("/login", { replace: true, state: { message: "Password changed. Please sign in again." } });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to change your password.");
    } finally {
      setSaving(false);
    }
  }

  return <>
    <PageHeader title="Your profile" subtitle="Account details and password settings." />
    <section className="content-card profile-account-card" aria-labelledby="current-account-title">
      <div className="profile-avatar" aria-hidden="true">{user?.name?.slice(0, 1).toUpperCase() || "U"}</div>
      <div className="profile-account-identity"><h3 id="current-account-title">{user?.name ?? "Your account"}</h3><p>{user?.email}</p></div>
      <span className="profile-selected-account"><Icon name="check" size={15} />Current account</span>
    </section>
    <div className="profile-update-grid">
      <section className="content-card profile-setting-card">
        <div className="card-heading"><div><h3>Display name</h3><p>Your name across the application.</p></div><Icon name="profile" /></div>
        <strong className="profile-current-name">{name || user?.name}</strong>
        <button className="text-link" type="button" aria-expanded={nameOpen} aria-controls="profile-name-fields" onClick={() => setNameOpen(!nameOpen)}><Icon name="edit" size={15} />{nameOpen ? "Hide editor" : "Edit name"}</button>
        {nameOpen && <label className="field-label" id="profile-name-fields">Name<input required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" aria-describedby="profile-api-notice" /></label>}
        <p className="field-hint"><Icon name="lock" size={13} />Email cannot be changed.</p>
      </section>
    <section className="content-card profile-setting-card">
      <div className="card-heading"><div><h3>Preferred currency</h3><p>A preference saved with your user information.</p></div><Icon name="rupee" /></div>
      <label className="field-label">Preferred currency
        <select value={preferredCurrency} onChange={(event) => setPreferredCurrency(event.target.value)} aria-describedby="currency-preference-help">
          <option value="INR">INR - Indian Rupee</option>
          <option value="USD">USD - US Dollar</option>
          <option value="EUR">EUR - Euro</option>
          <option value="GBP">GBP - British Pound</option>
          <option value="AED">AED - UAE Dirham</option>
          <option value="SGD">SGD - Singapore Dollar</option>
          <option value="AUD">AUD - Australian Dollar</option>
          <option value="CAD">CAD - Canadian Dollar</option>
          <option value="JPY">JPY - Japanese Yen</option>
        </select>
      </label>
      <p className="field-hint" id="currency-preference-help">Amounts remain in INR. This preference does not convert existing transactions.</p>
    </section>
    </div>
    {error && <div className="inline-error" role="alert">{error}</div>}
    {notice && <div className="toast-message" role="status">{notice}</div>}
    <form className="profile-update-footer" onSubmit={saveProfile}>
      <p className="profile-api-notice" role="status" id="profile-api-notice">Name and currency are saved to your account. Currency selection does not convert existing amounts.</p>
      <div className="form-actions"><button className="button button-secondary" type="button" disabled={saving || (name === (user?.name ?? "") && preferredCurrency === (user?.preferredCurrency ?? "INR"))} onClick={() => { setName(user?.name ?? ""); setPreferredCurrency(user?.preferredCurrency ?? "INR"); }}>Reset changes</button><button className="button button-primary" disabled={saving || (name === (user?.name ?? "") && preferredCurrency === (user?.preferredCurrency ?? "INR"))}>{saving ? "Saving…" : "Save profile"}</button></div>
    </form>
      <section className="content-card manage-form profile-security-card">
        <div className="card-heading"><div><h3>Security</h3><p>Keep your account protected with a strong password.</p></div><Icon name="lock" /></div>
        <button className="button button-secondary" aria-expanded={passwordOpen} aria-controls="profile-password-fields" onClick={() => setPasswordOpen(!passwordOpen)}><Icon name="lock" size={16} />{passwordOpen ? "Cancel password change" : "Change password"}</button>
        {passwordOpen && <form className="profile-password-fields" id="profile-password-fields" onSubmit={savePassword}>
          <label className="field-label">Current password<input required type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" /></label>
          <label className="field-label">New password<input required type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" /></label>
          <label className="field-label">Confirm new password<input required type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" /></label>
          <button className="button button-primary" disabled={saving}>{saving ? "Updating…" : "Update password"}</button>
        </form>}
      </section>
  </>;
}
