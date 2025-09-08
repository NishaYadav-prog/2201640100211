// src/components/Navbar.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="navbar">
      <h1 className="logo">Nisha Yadav | React URL Shortener</h1>

      <div className={`nav-links ${isOpen ? "open" : ""}`}>
        <Link to="/" onClick={() => setIsOpen(false)}>
          Home
        </Link>
        <Link to="/logs" onClick={() => setIsOpen(false)}>
          Logs
        </Link>
      </div>

      <div className="hamburger" onClick={toggleMenu}>
        <div className={`bar ${isOpen ? "change" : ""}`}></div>
        <div className={`bar ${isOpen ? "change" : ""}`}></div>
        <div className={`bar ${isOpen ? "change" : ""}`}></div>
      </div>
    </nav>
  );
}
