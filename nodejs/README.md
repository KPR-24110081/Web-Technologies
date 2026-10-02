# Node.js Static Web Server

This project demonstrates how to create a simple Node.js HTTP server that serves static web pages from a `public` folder. It is a beginner-friendly exercise for learning request handling, routing, MIME types, and custom 404 behavior.

## Project Overview

The application listens on port `3000` and serves pages such as the homepage and an about page. Requests are logged to the console, and invalid routes return a custom 404 page.

This project is useful for understanding the fundamentals of how a server responds to HTTP requests before moving on to frameworks like Express.

## Features

- Simple Node.js HTTP server
- Static file serving from the `public` directory
- Request logging middleware
- Route handling for `/` and `/about.html`
- Custom 404 response page
- Basic MIME type support for HTML, CSS, JavaScript, JSON, images, and SVG

## Project Structure

```text
nodejs/
├── README.md
├── server.js
├── package.json
├── index.html
├── public/
│   ├── index.html
│   ├── about.html
│   ├── 404.html
│   ├── favicon.svg
│   ├── icons.svg
│   └── ...
├── src/
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── assets/
├── vite.config.js
├── eslint.config.js
├── package-lock.json
└── ...
```

## Technologies Used

- Node.js
- JavaScript
- HTML
- CSS
- Vite (for frontend tooling)

## How to Run

1. Open a terminal in the `nodejs` folder.
2. Install dependencies:

```bash
npm install
```

3. Start the server:

```bash
npm start
```

4. Open the app in the browser:

```text
http://localhost:3000/
```

## Routes

- `/` → homepage
- `/about.html` → about page
- any other route → custom 404 page

## Notes

This project is intended as a learning exercise in web server fundamentals. It shows how Node.js can serve content without using an external framework.

## License

This project is for academic and learning purposes.
