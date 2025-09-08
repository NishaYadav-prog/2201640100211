import React, { useEffect, useState } from "react";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  useParams,
  Link,
  useNavigate,
} from "react-router-dom";
import { log, getLogs } from "./LoggingMiddleware";
import { isValidAlias, isValidUrl, nowMs } from "./utils";
import "./App.css"; // custom CSS for background + DNA animation
import Navbar from "./component/Navbar";
const STORAGE_KEY = "short_links_v1";

function loadLinks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch (e) {
    return [];
  }
}
function saveLinks(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// Navbar component
// function Navbar() {
//   return (
//     <nav className="navbar">
//       <h1 className="navbar-title">🔗 React URL Shortener</h1>
//       <div className="navbar-right">
//         By <span className="author">Nisha Yadav</span>
//       </div>
//     </nav>
//   );
// }

// Redirect handler
function RedirectPage() {
  const { alias } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Redirecting...");

  useEffect(() => {
    const list = loadLinks();
    const item = list.find((i) => i.alias === alias);
    if (!item) {
      log("INFO", "redirect_miss", { alias });
      setMessage("404 - Link not found");
      return;
    }
    if (item.expiresAt && nowMs() > item.expiresAt) {
      log("INFO", "redirect_expired", { alias });
      setMessage("Link expired");
      return;
    }
    item.clicks = (item.clicks || 0) + 1;
    saveLinks(list);
    log("INFO", "redirect", { alias, url: item.url });
    window.location.replace(item.url);
  }, [alias, navigate]);

  return (
    <div className="container">
      <div className="card">
        <h2>{message}</h2>
        <div className="small">
          If not redirected, <Link to="/">go back</Link>.
        </div>
      </div>
    </div>
  );
}

// Home page
function Home() {
  const [links, setLinks] = useState(loadLinks());
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [validity, setValidity] = useState("");
  const [error, setError] = useState("");
  const [logsView, setLogsView] = useState([]);

  useEffect(() => {
    saveLinks(links);
  }, [links]);
  useEffect(() => {
    setLogsView(getLogs(50));
  }, []);

  function generateAlias(len = 6) {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let a = "";
    for (let i = 0; i < len; i++)
      a += chars[Math.floor(Math.random() * chars.length)];
    if (links.find((l) => l.alias === a)) return generateAlias(len + 1);
    return a;
  }

  function handleCreate(e) {
    e && e.preventDefault();
    setError("");
    if (!url) return setError("Enter a URL");
    const normalized = url.trim().startsWith("http")
      ? url.trim()
      : "https://" + url.trim();
    if (!isValidUrl(normalized))
      return setError("URL invalid (include http/https)");
    let finalAlias = alias.trim();
    if (finalAlias) {
      if (!isValidAlias(finalAlias))
        return setError("Alias invalid. Use 2-32 alnum, - or _");
      if (links.find((l) => l.alias === finalAlias))
        return setError("Alias already taken");
    } else {
      finalAlias = generateAlias();
    }
    let mins = parseInt(validity || "30", 10);
    if (isNaN(mins) || mins <= 0) mins = 30;
    const expiresAt = nowMs() + mins * 60 * 1000;

    const newItem = {
      id: Date.now().toString(36),
      alias: finalAlias,
      url: normalized,
      createdAt: new Date().toISOString(),
      expiresAt,
      clicks: 0,
    };
    const newList = [newItem, ...links];
    setLinks(newList);
    saveLinks(newList);
    log("INFO", "create_shortlink", {
      alias: finalAlias,
      url: normalized,
      validity_mins: mins,
    });
    setUrl("");
    setAlias("");
    setValidity("");
  }

  function handleDelete(a) {
    if (!window.confirm("Delete this short link?")) return;
    const newList = links.filter((l) => l.alias !== a);
    setLinks(newList);
    saveLinks(newList);
    log("WARN", "delete_shortlink", { alias: a });
  }

  function handleCopy(text) {
    navigator.clipboard.writeText(text);
    log("INFO", "copy_shortlink", { text });
    alert("Copied: " + text);
  }

  function cleanExpired() {
    const now = nowMs();
    const newList = links.filter((l) => !l.expiresAt || l.expiresAt > now);
    setLinks(newList);
    saveLinks(newList);
    log("INFO", "clean_expired", {});
  }

  return (
    <div className="container">
      <div className="card">
        <h2>Create Short Link</h2>
        <form onSubmit={handleCreate}>
          <input
            className="input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/path"
          />
          <input
            className="input"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            placeholder="Custom alias (optional)"
          />
          <input
            className="input"
            value={validity}
            onChange={(e) => setValidity(e.target.value)}
            placeholder="Validity minutes (default 30)"
          />
          {error && <div className="error">{error}</div>}
          <div className="btn-group">
            <button className="button" type="submit">
              Create
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={cleanExpired}
            >
              Clean expired
            </button>
            <Link to="/logs">
              <button type="button" className="button secondary">
                View Logs
              </button>
            </Link>
          </div>
        </form>
      </div>

      <div className="card">
        <h3>Saved Links</h3>
        {links.length === 0 && <div className="small">No links yet</div>}
        {links.map((l) => (
          <div key={l.alias} className="list-item">
            <div className="list-left">
              <a className="link" href={`/${l.alias}`}>
                {window.location.origin}/{l.alias}
              </a>
              <div className="small">{l.url}</div>
              <div className="small">
                Clicks: {l.clicks} • Expires:{" "}
                {l.expiresAt ? new Date(l.expiresAt).toLocaleString() : "Never"}
              </div>
            </div>
            <div className="list-right">
              <button
                className="button small"
                onClick={() =>
                  handleCopy(window.location.origin + "/" + l.alias)
                }
              >
                Copy
              </button>
              <button
                className="button small danger"
                onClick={() => handleDelete(l.alias)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Logs page
function LogsPage() {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    setLogs(getLogs(200));
  }, []);
  return (
    <div className="container">
      <div className="card">
        <h2>Application Logs</h2>
        <div className="logs">
          {logs.length === 0 && <div className="small">No logs yet</div>}
          {logs.map((l, i) => (
            <div key={i} className="log-item">
              <div>
                <strong>{l.action}</strong>{" "}
                <span className="small">
                  [{l.level}] {new Date(l.time).toLocaleString()}
                </span>
              </div>
              <pre className="log-pre">{JSON.stringify(l.details)}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Router>
      <Navbar />

      <div className="dna-background"></div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/logs" element={<LogsPage />} />
        <Route path="/:alias" element={<RedirectPage />} />
      </Routes>
    </Router>
  );
}
