import React, { useEffect, useRef, useState } from "react";

export default function FileHeader({
  user,
  theme,
  selectedCount,
  onNewFolder,
  onUpload,
  onDelete,
  onToggleTheme,
  onLogout,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef(null);

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!headerRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("click", closeOnOutsideClick);
    return () => document.removeEventListener("click", closeOnOutsideClick);
  }, []);

  function runAction(action) {
    setMenuOpen(false);
    action();
  }

  return (
    <header ref={headerRef}>
      <h1>File Server</h1>
      <button
        id="menu-toggle"
        className="menu-toggle"
        type="button"
        aria-label={menuOpen ? "Close actions menu" : "Open actions menu"}
        aria-expanded={menuOpen}
        aria-controls="header-actions"
        onClick={() => setMenuOpen(open => !open)}
      >
        <span></span><span></span><span></span>
      </button>
      <div id="header-actions" className={`controls${menuOpen ? " is-open" : ""}`}>
        <button type="button" onClick={() => runAction(onNewFolder)}>📁 New folder</button>
        <button type="button" onClick={() => runAction(onUpload)}>⬆️ Upload</button>
        <button
          type="button"
          className="danger"
          disabled={!selectedCount}
          onClick={() => runAction(onDelete)}
        >
          🗑️ Delete{selectedCount ? ` (${selectedCount})` : ""}
        </button>
        <button id="theme-toggle" type="button" title="Toggle theme" onClick={onToggleTheme}>
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
        <button type="button" onClick={() => runAction(onLogout)}>
          Sign out · {user.username}
        </button>
      </div>
    </header>
  );
}