import React from "react";

export default function ContextMenu({ position, selectedCount, onClose, onNewFolder, onDelete }) {
  return (
    <div
      className="context-menu"
      role="menu"
      style={{ left: position.x, top: position.y }}
      onClick={onClose}
    >
      <button
        className="context-menu-item"
        type="button"
        role="menuitem"
        onClick={onNewFolder}
      >
        <span className="context-menu-icon">📁</span>
        <span className="context-menu-label">New folder</span>
      </button>
      <div className="context-menu-separator" role="separator" />
      <button
        className="context-menu-item danger"
        type="button"
        role="menuitem"
        disabled={!selectedCount}
        onClick={onDelete}
      >
        <span className="context-menu-icon">🗑️</span>
        <span className="context-menu-label">
          Delete{selectedCount > 1 ? ` ${selectedCount} items` : ""}
        </span>
      </button>
    </div>
  );
}