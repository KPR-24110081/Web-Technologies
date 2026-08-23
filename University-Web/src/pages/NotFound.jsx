import React from "react";
import { Link } from "react-router-dom";

function NotFound() {
  return (
    <section className="content" style={{ textAlign: "center" }}>
      <h1>404</h1>

      <h2>Page Not Found</h2>

      <p>
        Sorry, the page you are looking for does not exist.
      </p>

      <Link
        to="/"
        style={{
          display: "inline-block",
          marginTop: "20px",
          padding: "12px 25px",
          background: "#123c69",
          color: "white",
          textDecoration: "none",
          borderRadius: "5px",
        }}
      >
        Back to Home
      </Link>
    </section>
  );
}

export default NotFound;