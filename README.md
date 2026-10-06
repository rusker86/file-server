# File Server

A lightweight file server built with Node.js and Express. It exposes a directory on disk through a browser UI and a small REST API, so you can browse and download files from any machine that can reach the server.

## Features

- Browse directories from a web interface
- Navigate nested folders without leaving the browser
- Download files directly from the UI
- Upload files, create folders and delete files/folders
- Custom right-click menu with "New folder" and "Delete" actions
- Click, Ctrl/Cmd + click or drag a box to select items
- Expose the same content through a REST API
- Run locally or with Docker
- Serve any directory you choose at startup

## Requirements

- Node.js 22 or newer
- npm
- Optional: Docker and Docker Compose

## Quick start

1. Clone the repository:

```bash
git clone <repository-url>
cd file-server
```

2. Install dependencies:

```bash
npm install
```

3. Start the server and point it to the directory you want to share:

```bash
node src/index.js /path/to/folder
```

The server listens on (override with the `PORT` environment variable):

```text
http://localhost:3000
```

> The shared folder is required as a command-line argument. If it is missing, the server exits with a usage message.

### Using npm scripts

You can also run the project through npm if you want to use the default dev setup:

```bash
npm run dev
```

This script starts the app using the `./test` folder as the shared directory.

## Docker

### Build the image

```bash
docker build -t file-server .
```

### Run the container with a mounted folder

```bash
docker run --rm \
  -p 3000:3000 \
  -v "/path/to/folder:/shared:Z" \
  file-server \
  /shared
```

The `:Z` flag is useful on SELinux-based systems such as Fedora.

### Docker Compose

This repository also includes a `compose.yaml` file. By default it mounts the host folder `~/Documentos` to `/shared` inside the container.

```bash
docker compose up
```

To run it in the background:

```bash
docker compose up -d
```

Stop it with:

```bash
docker compose down
```

## API

The server exposes a small API for file listing and downloads.

### `GET /api/health`

Returns the server state.

Example response:

```json
{ "message": "OK" }
```

### `GET /api/files/`

Lists the contents of the shared root directory.

Example response:

```json
{
  "files": [
    { "name": "/folder-a", "type": "isDirectory" },
    { "name": "file.txt", "type": "isFile" }
  ]
}
```

### `GET /api/files/<path>`

Lists the contents of a subdirectory inside the shared root.

Examples:

```text
/api/files/
/api/files/folder-a
/api/files/folder-a/subfolder
```

### `GET /api/download/<path>`

Downloads a file from the shared folder.

Examples:

```text
/api/download/file.txt
/api/download/folder-a/report.pdf
```

### `POST /api/folders`

Creates a folder inside `path` (relative to the shared root).

```json
{ "name": "new-folder", "path": "/folder-a" }
```

Responds `201` on success, `400` for an invalid name and `409` if it already exists.

### `POST /api/upload`

Uploads one or more files (`multipart/form-data`, field `file`, repeatable) into the folder given by the `path` field.

```bash
curl -F file=@a.txt -F file=@b.txt -F path=/folder-a http://localhost:3000/api/upload
```

### `DELETE /api/files`

Deletes files or folders (recursively). Paths are relative to the shared root.

```json
{ "files": ["/folder-a/report.pdf", "/old-folder"] }
```

All paths are resolved inside the shared folder; requests that try to escape it (for example with `..`) are rejected with `403`.

## Project structure

```text
.
├── src/
│   ├── index.js                     # CLI entry point
│   ├── app.js                       # Express app factory
│   ├── routes/
│   │   └── api.routes.js            # /api routes
│   ├── controllers/
│   │   └── files.controller.js      # route handlers
│   └── utils/
│       └── paths.js                 # safe path resolution
├── public/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── main.js                  # frontend entry point
│       ├── api.js                   # fetch wrappers for the API
│       ├── state.js                 # current path + path helpers
│       ├── files.js                 # file list rendering/navigation
│       ├── selection.js             # click and box selection
│       ├── context-menu.js          # right-click menu
│       ├── folder-modal.js          # "New folder" dialog
│       ├── delete-modal.js          # delete confirmation dialog
│       ├── upload.js
│       ├── modal.js
│       ├── theme.js
│       └── toast.js
├── Dockerfile
├── compose.yaml
├── package.json
├── README.md
├── CONTRIBUTING.md
└── LICENSE.md
```

### Main files

- `src/index.js`: validates the folder argument and starts the server.
- `src/app.js`: builds the Express app, serves `public/` and mounts the API under `/api`.
- `src/routes/api.routes.js`: maps every endpoint to its handler.
- `src/controllers/files.controller.js`: listing, download, upload, folder creation, deletion and health check.
- `src/utils/paths.js`: resolves client paths inside the shared folder and validates names.
- `public/js/`: browser UI split into small ES modules (loaded natively, no build step).

## Development notes

The application is intentionally minimal. It does not implement authentication, so anyone who can reach the server can upload and delete files inside the shared folder. Paths are always resolved inside that folder.

When developing locally, it is useful to serve a test folder such as `./test`:

```bash
node src/index.js ./test
```

Then validate the endpoints:

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/files/
```

## Troubleshooting

### Error: `Usage: node src/index.js <folder-to-serve>`

This means you started the app without providing the path to the directory to be shared. Run it again with a valid folder:

```bash
node src/index.js /path/to/folder
```

### Permission problems

If the directory cannot be read, ensure the current user has access to that path and that the folder exists.

### Docker mount issues

On SELinux systems, keep the `:Z` option in the volume mount, as shown in the Docker examples above.

## License

This project is distributed under the MIT license.

