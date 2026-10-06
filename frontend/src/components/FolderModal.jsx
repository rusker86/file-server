import React from "react";
import Modal from "./Modal.jsx";

export default function FolderModal({ busy, onClose, onCreate }) {
  function submit(event) {
    event.preventDefault();
    const name = new FormData(event.currentTarget).get("name").trim();
    onCreate(name);
  }

  return (
    <Modal title="New folder" onClose={onClose}>
      <form onSubmit={submit}>
        <input
          name="name"
          id="folder-name"
          type="text"
          placeholder="Folder name"
          autoComplete="off"
          required
          autoFocus
        />
        <div className="modal-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary" disabled={busy}>Create</button>
        </div>
      </form>
    </Modal>
  );
}