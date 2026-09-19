import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import "./LoginPage.css";
import { useAuth } from "../contexts/AuthContext";

interface ApiErrorResponse {
    success?: boolean;
    message?: string;
}

function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        if (!email.trim()) {
            setError("Email is required");
            return;
        }

        if (!password) {
            setError("Password is required");
            return;
        }

        try {
            setIsSubmitting(true);
            await login({
                email: email.trim(),
                password,
            });

            navigate("/app/dashboard");
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorResponse>;

            const message =
                axiosError.response?.data?.message ??
                "Unable to sign in. Please try again.";

            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="login-page">
            <section className="login-card">
                <p className="login-eyebrow">Expense Finance Manager</p>
                <h1>Welcome back</h1>
                <p className="login-subtitle">
                    Sign in to monitor spending, control your budget, and keep your goals on track.
                </p>

                <form className="login-form" onSubmit={handleSubmit}>
                    {error && <p className="login-error">{error}</p>}

                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        disabled={isSubmitting}
                    />

                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        disabled={isSubmitting}
                    />

                    <button className="login-button" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Signing In..." : "Sign In"}
                    </button>
                </form>

                <p className="register-text">
                    Don&apos;t have an account? <Link to="/register">Create Account</Link>
                </p>
            </section>
        </div>
    );
}

export default LoginPage;