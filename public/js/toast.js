const toastContainer = document.querySelector("#toast-container");

export function showToast(message, type = "info", duration = 3000) {
  if (!toastContainer) {
    return;
  }

  const toast = document.createElement("div");

  toast.classList.add("toast", type);
  toast.textContent = message;

  toastContainer.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("show"));

  setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, duration);
}
