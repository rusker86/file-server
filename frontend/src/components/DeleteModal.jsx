import React from "react";
import { displayName, isDirectory } from "../utils/paths.js";
import Modal from "./Modal.jsx";

export default function DeleteModal({ files, busy, onClose, onConfirm }) {
  return (
    <Modal title="Delete files" onClose={() => !busy && onClose()}>
      <p id="delete-message">
        {files.length === 1
          ? "This item will be permanently deleted:"
          : `These ${files.length} items will be permanently deleted:`}
      </p>
      <ul className="item-list">
        {files.map(file => (
          <li key={file.name}>
            <span className="list-item-name">
              {isDirectory(file) ? "📁" : "📄"} {displayName(file)}
            </span>
          </li>
        ))}
      </ul>
      <div className="modal-actions">
        <button type="button" disabled={busy} onClick={onClose}>Cancel</button>
        <button type="button" className="danger-solid" disabled={busy} onClick={onConfirm}>
          Delete
        </button>
      </div>
    </Modal>
  );
}