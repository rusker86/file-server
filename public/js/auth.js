import * as api from "./api.js";
import { showToast } from "./toast.js";
import { initTheme } from "./theme.js";

const authForm = document.querySelector("#auth-form");
const authError = document.querySelector("#auth-error");
const logoutButton = document.querySelector("#logout");

if (document.body.dataset.authMode) {
  initTheme();
}

if (authForm) {
  authForm.addEventListener("submit", async event => {
    event.preventDefault();
    authError.hidden = true;

    const formData = new FormData(authForm);
    const username = formData.get("username");
    const password = formData.get("password");
    const isRegistration = document.body.dataset.authMode === "register";

    if (isRegistration && password !== formData.get("password-confirmation")) {
      authError.textContent = "Passwords do not match.";
      authError.hidden = false;
      return;
    }

    const submitButton = authForm.querySelector("button[type='submit']");
    submitButton.disabled = true;

    try {
      if (isRegistration) {
        await api.register(username, password);
      } else {
        await api.login(username, password);
      }

      window.location.replace("/");
    } catch (error) {
      authError.textContent = error.message || "Authentication failed.";
      authError.hidden = false;
      submitButton.disabled = false;
    }
  });
}

logoutButton?.addEventListener("click", async () => {
  logoutButton.disabled = true;

  try {
    await api.logout();
    window.location.replace("/login.html");
  } catch (error) {
    showToast(error.message || "Could not sign out.", "error");
    logoutButton.disabled = false;
  }
});