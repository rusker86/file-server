import React from "react";

export default function ToastMessage({ toast }) {
  return (
    <div id="toast-container" aria-live="polite">
      {toast && <div className={`toast ${toast.type} show`}>{toast.message}</div>}
    </div>
  );
}