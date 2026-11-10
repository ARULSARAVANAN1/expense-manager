import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { GoogleLogin, GoogleOAuthProvider, type CredentialResponse } from "@react-oauth/google";
import "./LoginPage.css";
import { useAuth } from "../contexts/AuthContext";
import AuthBackground from "../components/AuthBackground";
import ThemeSelector from "../components/ThemeSelector";
import { useTheme } from "../hooks/useTheme";

interface ApiErrorResponse {
    success?: boolean;
    message?: string;
}

function LoginPage() {
    const { resolvedTheme } = useTheme();
    const navigate = useNavigate();
    const { login, loginWithGoogle } = useAuth();
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [googleScriptError, setGoogleScriptError] = useState(false);

    async function handleGoogleSuccess(response: CredentialResponse) {
        if (isSubmitting) return;
        if (!response.credential) {
            setError("Google did not return a sign-in credential. Please try again.");
            return;
        }
        setError("");
        setIsSubmitting(true);
        try {
            await loginWithGoogle(response.credential);
            navigate("/app/dashboard", { replace: true });
        } catch (error) {
            setError(error instanceof AxiosError
                ? error.response?.data?.message ?? "Google sign-in failed. Please try again or sign in with email."
                : error instanceof Error ? error.message : "Unable to sign in with Google.");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (isSubmitting) return;
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
            <div className="auth-appearance"><ThemeSelector /></div>
            <AuthBackground />
            <section className="login-card">
                <p className="login-eyebrow">Expense Finance Manager</p>
                <h1>Welcome back</h1>
                <p className="login-subtitle">
                    Sign in to monitor spending, control your budget, and keep your goals on track.
                </p>

                {error && <p className="login-error" role="alert">{error}</p>}
                <div className="google-signin-section" aria-busy={isSubmitting}>
                    {googleClientId ? <GoogleOAuthProvider clientId={googleClientId} onScriptLoadError={() => setGoogleScriptError(true)}>
                        {googleScriptError ? <p className="login-error" role="alert">Google sign-in could not load. Check your connection or sign in with email.</p> :
                            <fieldset className="google-signin-control" disabled={isSubmitting} inert={isSubmitting}>
                                <legend className="sr-only">Sign in with Google</legend>
                                <GoogleLogin onSuccess={handleGoogleSuccess}
                                    onError={() => setError("Google sign-in was not completed. Please try again or sign in with email.")}
                                    theme={resolvedTheme === "dark" ? "filled_black" : "outline"} size="large" shape="pill" text="signin_with" />
                            </fieldset>}
                    </GoogleOAuthProvider> : <>
                        <button className="google-signin-placeholder" type="button" disabled aria-describedby="google-setup-notice">Sign in with Google</button>
                        <p className="google-setup-notice" id="google-setup-notice">Google sign-in is not configured yet. Please use email and password.</p>
                    </>}
                    {isSubmitting && <p className="google-setup-notice" role="status">Signing in...</p>}
                </div>
                <div className="login-divider"><span>or sign in with email</span></div>
                <form className="login-form" onSubmit={handleSubmit}>

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