import { Link } from "react-router-dom";
import "./LoginPage.css";

function LoginPage() {
    return (
        <div className="login-page">
            <section className="login-card">
                <p className="login-eyebrow">Expense Finance Manager</p>
                <h1>Welcome back</h1>
                <p className="login-subtitle">
                    Sign in to monitor spending, control your budget, and keep your goals on track.
                </p>

                <form className="login-form" onSubmit={(event) => event.preventDefault()}>
                    <label htmlFor="email">Email</label>
                    <input id="email" type="email" placeholder="you@example.com" />

                    <label htmlFor="password">Password</label>
                    <input id="password" type="password" placeholder="Enter password" />

                    <button className="login-button" type="submit">
                        Sign In
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