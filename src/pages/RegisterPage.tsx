import { useState } from "react";
import { Link } from "react-router-dom";
import FormInput from "../components/FormInput";
import "./RegisterPage.css";

function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");

        if (!name.trim()) {
            setError("Name is required");
            return;
        }

        if (!email.trim()) {
            setError("Email is required");
            return;
        }

        if (!password) {
            setError("Password is required");
            return;
        }

        if (password.length < 6) {
            setError("Password must contain at least 6 characters");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        console.log({
            name,
            email,
            password,
            confirmPassword,
        });
    }

    return (
        <div className="register-page">
            <section className="register-card">
                <p className="register-eyebrow">Expense Finance Manager</p>
                <h1>Create your account</h1>
                <p className="register-subtitle">
                    Set up your workspace to track expenses, monitor income, and plan smarter budgets.
                </p>

                <form className="register-form" onSubmit={handleSubmit}>
                    {error && <p className="register-error">{error}</p>}

                    <FormInput
                        label="Name"
                        type="text"
                        value={name}
                        onChange={setName}
                    />

                    <FormInput
                        label="Email"
                        type="email"
                        value={email}
                        onChange={setEmail}
                    />

                    <FormInput
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={setPassword}
                    />

                    <FormInput
                        label="Confirm Password"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                    />

                    <div className="register-actions">
                        <button
                            className="secondary-button"
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? "Hide Passwords" : "Show Passwords"}
                        </button>
                        <button className="primary-button" type="submit">
                            Create Account
                        </button>
                    </div>
                </form>

                <p className="login-text">
                    Already have an account? <Link to="/login">Sign In</Link>
                </p>
            </section>
        </div>
    );
}

export default RegisterPage;