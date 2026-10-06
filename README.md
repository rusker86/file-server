# File Server

A lightweight file server built with Node.js and Express. It exposes a directory on disk through a browser UI and a small REST API, so you can browse and download files from any machine that can reach the server.

## Features

- Browse directories from a web interface
- Navigate nested folders without leaving the browser
- Download files directly from the UI
- Upload files, create folders and delete files/folders
- Register multiple accounts with isolated file storage
- Sign in with persistent SQLite-backed sessions
- Custom right-click menu with "New folder" and "Delete" actions
- Click, Ctrl/Cmd + click or drag a box to select items
- Expose the same content through a REST API
- Run locally or with Docker
- Serve any directory you choose at startup

## Requirements

- Node.js 22.13 or newer
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

3. Build the React frontend and start the server with the directory used for per-user storage:

```bash
npm run build
node src/index.js /path/to/folder
```

Register an account or sign in from the browser. Each account gets a private directory under `users/<id>` inside the configured storage root. Account records and sessions are stored in `.file-server-data/auth.sqlite` by default; set `FILE_SERVER_DATA_DIR` to use a different persistent location.

For HTTPS deployments, set `COOKIE_SECURE=true` so session cookies are sent only over TLS.

The server listens on (override with the `PORT` environment variable):

```text
http://localhost:3000
```

> The shared folder is required as a command-line argument. If it is missing, the server exits with a usage message.

### Development

Run Express and Vite in separate terminals. Vite proxies API requests to Express:

```bash
npm run server:dev
```

```bash
npm run dev
```

The Vite URL is `http://localhost:5173`; the API server uses `http://localhost:3000`.

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
  -v "file-server-data:/data" \
  -e FILE_SERVER_DATA_DIR=/data \
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

Registration and login are public. File operations require the `HttpOnly` session cookie issued at login.

For command-line requests, save the session cookie when signing in and send it with protected requests:

```bash
curl -c cookies.txt -H 'Content-Type: application/json' \
  -d '{"username":"maria","password":"your-password"}' \
  http://localhost:3000/api/auth/login
curl -b cookies.txt http://localhost:3000/api/files/
```

### `POST /api/auth/register` and `POST /api/auth/login`

Accept JSON with a username and password. Usernames must be 3-32 letters, numbers, dots, dashes or underscores; passwords must be 8-128 characters.

```json
{ "username": "maria", "password": "a-long-password" }
```

Registration signs the new user in automatically. `POST /api/auth/logout` revokes the current session, and `GET /api/auth/me` returns the signed-in user.

### `GET /api/health`

Returns the server state without requiring a session.

```json
{ "message": "OK" }
```

The remaining API routes for file listing, downloads, uploads, folder creation, moving and deletion require authentication. All file paths are resolved relative to the signed-in user's private directory.

### `GET /api/files/`

Lists the contents of the signed-in user's private root directory.

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

Lists the contents of a subdirectory inside the signed-in user's private directory.

Examples:

```text
/api/files/
/api/files/folder-a
/api/files/folder-a/subfolder
```

### `GET /api/download/<path>`

Downloads a file from the signed-in user's private directory.

Examples:

```text
/api/download/file.txt
/api/download/folder-a/report.pdf
```

### `POST /api/folders`

Creates a folder inside `path` (relative to the signed-in user's private root).

```json
{ "name": "new-folder", "path": "/folder-a" }
```

Responds `201` on success, `400` for an invalid name and `409` if it already exists.

### `POST /api/upload`

Uploads one or more files (`multipart/form-data`, field `file`, repeatable) into the folder given by the `path` field.

```bash
curl -b cookies.txt -F file=@a.txt -F file=@b.txt -F path=/folder-a http://localhost:3000/api/upload
```

### `DELETE /api/files`

Deletes files or folders (recursively). Paths are relative to the signed-in user's private root.

```json
{ "files": ["/folder-a/report.pdf", "/old-folder"] }
```

All paths are resolved inside that private root; requests that try to escape it (for example with `..`) are rejected with `403`.

## Project structure

```text
.
├── src/
│   ├── index.js                     # CLI entry point
│   ├── app.js                       # Express app factory
│   ├── auth.js                      # SQLite users and sessions
│   ├── routes/
│   │   └── api.routes.js            # /api routes
│   ├── controllers/
│   │   └── files.controller.js      # route handlers
│   └── utils/
│       └── paths.js                 # safe path resolution
├── public/
│   └── css/
│       ├── styles.css
│       └── auth.css
├── frontend/
│   ├── index.html
│   └── src/
│       ├── App.jsx                  # React auth and file browser
│       ├── api.js                   # fetch wrappers for the API
│       └── main.jsx                 # React entry point
├── dist/                            # generated by Vite, served by Express
├── vite.config.js
├── Dockerfile
├── compose.yaml
├── package.json
├── README.md
├── CONTRIBUTING.md
├── test/
│   └── auth.test.js                 # authentication and isolation checks
└── LICENSE.md
```

### Main files

- `src/index.js`: validates the folder argument and starts the server.
- `src/app.js`: builds the Express app, serves the Vite `dist/` bundle and mounts the API under `/api`.
- `src/routes/api.routes.js`: maps every endpoint to its handler.
- `src/controllers/files.controller.js`: listing, download, upload, folder creation, deletion and health check.
- `src/utils/paths.js`: resolves client paths inside the shared folder and validates names.
- `frontend/src/`: React UI and API client; Vite builds it to `dist/`.

## Development notes

Each account's files live in a separate directory under the storage root. The SQLite database should be backed up along with user files. The application does not provide password recovery; keep the database persistent to retain accounts and sessions.

Run the integration test with `npm test`. Node.js 22.13 or newer is required for the built-in SQLite module.

When developing locally, it is useful to serve a test folder such as `./test`:

```bash
node src/index.js ./test
```

Then validate the endpoints:

```bash
curl http://localhost:3000/api/health
```

File API requests require the session cookie; see the authenticated `curl` example above.

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

