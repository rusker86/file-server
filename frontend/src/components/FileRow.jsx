import React from "react";
import { displayName, isDirectory, joinPath } from "../utils/paths.js";

export default function FileRow({
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