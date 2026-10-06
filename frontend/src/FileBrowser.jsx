import React, { useEffect, useRef, useState } from "react";
import * as api from "./api.js";
import ContextMenu from "./components/ContextMenu.jsx";
import DeleteModal from "./components/DeleteModal.jsx";
import FileHeader from "./components/FileHeader.jsx";
import FileRow from "./components/FileRow.jsx";
import FolderModal from "./components/FolderModal.jsx";
import ToastMessage from "./components/ToastMessage.jsx";
import UploadModal from "./components/UploadModal.jsx";
import { canMoveTo, isDirectory, joinPath, parentPath } from "./utils/paths.js";

export default function FileBrowser({ user, theme, onToggleTheme }) {
  const [currentPath, setCurrentPath] = useState("");
  const [files, setFiles] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [dropTarget, setDropTarget] = useState("");
  const [folderModal, setFolderModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selectionBox, setSelectionBox] = useState(null);
  const toastTimer = useRef(null);
  const dragPaths = useRef([]);
  const uploadModalOpen = useRef(false);
  const uploadHandler = useRef(null);
  const selectionStart = useRef(null);
  const selectionAnchor = useRef(null);

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
    selectionAnchor.current = null;

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
      } else if (
        event.key === "Delete" &&
        selected.size > 0 &&
        !event.target.closest("input, textarea")
      ) {
        setDeleteModal(true);
      }
    }

    function closeContextMenu(event) {
      if (!event.target.closest(".context-menu")) {
        setContextMenu(null);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", closeContextMenu);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", closeContextMenu);
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

    document.addEventListener("mousedown", startBoxSelection);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousedown", startBoxSelection);
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
      if (hasFiles(event)) {
        event.preventDefault();
        if (!uploadModalOpen.current) {
          document.body.classList.add("file-drop-active");
        }
      }
    }

    function onDragLeave(event) {
      if (event.relatedTarget === null) {
        document.body.classList.remove("file-drop-active");
      }
    }

    function onDrop(event) {
      document.body.classList.remove("file-drop-active");
      if (hasFiles(event)) {
        event.preventDefault();
        if (!uploadModalOpen.current) {
          void uploadHandler.current(Array.from(event.dataTransfer.files));
        }
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
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  function startBoxSelection(event) {
    if (
      event.button !== 0 ||
      event.target.closest(".file-item, button, input, .modal, .context-menu")
    ) {
      return;
    }

    setSelected(new Set());
    selectionAnchor.current = null;
    selectionStart.current = { x: event.clientX, y: event.clientY };
    setSelectionBox({ left: event.clientX, top: event.clientY, width: 0, height: 0 });
    event.preventDefault();
  }

  function selectFile(file, event) {
    event.stopPropagation();
    const index = files.findIndex(item => item.name === file.name);
    const isAdditive = event.ctrlKey || event.metaKey;

    if (event.shiftKey && selectionAnchor.current !== null) {
      const start = Math.min(selectionAnchor.current, index);
      const end = Math.max(selectionAnchor.current, index);
      const next = isAdditive ? new Set(selected) : new Set();
      for (let itemIndex = start; itemIndex <= end; itemIndex += 1) {
        next.add(files[itemIndex].name);
      }
      setSelected(next);
      return;
    }

    if (isAdditive) {
      setSelected(previous => {
        const next = new Set(previous);
        next.has(file.name) ? next.delete(file.name) : next.add(file.name);
        return next;
      });
      selectionAnchor.current = index;
      return;
    }

    selectionAnchor.current = index;
    setSelected(new Set([file.name]));
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

  async function upload(files) {
    if (!files.length || busy) {
      return false;
    }

    setBusy(true);
    try {
      await api.uploadFiles(files, currentPath);
      refreshFiles();
      notify("Files uploaded successfully.", "success");
      return true;
    } catch (error) {
      notify(error.message || "An error occurred while uploading the files.", "error");
      return false;
    } finally {
      setBusy(false);
    }
  }

  uploadHandler.current = upload;

  async function createFolder(name) {
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

  async function signOut() {
    try {
      await api.logout();
      window.location.replace("/login.html");
    } catch (error) {
      notify(error.message || "Could not sign out.", "error");
    }
  }

  return (
    <main className="container" onContextMenu={openContextMenu}>
      <FileHeader
        user={user}
        theme={theme}
        selectedCount={selected.size}
        onNewFolder={() => setFolderModal(true)}
        onUpload={() => setUploadModal(true)}
        onDelete={() => setDeleteModal(true)}
        onToggleTheme={onToggleTheme}
        onLogout={signOut}
      />

      <div className="toolbar">
        <button
          type="button"
          disabled={!currentPath}
          onClick={() => setCurrentPath(parentPath(currentPath))}
        >
          ← Back
        </button>
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
        <ContextMenu
          position={contextMenu}
          selectedCount={selected.size}
          onClose={() => setContextMenu(null)}
          onNewFolder={() => setFolderModal(true)}
          onDelete={() => setDeleteModal(true)}
        />
      )}

      {folderModal && (
        <FolderModal
          busy={busy}
          onClose={() => setFolderModal(false)}
          onCreate={createFolder}
        />
      )}
      {deleteModal && (
        <DeleteModal
          files={selectedFiles}
          busy={busy}
          onClose={() => setDeleteModal(false)}
          onConfirm={deleteSelected}
        />
      )}
      {uploadModal && (
        <UploadModal
          busy={busy}
          onClose={() => {
            setUploadModal(false);
            uploadModalOpen.current = false;
          }}
          onUpload={upload}
        />
      )}

      <ToastMessage toast={toast} />
    </main>
  );
}