import React, { useRef, useState } from "react";
import Modal from "./Modal.jsx";

export default function UploadModal({ busy, onClose, onUpload }) {
  const [files, setFiles] = useState([]);
  const input = useRef(null);

  function addFiles(nextFiles) {
    setFiles(current => [...current, ...nextFiles]);
  }

  async function uploadSelected() {
    if (await onUpload(files)) {
      setFiles([]);
      onClose();
    }
  }

  return (
    <Modal title="Upload files" className="upload-modal-content" onClose={onClose}>
      <button
        id="upload-dropzone"
        type="button"
        className="upload-dropzone"
        onClick={() => input.current?.click()}
        onDragOver={event => {
          event.preventDefault();
          event.currentTarget.classList.add("is-dragging");
        }}
        onDragLeave={event => event.currentTarget.classList.remove("is-dragging")}
        onDrop={event => {
          event.preventDefault();
          event.stopPropagation();
          event.currentTarget.classList.remove("is-dragging");
          addFiles(Array.from(event.dataTransfer.files));
        }}
      >
        <span className="upload-drop-icon" aria-hidden="true">⬆</span>
        <span className="upload-drop-title">Drop files here</span>
        <span className="upload-drop-hint">or click to browse</span>
      </button>
      <input
        ref={input}
        type="file"
        multiple
        hidden
        onChange={event => {
          addFiles(Array.from(event.target.files));
          event.target.value = "";
        }}
      />
      <ul className="item-list upload-file-list" hidden={!files.length}>
        {files.map((file, index) => <li key={`${file.name}-${index}`}>{file.name}</li>)}
      </ul>
      <div className="modal-actions">
        <button type="button" disabled={busy} onClick={onClose}>Cancel</button>
        <button
          type="button"
          className="primary"
          disabled={!files.length || busy}
          onClick={() => void uploadSelected()}
        >
          {busy ? "Uploading..." : "Upload"}
        </button>
      </div>
    </Modal>
  );
}