import React, { useEffect, useRef, useState } from "react";
import * as api from "./api.js";

function joinPath(base, name) {
  const cleanBase = base.replace(/\/+$/, "");
  const cleanName = name.replace(/^\/+/, "");
  return `${cleanBase}/${cleanName}`;
}

function parentPath(path) {
  const parts = path.split("/").filter(Boolean);
  parts.pop();
  return parts.length ? `/${parts.join("/")}` : "";
}

function displayName(file) {
  return file.name.replace(/^\//, "");
}

function isDirectory(file) {
  return file.type === "isDirectory";
}

function canMoveTo(destination, sources) {
  if (!sources.length) {
    return false;
  }

  const normalizedDestination = destination.replace(/\/+$/, "");
  return sources.every(source => {
    const normalizedSource = source.replace(/\/+$/, "");
    return normalizedSource !== normalizedDestination &&
      !normalizedDestination.startsWith(`${normalizedSource}/`);
  });
}

function AuthPage({ mode }) {
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

function Modal({ title, onClose, children, className = "" }) {
  return (
    <div className="modal" onMouseDown={event => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    }}>
      <section className={`modal-content ${className}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-button" type="button" onClick={onClose} aria-label="Close">×</button>
        </div>
        {children}
      </section>
    </div>
  );
}

function FileRow({
  file,
  path,
  selected,
  dropTarget,
  onSelect,
  onOpen,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  setDropTarget,
}) {
  const directory = isDirectory(file);
  const fullPath = joinPath(path, file.name);

  return (
    <li
      className={`file-item ${directory ? "directory" : "file"}${selected ? " selected" : ""}${dropTarget ? " drop-target" : ""}`}
      data-file-name={file.name}
      draggable
      onClick={event => onSelect(file, event)}
      onDoubleClick={() => onOpen(file)}
      onDragStart={event => onDragStart(event, file)}
      onDragEnd={onDragEnd}
      onDragOver={event => {
        if (directory) {
          onDragOver(event, fullPath, file.name);
        }
      }}
      onDragLeave={() => setDropTarget("")}
      onDrop={event => directory && onDrop(event, fullPath)}
      aria-selected={selected}
    >
      <span className="file-icon" aria-hidden="true">{directory ? "📁" : "📄"}</span>
      <span className="file-name">{displayName(file)}</span>
    </li>
  );
}

function FileBrowser({ user, theme, onToggleTheme }) {
  const [currentPath, setCurrentPath] = useState("");
  const [files, setFiles] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [dropTarget, setDropTarget] = useState("");
  const [folderModal, setFolderModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [uploadSelection, setUploadSelection] = useState([]);
  const [busy, setBusy] = useState(false);
  const [selectionBox, setSelectionBox] = useState(null);
  const toastTimer = useRef(null);
  const dragPaths = useRef([]);
  const uploadModalOpen = useRef(false);
  const uploadInput = useRef(null);
  const selectionStart = useRef(null);

  const selectedFiles = files.filter(file => selected.has(file.name));
  const selectedPaths = selectedFiles.map(file => joinPath(currentPath, file.name));

  function notify(message, type = "info") {
    window.clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);
  }

  function refreshFiles() {
    setRevision(value => value + 1);
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    setSelected(new Set());

    api.listFiles(currentPath)
      .then(result => {
        if (active) {
          setFiles(result.files);
          setLoading(false);
        }
      })
      .catch(error => {
        if (!active) {
          return;
        }
        if (error.message === "Authentication required.") {
          window.location.replace("/login.html");
          return;
        }
        notify(error.message || "Could not load the files.", "error");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentPath, revision]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") {
        setContextMenu(null);
        setFolderModal(false);
        setDeleteModal(false);
        if (!busy) {
          setUploadModal(false);
          uploadModalOpen.current = false;
        }
        setMenuOpen(false);
      } else if (
        event.key === "Delete" &&
        selected.size > 0 &&
        !event.target.closest("input, textarea")
      ) {
        setDeleteModal(true);
      }
    }

    function onOutsideClick(event) {
      if (!event.target.closest(".context-menu")) {
        setContextMenu(null);
      }
      if (!event.target.closest("#menu-toggle, #header-actions")) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("click", onOutsideClick);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("click", onOutsideClick);
    };
  }, [busy, selected.size]);

  useEffect(() => {
    function onMouseMove(event) {
      if (!selectionStart.current) {
        return;
      }

      const start = selectionStart.current;
      const rect = {
        left: Math.min(start.x, event.clientX),
        top: Math.min(start.y, event.clientY),
        right: Math.max(start.x, event.clientX),
        bottom: Math.max(start.y, event.clientY),
      };
      setSelectionBox({
        left: rect.left,
        top: rect.top,
        width: rect.right - rect.left,
        height: rect.bottom - rect.top,
      });

      const nextSelection = new Set();
      document.querySelectorAll(".file-item").forEach(item => {
        const itemRect = item.getBoundingClientRect();
        if (
          itemRect.left < rect.right && itemRect.right > rect.left &&
          itemRect.top < rect.bottom && itemRect.bottom > rect.top
        ) {
          nextSelection.add(item.dataset.fileName);
        }
      });
      setSelected(nextSelection);
    }

    function onMouseUp() {
      selectionStart.current = null;
      setSelectionBox(null);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  useEffect(() => {
    uploadModalOpen.current = uploadModal;
  }, [uploadModal]);

  useEffect(() => {
    function hasFiles(event) {
      return Array.from(event.dataTransfer?.types ?? []).includes("Files");
    }

    function onDragOver(event) {
      if (!hasFiles(event)) {
        return;
      }
      event.preventDefault();
      if (!uploadModalOpen.current) {
        document.body.classList.add("file-drop-active");
      }
    }

    function onDragLeave(event) {
      if (event.relatedTarget === null) {
        document.body.classList.remove("file-drop-active");
      }
    }

    function onDrop(event) {
      document.body.classList.remove("file-drop-active");
      if (!hasFiles(event)) {
        return;
      }
      event.preventDefault();
      if (!uploadModalOpen.current) {
        void upload(Array.from(event.dataTransfer.files), false);
      }
    }

    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
      document.body.classList.remove("file-drop-active");
    };
  });

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  function startBoxSelection(event) {
    if (
      event.button !== 0 ||
      event.target.closest(".file-item, button, input, .modal, .context-menu")
    ) {
      return;
    }

    setSelected(new Set());
    selectionStart.current = { x: event.clientX, y: event.clientY };
    setSelectionBox({ left: event.clientX, top: event.clientY, width: 0, height: 0 });
    event.preventDefault();
  }

  function selectFile(file, event) {
    event.stopPropagation();
    setSelected(previous => {
      if (event.ctrlKey || event.metaKey) {
        const next = new Set(previous);
        next.has(file.name) ? next.delete(file.name) : next.add(file.name);
        return next;
      }
      return new Set([file.name]);
    });
  }

  function openFile(file) {
    const path = joinPath(currentPath, file.name);
    if (isDirectory(file)) {
      setCurrentPath(path);
    } else {
      window.location.assign(api.downloadUrl(path));
    }
  }

  function startMoving(event, file) {
    dragPaths.current = selected.has(file.name)
      ? selectedPaths
      : [joinPath(currentPath, file.name)];
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/json", JSON.stringify(dragPaths.current));
  }

  async function finishMoving(event, destination) {
    event.preventDefault();
    setDropTarget("");
    const sources = dragPaths.current;
    if (!canMoveTo(destination, sources)) {
      return;
    }

    try {
      const result = await api.moveFiles(sources, destination);
      notify(result.message || "Items moved successfully.", "success");
      refreshFiles();
    } catch (error) {
      notify(error.message || "Could not move the selected items.", "error");
    }
  }

  function openContextMenu(event) {
    event.preventDefault();
    const row = event.target.closest(".file-item");
    if (row) {
      const name = row.dataset.fileName;
      if (!selected.has(name)) {
        setSelected(new Set([name]));
      }
    } else if (!event.target.closest(".context-menu")) {
      setSelected(new Set());
    }
    setContextMenu({
      x: Math.max(4, Math.min(event.clientX, window.innerWidth - 220)),
      y: Math.max(4, Math.min(event.clientY, window.innerHeight - 120)),
    });
  }

  function showContextMenu(event) {
    openContextMenu(event);
  }

  function showFolderModal() {
    setFolderModal(true);
  }

  function startUploadModal() {
    setUploadSelection([]);
    setUploadModal(true);
    uploadModalOpen.current = true;
  }

  function closeUploadModal() {
    if (busy) {
      return;
    }
    setUploadSelection([]);
    setUploadModal(false);
    uploadModalOpen.current = false;
  }

  async function signOut() {
    try {
      await api.logout();
      window.location.replace("/login.html");
    } catch (error) {
      notify(error.message || "Could not sign out.", "error");
    }
  }

  function addUploadFiles(filesToAdd) {
    setUploadSelection(previous => [...previous, ...filesToAdd]);
  }

  async function upload(filesToUpload, closeOnSuccess) {
    if (!filesToUpload.length || busy) {
      return;
    }
    setBusy(true);
    try {
      await api.uploadFiles(filesToUpload, currentPath);
      refreshFiles();
      notify("Files uploaded successfully.", "success");
      if (closeOnSuccess) {
        setUploadSelection([]);
        setUploadModal(false);
        uploadModalOpen.current = false;
      }
    } catch (error) {
      notify(error.message || "An error occurred while uploading the files.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function submitFolder(event) {
    event.preventDefault();
    const name = new FormData(event.currentTarget).get("name").trim();
    if (!name) {
      notify("Folder name is required.", "error");
      return;
    }

    setBusy(true);
    try {
      await api.createFolder(name, currentPath);
      setFolderModal(false);
      refreshFiles();
      notify("Folder created successfully.", "success");
    } catch (error) {
      notify(error.message || "Something went wrong while creating the folder.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function deleteSelected() {
    if (!selectedPaths.length) {
      return;
    }
    setBusy(true);
    try {
      await api.deleteFiles(selectedPaths);
      setDeleteModal(false);
      setSelected(new Set());
      refreshFiles();
      notify(selectedPaths.length === 1 ? "Item deleted." : `${selectedPaths.length} items deleted.`, "success");
    } catch (error) {
      notify(error.message || "An error occurred while deleting.", "error");
    } finally {
      setBusy(false);
    }
  }

  const back = () => setCurrentPath(parentPath(currentPath));

  return (
    <main className="container" onContextMenu={showContextMenu} onMouseDown={startBoxSelection}>
      <header>
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
          <button type="button" onClick={showFolderModal}>📁 New folder</button>
          <button type="button" onClick={startUploadModal}>⬆️ Upload</button>
          <button type="button" className="danger" disabled={!selected.size} onClick={() => setDeleteModal(true)}>
            🗑️ Delete{selected.size ? ` (${selected.size})` : ""}
          </button>
          <button id="theme-toggle" type="button" title="Toggle theme" onClick={onToggleTheme}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <button type="button" onClick={signOut}>Sign out · {user.username}</button>
        </div>
      </header>

      <div className="toolbar">
        <button type="button" disabled={!currentPath} onClick={back}>← Back</button>
        <span className="current-path">{currentPath || "/"}</span>
      </div>

      <ul className="files" aria-label="Files and folders">
        {files.map(file => (
          <FileRow
            key={file.name}
            file={file}
            path={currentPath}
            selected={selected.has(file.name)}
            dropTarget={dropTarget === file.name}
            onSelect={selectFile}
            onOpen={openFile}
            onDragStart={startMoving}
            onDragEnd={() => {
              dragPaths.current = [];
              setDropTarget("");
            }}
            onDragOver={(event, destination, name) => {
              if (!canMoveTo(destination, dragPaths.current)) {
                setDropTarget("");
                return;
              }
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setDropTarget(name);
            }}
            onDrop={finishMoving}
            setDropTarget={setDropTarget}
          />
        ))}
      </ul>
      {!loading && files.length === 0 && <p className="empty-state">No hay archivos.</p>}
      {loading && <p className="empty-state">Loading...</p>}
      {selectionBox && <div className="selection-box" style={selectionBox} />}

      {contextMenu && (
        <div
          className="context-menu"
          role="menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={() => setContextMenu(null)}
        >
          <button className="context-menu-item" type="button" role="menuitem" onClick={showFolderModal}>
            <span className="context-menu-icon">📁</span>
            <span className="context-menu-label">New folder</span>
          </button>
          <div className="context-menu-separator" role="separator" />
          <button
            className="context-menu-item danger"
            type="button"
            role="menuitem"
            disabled={!selected.size}
            onClick={() => setDeleteModal(true)}
          >
            <span className="context-menu-icon">🗑️</span>
            <span className="context-menu-label">Delete{selected.size > 1 ? ` ${selected.size} items` : ""}</span>
          </button>
        </div>
      )}

      {folderModal && (
        <Modal title="New folder" onClose={() => setFolderModal(false)}>
          <form onSubmit={submitFolder}>
            <input name="name" id="folder-name" type="text" placeholder="Folder name" autoComplete="off" required autoFocus />
            <div className="modal-actions">
              <button type="button" onClick={() => setFolderModal(false)}>Cancel</button>
              <button type="submit" className="primary" disabled={busy}>Create</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteModal && (
        <Modal title="Delete files" onClose={() => !busy && setDeleteModal(false)}>
          <p id="delete-message">
            {selectedFiles.length === 1
              ? "This item will be permanently deleted:"
              : `These ${selectedFiles.length} items will be permanently deleted:`}
          </p>
          <ul className="item-list">
            {selectedFiles.map(file => (
              <li key={file.name}>
                <span className="list-item-name">{isDirectory(file) ? "📁" : "📄"} {displayName(file)}</span>
              </li>
            ))}
          </ul>
          <div className="modal-actions">
            <button type="button" disabled={busy} onClick={() => setDeleteModal(false)}>Cancel</button>
            <button type="button" className="danger-solid" disabled={busy} onClick={deleteSelected}>Delete</button>
          </div>
        </Modal>
      )}

      {uploadModal && (
        <Modal title="Upload files" className="upload-modal-content" onClose={closeUploadModal}>
          <button
            id="upload-dropzone"
            type="button"
            className="upload-dropzone"
            onClick={() => uploadInput.current?.click()}
            onDragOver={event => {
              event.preventDefault();
              event.currentTarget.classList.add("is-dragging");
            }}
            onDragLeave={event => event.currentTarget.classList.remove("is-dragging")}
            onDrop={event => {
              event.preventDefault();
              event.stopPropagation();
              event.currentTarget.classList.remove("is-dragging");
              addUploadFiles(Array.from(event.dataTransfer.files));
            }}
          >
            <span className="upload-drop-icon" aria-hidden="true">⬆</span>
            <span className="upload-drop-title">Drop files here</span>
            <span className="upload-drop-hint">or click to browse</span>
          </button>
          <input
            ref={uploadInput}
            type="file"
            multiple
            hidden
            onChange={event => {
              addUploadFiles(Array.from(event.target.files));
              event.target.value = "";
            }}
          />
          <ul className="item-list upload-file-list" hidden={!uploadSelection.length}>
            {uploadSelection.map((file, index) => <li key={`${file.name}-${index}`}>{file.name}</li>)}
          </ul>
          <div className="modal-actions">
            <button type="button" disabled={busy} onClick={closeUploadModal}>Cancel</button>
            <button
              type="button"
              className="primary"
              disabled={!uploadSelection.length || busy}
              onClick={() => void upload(uploadSelection, true)}
            >
              {busy ? "Uploading..." : "Upload"}
            </button>
          </div>
        </Modal>
      )}

      <div id="toast-container" aria-live="polite">
        {toast && <div className={`toast ${toast.type} show`}>{toast.message}</div>}
      </div>
    </main>
  );
}

export default function App() {
  const authRoute = window.location.pathname === "/login.html" ||
    window.location.pathname === "/register.html";
  const authMode = window.location.pathname === "/register.html" ? "register" : "login";
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [theme, setTheme] = useState(() =>
    localStorage.getItem("theme") ??
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    let active = true;
    api.getCurrentUser()
      .then(result => {
        if (active) {
          setUser(result.user);
          setAuthLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
          setAuthLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (user && authRoute) {
      window.location.replace("/");
    } else if (!user && !authRoute) {
      window.location.replace("/login.html");
    }
  }, [authLoading, authRoute, user]);

  if (authLoading || (!user && !authRoute)) {
    return <main className="container"><p className="empty-state">Loading...</p></main>;
  }

  if (authRoute) {
    return <AuthPage mode={authMode} />;
  }

  return (
    <FileBrowser
      user={user}
      theme={theme}
      onToggleTheme={() => setTheme(current => current === "dark" ? "light" : "dark")}
    />
  );
}