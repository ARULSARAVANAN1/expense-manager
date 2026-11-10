import { useState } from "react";
import PageHeader from "../components/PageHeader";
import Icon from "../components/Icon";
import { useAuth } from "../contexts/AuthContext";
import "./ProfilePage.css";

export default function ProfilePage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [nameOpen, setNameOpen] = useState(false);
  const [preferredCurrency, setPreferredCurrency] = useState("");

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
          <option value="">Select preferred currency</option>
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
    <div className="profile-update-footer">
      <p className="profile-api-notice" role="status" id="profile-api-notice">Name and currency will save together through one user-update API. Saving is unavailable until its contract is connected; drafts are not persisted.</p>
      <div className="form-actions"><button className="button button-secondary" disabled={name === (user?.name ?? "") && !preferredCurrency} onClick={() => { setName(user?.name ?? ""); setPreferredCurrency(""); }}>Reset changes</button><button className="button button-primary" disabled aria-describedby="profile-api-notice">Save profile (API required)</button></div>
    </div>
      <section className="content-card manage-form profile-security-card">
        <div className="card-heading"><div><h3>Security</h3><p>Keep your account protected with a strong password.</p></div><Icon name="lock" /></div>
        <button className="button button-secondary" aria-expanded={passwordOpen} aria-controls="profile-password-fields" onClick={() => setPasswordOpen(!passwordOpen)}><Icon name="lock" size={16} />{passwordOpen ? "Cancel password change" : "Change password"}</button>
        {passwordOpen && <div className="profile-password-fields" id="profile-password-fields">
          <p className="field-hint">Password updates are unavailable until the backend is connected.</p>
          <label className="field-label">Current password<input type="password" disabled autoComplete="current-password" /></label>
          <label className="field-label">New password<input type="password" disabled autoComplete="new-password" /></label>
          <label className="field-label">Confirm new password<input type="password" disabled autoComplete="new-password" /></label>
          <button className="button button-primary" disabled aria-describedby="profile-api-notice">Update password (API required)</button>
        </div>}
      </section>
  </>;
}
