# File Server

A lightweight file server built with Node.js and Express. It provides a simple web interface for browsing directories and downloading files.

## Features

* Browse directories through a web interface
* Navigate through subdirectories
* Download files
* Light and dark mode
* REST API
* Docker support
* Configurable shared directory

## Requirements

* Node.js 22 or newer
* npm

Docker can also be used instead of installing Node.js locally.

## Running locally

Clone the repository and install the dependencies:

```bash
npm install
```

Start the server by providing the directory you want to share:

```bash
node src/index.js /path/to/folder
```

The server will be available at:

```text
http://localhost:3000
```

## Running with Docker

Build the Docker image:

```bash
docker build -t file-server .
```

Then run it by mounting the directory you want to share:

```bash
docker run --rm \
  -p 3000:3000 \
  -v "/path/to/folder:/shared:Z" \
  file-server \
  /shared
```

The `:Z` option is useful on systems using SELinux, such as Fedora.

### Docker Compose

The project also includes a `compose.yaml` for easier startup.

By default, it shares the user's `~/Documentos` directory:

```bash
docker compose up
```

The server will be available at:

```text
http://localhost:3000
```

To run it in the background:

```bash
docker compose up -d
```

The shared directory is mounted as `/shared` inside the container.

## API

### `GET /api/files`

Returns the contents of the shared root directory.

### `GET /api/files/<path>`

Returns the contents of a subdirectory.

### `GET /api/download/<path>`

Downloads a file.

### `GET /api/health`

Returns the server hea
