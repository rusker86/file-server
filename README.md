# File Server

A lightweight file server built with Node.js and Express. It exposes a directory on disk through a browser UI and a small REST API, so you can browse and download files from any machine that can reach the server.

## Features

- Browse directories from a web interface
- Navigate nested folders without leaving the browser
- Download files directly from the UI
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

The server listens on:

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

## Project structure

```text
.
├── src/
│   ├── index.js
│   ├── server.js
│   ├── createRoutes.js
│   ├── handlersRoutes.js
│   └── newFile.js
├── public/
│   ├── index.html
│   ├── main.js
│   └── styles.css
├── Dockerfile
├── compose.yaml
├── package.json
├── README.md
├── CONTRIBUTING.md
└── LICENSE.md
```

### Main files

- `src/index.js`: starts the app and validates the required folder argument.
- `src/server.js`: creates the Express server and serves static files from `public/`.
- `src/createRoutes.js`: registers the endpoint handlers.
- `src/handlersRoutes.js`: implements the API logic for listing folders, downloads, and health checks.
- `public/`: browser UI assets.

## Development notes

The application is intentionally minimal. It does not implement authentication or advanced directory permissions checks; it simply serves a local filesystem path exactly as provided.

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

### Error: `Usage: node index.js <folder-to-serve>`

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

