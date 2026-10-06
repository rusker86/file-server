import React, { useState } from "react";
import * as api from "../api.js";

export default function AuthPage({ mode }) {
  const isRegistration = mode === "register";
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");

    const form = new FormData(event.currentTarget);
    const username = form.get("username");
    const password = form.get("password");

    if (isRegistration && password !== form.get("password-confirmation")) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      if (isRegistration) {
        await api.register(username, password);
      } else {
        await api.login(username, password);
      }
      window.location.replace("/");
    } catch (requestError) {
      setError(requestError.message || "Authentication failed.");
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-layout">
      <div className="auth-shell">
        <a className="auth-brand" href="/">File Server</a>
        <section className="auth-panel" aria-labelledby="auth-title">
          <p className="auth-kicker">
            {isRegistration ? "A private space for every account" : "Personal file storage"}
          </p>
          <h1 id="auth-title">{isRegistration ? "Create account" : "Sign in"}</h1>
          <p className="auth-description">
            {isRegistration
              ? "Your files will be stored separately from other users."
              : "Continue to your files."}
          </p>

          <form onSubmit={submit}>
            <label>
              Username
              <input
                name="username"
                type="text"
                autoComplete="username"
                minLength={3}
                maxLength={32}
                pattern={isRegistration ? "[A-Za-z0-9._\\-]+" : undefined}
                required
              />
              {isRegistration && (
                <span className="field-hint">
                  3-32 letters, numbers, dots, dashes or underscores
                </span>
              )}
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete={isRegistration ? "new-password" : "current-password"}
                minLength={8}
                maxLength={128}
                required
              />
              {isRegistration && <span className="field-hint">At least 8 characters</span>}
            </label>
            {isRegistration && (
              <label>
                Confirm password
                <input
                  name="password-confirmation"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                />
              </label>
            )}
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="auth-submit" type="submit" disabled={submitting}>
              {submitting ? "Please wait..." : isRegistration ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="auth-switch">
            {isRegistration ? "Already registered? " : "New here? "}
            <a href={isRegistration ? "/login.html" : "/register.html"}>
              {isRegistration ? "Sign in" : "Create an account"}
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}