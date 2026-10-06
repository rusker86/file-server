# Contributing Guide

Thanks for taking the time to contribute to this project. The app is intentionally small and straightforward, so it is easiest to work with when changes stay focused and predictable.

## Project overview

This application serves a directory from the local filesystem through a browser UI and a small REST API.

```text
Browser / API client
        │
        ▼
    Express server
        │
        ▼
  Shared directory on disk
```

The server reads the target folder from the command line and exposes it through:

- the static frontend in `public/`
- the API endpoints in `src/controllers/files.controller.js`

## Before you start

You will need:

- Node.js 22 or newer
- npm
- Git
- A folder on disk that you can safely share while testing

## Local setup

```bash
git clone <repository-url>
cd file-server
npm install
```

Run the project against a folder for testing:

```bash
node src/index.js ./test
```

Then open:

```text
http://localhost:3000
```

For a faster development loop, the project also includes:

```bash
npm run dev
```

This script already targets the `./test` directory.

## Project structure

```text
src/
├── index.js
├── app.js
├── routes/api.routes.js
├── controllers/files.controller.js
└── utils/paths.js
public/
├── index.html
├── css/styles.css
└── js/            # ES modules, entry point: main.js
```

See the README for a description of every file.

### Main responsibilities

- `src/index.js`: bootstraps the app and validates the required folder argument
- `src/app.js`: creates the Express app, serves static files and mounts `/api`
- `src/routes/api.routes.js`: registers the API routes
- `src/controllers/files.controller.js`: implements the API handlers
- `src/utils/paths.js`: keeps every path inside the shared folder
- `public/js/`: browser logic, one module per feature (file list, selection, context menu, modals, upload...)

## How the app works

The CLI entry point reads a folder path from `process.argv` and passes it into the server instance. The application then exposes it using the following operations:

- `GET /api/files/` lists the items in the root folder
- `GET /api/files/<path>` lists items in a subfolder
- `GET /api/download/<path>` downloads a file
- `GET /api/health` returns a simple health status
- `POST /api/folders` creates a folder
- `POST /api/upload` uploads files
- `DELETE /api/files` deletes files and folders

The frontend calls these endpoints to render the directory tree and let users navigate through the shared content.

## Coding guidelines

Keep the code simple and consistent with the rest of the project:

- Prefer small, focused changes
- Avoid adding unnecessary dependencies
- Do not broaden the scope of a PR beyond the bug or feature it addresses
- Update documentation when you change user-visible behavior
- Keep the API contract stable unless the change clearly requires a breaking update

## Frontend changes

The UI is intentionally lightweight and uses plain JavaScript. If you modify the browser behavior, check that:

- directory navigation still works
- download links still resolve correctly
- API responses are handled as expected
- the visible path remains accurate while browsing

## Backend changes

When working in the API layer, keep in mind that every request resolves against the folder passed at startup (`req.app.locals.root`). Always build filesystem paths with `resolveInsideRoot()` from `src/utils/paths.js` so a request can never escape the shared folder.

If you add a new route, document it in the README and keep the route naming consistent with the existing API.

## Verification

Before opening a pull request, verify the changed behavior locally.

### Health check

```bash
curl http://localhost:3000/api/health
```

Expected result:

```json
{ "message": "OK" }
```

### List the root folder

```bash
curl http://localhost:3000/api/files/
```

### Download a file

```bash
curl -O http://localhost:3000/api/download/test.txt
```

## Pull request checklist

Before submitting a PR, confirm that:

- the project still starts with a valid folder path
- the relevant endpoint or UI behavior works as expected
- the documentation reflects the new behavior, if applicable
- the change is small and easy to review
- there are no unrelated code edits mixed in

## Need help?

If you are not sure how a feature should fit the existing design, open an issue before making a large change. This project is small enough that a short discussion often prevents rework later.

Thanks again for contributing.
