# FTP URL

A simple web project focused on understanding and visualizing FTP URLs. This assignment demonstrates how an FTP address is structured, how its parts are parsed, and how a browser-based interface can help users inspect URL data clearly.

## Project Overview

FTP (File Transfer Protocol) is commonly used to transfer files between computers over a network. Unlike basic HTTP links, FTP URLs can include additional information such as credentials, port numbers, directory paths, and file names.

This project helps learners explore the different components of an FTP URL and understand how JavaScript can read and validate them.

## Learning Objectives

- Understand the structure of an FTP URL
- Identify URL components such as protocol, host, port, username, password, and path
- Parse a URL using JavaScript
- Validate user input before processing it
- Build a simple interactive front-end for learning web concepts

## Features

- Input field to enter an FTP URL
- URL parsing and component breakdown
- Information display for protocol, host, port, path, and file details
- Validation checks for incorrect or incomplete FTP addresses
- Clean and responsive UI
- Beginner-friendly educational design

## Example FTP URLs

```text
ftp://ftp.example.com
ftp://username:password@ftp.example.com:21/public/files/report.txt
ftp://user@server.example.com/downloads/software.zip
```

## Technologies Used

- HTML5
- CSS3
- JavaScript

## Project Structure

```text
FTP-URL/
├── README.md
├── index.html
├── style.css
├── script.js
└── assets/   (optional)
```

## How to Run

1. Open the project folder in your editor.
2. Open `index.html` in the browser, or serve the folder locally:

```bash
python -m http.server 8000
```

3. Visit:

```text
http://localhost:8000
```

## Typical Workflow

1. Enter an FTP URL in the input field.
2. Click the parse or validate button.
3. View the different parts of the URL, such as:
   - protocol
   - hostname
   - port
   - username/password
   - file path
   - complete URL

## Notes

This project is intended as a learning exercise in web technologies and URL handling. It is a simple demonstration of how front-end JavaScript can be used to work with network addresses and improve user understanding of URL structures.

## License

This project is for academic and educational use.
