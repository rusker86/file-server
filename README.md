# File Server

A simple file server built with Node.js and Express.

It lets you browse a directory from a web browser and download its files.

## Run

```bash
npm install
node src/index.js /path/to/directory
```

Then open:

```text
http://localhost:3000
```

## What it does

* Browse directories
* Browse subdirectories
* Download files
* Light/dark mode
* Simple HTTP API

The directory passed as the command-line argument becomes the root of the file server.

## Status

This is a small personal project and is still being developed.

The goal is to keep it simple while gradually adding features and improving the implementation.
