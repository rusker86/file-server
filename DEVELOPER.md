# Developer Guide

This document covers the internal structure of the file server and the main parts of the codebase.

## Overview

The project is split into a small Express backend and a browser-based frontend.

```text
Browser
   │
   │ HTTP
   ▼
Express
   │
   ├── API routes
   │     ├── /api/files
   │     └── /api/download
   │
   └── Static frontend
         ├── index.html
         ├── main.js
         └── styles.css
```

The server receives the directory to share as a command-line argument:

```bash
node src/index.js /path/to/directory
```

That directory becomes the root of the file server.

## Project structure

```text
file-server/
├── public/
│   ├── index.html
│   ├── main.js
│   └── styles.css
│
├── src/
│   ├── handlersRoutes.js
│   ├── routes.js
│   ├── server.js
│   └── index.js
│
├── package.json
└── README.md
```

### `src/index.js`

Application entry point.

It creates the Express application, registers the routes and starts the server.

The directory to share is read from `process.argv`.

### `src/server.js`

Contains the Express server setup.

This is where middleware and the HTTP server itself are configured.

Static files from `public/` are also served here.

### `src/routes.js`

Contains the API route definitions.

The routes connect HTTP endpoints to the corresponding handlers.

Current endpoints:

```text
GET /api/files/{*splat}
GET /api/download/{*splat}
GET /api/health
```

### `src/handlersRoutes.js`

Contains the logic executed by the routes.

The file listing handler uses Node's filesystem APIs to read directories and determine whether each entry is a file or a directory.

The download handler verifies that the requested path points to a file before sending it to the client.

## API flow

### Directory listing

A request such as:

```http
GET /api/files/projects
```

is handled by the file listing handler.

The path is taken from the route parameters and combined with the root directory:

```text
root directory
      +
requested path
      ↓
full filesystem path
```

The directory is then read using Node's filesystem API.

The response has the following structure:

```json
{
  "files": [
    {
      "name": "/projects",
      "type": "isDirectory"
    },
    {
      "name": "notes.txt",
      "type": "isFile"
    }
  ]
}
```

The leading `/` on directory names is currently used by the frontend when building navigation paths.

## Frontend

The frontend does not reload the page when navigating between directories.

`main.js` keeps track of the current path:

```js
let currentPath = "";
```

When a directory is selected, it requests the corresponding API endpoint and replaces the contents of the file list.

When a file is selected, the browser navigates to the download endpoint.

```text
Directory
    ↓
GET /api/files/<path>
    ↓
Render contents

File
    ↓
GET /api/download/<path>
    ↓
Download
```

## Adding features

Most changes should be isolated to the part of the application they affect.

### Backend changes

Add or modify routes in:

```text
src/routes.js
```

Put request handling logic in:

```text
src/handlersRoutes.js
```

Avoid putting filesystem or request handling logic directly into the route definitions.

### Frontend changes

The main UI logic lives in:

```text
public/main.js
```

Visual changes belong in:

```text
public/styles.css
```

Page structure belongs in:

```text
public/index.html
```

## Running locally

Install dependencies:

```bash
npm install
```

Start the server:

```bash
node src/index.js /path/to/directory
```

For development, use a directory containing test files rather than an important personal directory.

The server is available at:

```text
http://localhost:3000
```

## Development considerations

The project currently assumes a trusted environment.

Before exposing the server outside a trusted local network, several things should be addressed:

* Validate and normalize requested paths.
* Prevent directory traversal.
* Handle missing files and directories cleanly.
* Consider authentication and authorization.
* Avoid exposing sensitive directories.
* Decide how symbolic links should be handled.
* Add proper error handling around filesystem operations.

These are especially important because the server works directly with the host filesystem.

## Design goal

The project intentionally keeps the architecture small.

There is no database and no framework on the frontend. The browser communicates with a small Express API and the API maps requests to filesystem operations.

The idea is to keep the implementation easy to read and modify while adding features gradually.
