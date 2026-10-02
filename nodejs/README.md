# Node.js Web Server

This project is a simple Node.js HTTP server that serves static pages for a small website. It includes a homepage, about page, and a 404 page, all served from the `public` directory.

## Features

- Serves static HTML, CSS, JavaScript, and image files
- Handles requests for `/` and `/about.html`
- Returns a custom 404 page for missing routes
- Logs request metadata to the console
- Runs on a lightweight custom HTTP server without external frameworks

## Project Structure

```text
nodejs/
├── public/
│   ├── index.html
│   ├── about.html
│   └── 404.html
├── server.js
├── package.json
├── package-lock.json
├── README.md
└── .gitignore
```

## Requirements

- Node.js 18+ recommended
- npm

## Installation

```bash
cd nodejs
npm install
```

## Run the app

```bash
npm start
```

Then open:

- http://localhost:3000/
- http://localhost:3000/about.html

## Files

- `server.js` — creates the HTTP server and serves files based on the request URL
- `public/index.html` — homepage content
- `public/about.html` — about page content
- `public/404.html` — custom not found page

## Notes

The server reads files from the `public` folder and responds with the correct `Content-Type` for common file extensions. It is designed as a beginner-friendly example of building a small static web server in Node.js.
