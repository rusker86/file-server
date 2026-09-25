# Developer Guide

This document explains the internal structure of the project and how the different parts work together.

## Overview

The project is a small file server built with Node.js and Express.

The server receives a directory path as a command-line argument and exposes that directory through a web interface and a REST API.

The same application can run directly on the host or inside a Docker container.

```text
                 ┌─────────────────┐
                 │   Web browser   │
                 └────────┬────────┘
                          │
                          ▼
                  ┌───────────────┐
                  │    Express    │
                  │    server     │
                  └───────┬───────┘
                          │
                          ▼
                  Shared directory
```

## Project structure

```text
src/
├── index.js
├── routes.js
└── handlersRoutes.js

public/
├── index.html
├── main.js
└── styles.css

Dockerfile
compose.yaml
package.json
```

### `src/index.js`

Application entry point.

It reads the directory passed through the command line and starts the Express server.

Example:

```bash
node src/index.js /home/user/Documents
```

The directory is available through:

```js
argv[2]
```

### `src/routes.js`

Defines the HTTP routes used by the application.

Current routes include:

```text
GET /api/files
GET /api/files/<path>
GET /api/download/<path>
GET /api/health
GET /
```

### `src/handlersRoutes.js`

Contains the request handlers for the API.

The file handler reads the requested directory using Node's filesystem API and returns the result as JSON.

Each entry contains its name and type:

```json
{
  "name": "example.txt",
  "type": "isFile"
}
```

Directories are identified with:

```json
{
  "name": "/Documents",
  "type": "isDirectory"
}
```

The frontend uses the `type` field to determine whether an entry should open as a directory or be downloaded as a file.

## Frontend

The frontend is intentionally simple and uses vanilla JavaScript.

`public/main.js` is responsible for:

* Requesting directory contents from the API
* Rendering files and directories
* Navigating through directories
* Handling the back button
* Starting file downloads
* Updating the current path

The browser does not change the URL when navigating through directories. The current directory is stored in the `currentPath` variable.

## Docker

The project includes a `Dockerfile` and a `compose.yaml`.

### Dockerfile

The Docker image is based on Node.js 22 Alpine:

```dockerfile
FROM node:22-alpine
```

Dependencies are installed inside the image and the application source is copied into `/app`.

The container uses:

```dockerfile
ENTRYPOINT ["node", "src/index.js"]
```

This allows the directory to be passed directly when starting the container:

```bash
docker run file-server /shared
```

which results in:

```text
node src/index.js /shared
```

### Shared directory

The directory being served is not copied into the Docker image.

Instead, Docker mounts a directory from the host:

```text
Host directory
      │
      │ volume
      ▼
 /shared inside container
      │
      ▼
 Node.js file server
```

For example:

```bash
docker run --rm \
  -p 3000:3000 \
  -v "/home/user/Documents:/shared:Z" \
  file-server \
  /shared
```

This means the container can be replaced or removed without affecting the files being served.

### SELinux

The `:Z` option is used on the volume mount:

```text
-v "/path/to/folder:/shared:Z"
```

This is important on systems using SELinux, such as Fedora, because SELinux can otherwise prevent the container from accessing the mounted directory even when normal Unix permissions appear correct.

### Docker Compose

`compose.yaml` provides a shorter way to start the server.

The current configuration mounts:

```text
~/Documentos → /shared
```

and passes `/shared` to the application.

Start the server with:

```bash
docker compose up
```

or run it in the background:

```bash
docker compose up -d
```

The container can be stopped with:

```bash
docker compose down
```

## Adding features

When adding new API functionality:

1. Add the route in `src/routes.js`.
2. Add the handler in `src/handlersRoutes.js`.
3. Update the frontend if the feature requires a UI change.
4. Update `API.md` if the API changes.
5. Update this document if the internal architecture changes.

## Running locally

Install dependencies:

```bash
npm install
```

Start the server:

```bash
node src/index.js /path/to/folder
```

## Running with Docker

Build the image:

```bash
docker build -t file-server .
```

Run it:

```bash
docker run --rm \
  -p 3000:3000 \
  -v "/path/to/folder:/shared:Z" \
  file-server \
  /shared
```

Or use Docker Compose:

```bash
docker compose up
```

## Security considerations

The server currently assumes that the directory passed to it is trusted.

Before exposing the server to an untrusted network, the following areas should be considered:

* Authentication
* Authorization
* Path traversal protection
* Symlink handling
* File access restrictions
* HTTPS
* Network exposure

The server should therefore currently be treated as a local or private-network tool rather than a public file hosting service.

## Design goal

The project intentionally keeps the implementation small.

The goal is to provide a functional file server without introducing unnecessary abstractions or dependencies.

Docker is used as a deployment option rather than being required by the application itself. The same Node.js application can run directly on the host or inside a container.
