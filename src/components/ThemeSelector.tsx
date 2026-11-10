import { useTheme, type Appearance } from "../hooks/useTheme";

export default function ThemeSelector() {
  const { appearance, setAppearance, persistenceError } = useTheme();
  return (
    <div className="theme-selector">
      <label>
        <span>Appearance</span>
        <select
          aria-label="Appearance"
          value={appearance}
          onChange={(event) => setAppearance(event.target.value as Appearance)}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </label>
      {persistenceError && <p className="field-error" role="alert">{persistenceError}</p>}
    </div>
  );
}
