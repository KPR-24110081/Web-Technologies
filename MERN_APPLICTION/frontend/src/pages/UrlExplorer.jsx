import { useMemo, useState } from "react";
import {
  Link2,
  Search,
  Filter,
  PencilLine,
  BadgeCheck,
  Hammer,
  GitMerge,
  Globe,
  Copy,
  Check,
  Plus,
  Trash2,
} from "lucide-react";

import OperationCard from "../components/OperationCard";
import ResultPanel from "../components/ResultPanel";
import UrlBreakdown from "../components/UrlBreakdown";

import {
  parseUrl,
  validateUrl,
  inspectParams,
  modifyUrl,
  buildUrl,
  resolveUrl,
} from "../services/urlApi";
import { toast, copyToClipboard } from "../services/toast";

const URL_TABS = [
  { id: "parse", label: "Parse URL", icon: Search },
  { id: "params", label: "Query Parameters", icon: Filter },
  { id: "modify", label: "Modify URL", icon: PencilLine },
  { id: "validate", label: "Validate URL", icon: BadgeCheck },
  { id: "build", label: "Build URL", icon: Hammer },
  { id: "resolve", label: "Resolve URL", icon: GitMerge },
];

const CODE = {
  parse: `const { URL } = require("url");

const url = new URL(input);

url.protocol;   // "https:"
url.hostname;   // "example.com"
url.port;       // "8080"
url.pathname;   // "/products"
url.search;     // "?id=101&name=KPR"
url.hash;       // "#details"
url.origin;     // "https://example.com:8080"`,
  params: `const { URL } = require("url");

const url = new URL(input);
const sp = url.searchParams;

sp.get("page");        // "2"            — first matching value
sp.has("sort");        // true           — exists?
[...sp.keys()];        // ["category", "page", "sort"]
[...sp.values()];      // ["books", "2", "price"]
[...sp.entries()];     // [["category","books"], ...]
sp.toString();         // "category=books&page=2&sort=price"`,
  modify: `const { URL } = require("url");

const url = new URL(input);

url.searchParams.set("page", "3");      // replace value(s)
url.searchParams.append("tag", "new");  // add another value
url.searchParams.delete("debug");       // remove a parameter

console.log(url.toString());`,
  validate: `const { URL } = require("url");

try {
  const url = new URL(userInput);
  console.log("Valid URL:", url.host);
} catch (err) {
  console.log("Invalid URL —", err.message);
}

// NOTE: syntax validity != the website actually exists.`,
  build: `const { URL } = require("url");

const url = new URL("https://example.com:8080/products");
const params = new URLSearchParams();
params.set("category", "books");
url.search = params.toString();

console.log(url.toString());
// https://example.com:8080/products?category=books`,
  resolve: `const { URL } = require("url");

const resolved = new URL("item.html", "https://example.com/products/");
console.log(resolved.href);
// https://example.com/products/item.html`,
};

const USE_CASES = {
  parse: "Understanding URL structure, routing, API endpoints and web navigation.",
  params: "Search filters, pagination, sorting and API query parameters.",
  modify: "Dynamic search filters, pagination, sorting and tracking parameters.",
  validate: "Form validation, API endpoint validation and user input checking.",
  build: "API endpoint generation, dynamic navigation and search URLs.",
  resolve: "Resolving relative links and constructing resource URLs.",
};

const METHODS = {
  parse: "new URL()",
  params: "url.searchParams",
  modify: "url.searchParams.set/append/delete",
  validate: "new URL() + try/catch",
  build: "new URL() + URLSearchParams",
  resolve: "new URL(relative, base)",
};

const TITLES = {
  parse: "Parse URL",
  params: "Query Parameter Explorer",
  modify: "Modify URL",
  validate: "Validate URL",
  build: "Build URL",
  resolve: "Resolve URL",
};

const DESCS = {
  parse: "Break a full URL into the components managed by the WHATWG url module.",
  params: "Read and test query parameters with get(), has(), keys(), values(), entries() and toString().",
  modify: "Set, append or delete a query parameter and see the URL change.",
  validate: "Check whether an input is a syntactically valid absolute URL.",
  build: "Construct a brand new URL from protocol, host, path, query parameters and hash.",
  resolve: "Resolve a relative URL against a base URL.",
};

const DEFAULTS = {
  parse: "https://example.com:8080/products?id=101&name=KPR#details",
  params: "https://example.com/products?category=books&page=2&sort=price",
  modify: "https://example.com/products?page=2",
  validate: "https://google.com",
  build: { protocol: "https:", hostname: "example.com", port: "8080", pathname: "products" },
  resolve: { base: "https://example.com/products/", relative: "item.html" },
};

/* ------------------------------------------------------------------ */

function copyButton({ text, small }) {
  return <CopyButton text={text} small={small} />;
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    }
  };
  return (
    <button type="button" className="btn btn-sm" onClick={handle} title="Copy to clipboard">
      {copied ? <Check size={13} style={{ color: "var(--success)" }} /> : <Copy size={13} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/* ------------------------------------------------------------------ */

export default function UrlExplorer() {
  const [tab, setTab] = useState("parse");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const [urlInput, setUrlInput] = useState(DEFAULTS.parse);
  const [probeName, setProbeName] = useState("");
  const [modifyName, setModifyName] = useState("page");
  const [modifyValue, setModifyValue] = useState("3");
  const [modifyAction, setModifyAction] = useState("set");

  const [buildFields, setBuildFields] = useState(DEFAULTS.build);
  const [buildParams, setBuildParams] = useState([{ key: "category", value: "books" }]);
  const [buildHash, setBuildHash] = useState("top");

  const [resolveBase, setResolveBase] = useState(DEFAULTS.resolve.base);
  const [resolveRelative, setResolveRelative] = useState(DEFAULTS.resolve.relative);

  const parsed = useMemo(() => result?.data?.components || null, [result]);

  const runOp = async ({ meta, payload, details, inputLabel }) => {
    setBusy(true);
    setResult(null);
    try {
      const res = await meta.call(payload);
      setResult({
        status: "success",
        operation: METHODS[tab],
        methodLabel: METHODS[tab],
        message: res.message,
        input: inputLabel,
        data: res.data,
        details: details ? details(res.data) : [],
        code: CODE[tab],
        useCase: USE_CASES[tab],
      });
      toast.success(res.message);
      return res.data;
    } catch (err) {
      setResult({
        status: "error",
        operation: METHODS[tab],
        methodLabel: METHODS[tab],
        message: err.message,
        input: inputLabel,
        data: null,
        details: [{ key: "Error", value: err.message, wrap: true }],
        code: CODE[tab],
        useCase: USE_CASES[tab],
      });
      toast.error(err.message);
      return null;
    } finally {
      setBusy(false);
    }
  };

  /* ---------- individual tab actions ---------- */

  const handleParse = () =>
    runOp({
      meta: { call: (p) => parseUrl(p.url) },
      payload: { url: urlInput || DEFAULTS.parse },
      inputLabel: `url = "${urlInput || DEFAULTS.parse}"`,
      details: () => [],
    });

  const handleInspectParams = async () => {
    const data = await runOp({
      meta: { call: (p) => inspectParams(p.url, p.name) },
      payload: { url: urlInput || DEFAULTS.params, name: probeName },
      inputLabel: `url = "${urlInput || DEFAULTS.params}"` + (probeName ? ` · probe = "${probeName}"` : ""),
      details: (d) => [
        { key: "Count", value: String(d.count) },
        { key: "Query String", value: d.queryString, wrap: true },
        { key: "Keys", value: d.keys.join(", ") || "(none)" },
        { key: "Values", value: d.values.join(", ") || "(none)" },
        ...(d.probedName
          ? [
              { key: `has("${d.probedName}")`, value: String(d.hasKey) },
              { key: `get("${d.probedName}")`, value: d.getValue === null ? "null (not found)" : d.getValue },
            ]
          : []),
      ],
    });
    return data;
  };

  const handleModify = () =>
    runOp({
      meta: {
        call: (p) => modifyUrl({ url: p.url, name: p.name, value: p.value, action: p.action }),
      },
      payload: { url: urlInput || DEFAULTS.modify, name: modifyName, value: modifyValue, action: modifyAction },
      inputLabel: `${modifyAction} parameter "${modifyName}"`,
      details: (d) => [
        { key: "Original URL", value: d.original, wrap: true },
        { key: "Modified URL", value: d.modified, wrap: true },
        { key: "Action", value: d.action.toUpperCase() },
        { key: "Parameter", value: d.parameter },
        ...(action !== "delete" ? [{ key: "Value", value: d.value }] : []),
      ],
    });

  const handleValidate = () =>
    runOp({
      meta: { call: (p) => validateUrl(p.url) },
      payload: { url: urlInput },
      inputLabel: `url = "${urlInput}"`,
      details: (d) =>
        d.valid
          ? [
              { key: "Protocol", value: d.protocol },
              { key: "Hostname", value: d.hostname },
              { key: "Pathname", value: d.pathname },
              { key: "Note", value: d.note },
            ]
          : [{ key: "Reason", value: d.reason }],
    });

  const handleBuild = () =>
    runOp({
      meta: { call: (p) => buildUrl(p) },
      payload: {
        protocol: buildFields.protocol,
        hostname: buildFields.hostname,
        port: buildFields.port,
        pathname: buildFields.pathname,
        params: buildParams.filter((p) => p.key.trim()),
        hash: buildHash,
      },
      inputLabel: `${buildFields.protocol}//${buildFields.hostname}${buildFields.port ? ":" + buildFields.port : ""}${buildFields.pathname}`,
      details: (d) => [
        { key: "Generated URL", value: d.normalized, wrap: true },
        { key: "Hostname", value: d.hostname },
        ...(d.port ? [{ key: "Port", value: d.port }] : []),
        { key: "Pathname", value: d.pathname },
        { key: "Query", value: d.search || "(none)" },
        { key: "Hash", value: d.hash || "(none)" },
        { key: "Parameters", value: d.params.map((p) => `${p.key}=${p.value}`).join(" & ") || "(none)" },
      ],
    });

  const handleResolve = () =>
    runOp({
      meta: { call: (p) => resolveUrl(p) },
      payload: { base: resolveBase, relative: resolveRelative },
      inputLabel: `base = "${resolveBase}" · relative = "${resolveRelative}"`,
      details: (d) => [
        { key: "Base URL", value: d.base, wrap: true },
        { key: "Relative URL", value: d.relative, wrap: true },
        { key: "Resolved URL", value: d.resolved, wrap: true },
      ],
    });

  const setBuildField = (k, v) => setBuildFields((f) => ({ ...f, [k]: v }));
  const setParam = (i, k, v) =>
    setBuildParams((arr) => arr.map((p, idx) => (idx === i ? { ...p, [k]: v } : p)));
  const addParam = () => setBuildParams((arr) => [...arr, { key: "", value: "" }]);
  const removeParam = (i) => setBuildParams((arr) => arr.filter((_, idx) => idx !== i));

  /* ---------- forms ---------- */

  const parseForm = (
    <>
      <div className="field">
        <label htmlFor="parse-url">Enter a URL</label>
        <input
          id="parse-url"
          className="input mono"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="https://example.com:8080/products?id=101&name=KPR#details"
        />
      </div>
      <button type="button" className="btn btn-secondary btn-block" onClick={handleParse} disabled={busy}>
        <Search size={16} /> Parse URL
      </button>
    </>
  );

  const paramsForm = (
    <>
      <div className="field">
        <label htmlFor="params-url">URL with query string</label>
        <input
          id="params-url"
          className="input mono"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
        />
      </div>
      <div className="field">
        <label>
          Probe a single parameter <span className="hint">(optional — demonstrates get() &amp; has())</span>
        </label>
        <input
          className="input mono"
          value={probeName}
          onChange={(e) => setProbeName(e.target.value)}
          placeholder="page"
        />
      </div>
      <button type="button" className="btn btn-secondary btn-block" onClick={handleInspectParams} disabled={busy}>
        <Filter size={16} /> Inspect Parameters
      </button>
    </>
  );

  const modifyForm = (
    <>
      <div className="field">
        <label htmlFor="modify-url">Original URL</label>
        <input id="modify-url" className="input mono" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} />
      </div>
      <div className="form-row">
        <div className="field">
          <label>Parameter name</label>
          <input
            className="input mono"
            value={modifyName}
            onChange={(e) => setModifyName(e.target.value)}
            placeholder="page"
          />
        </div>
        <div className="field">
          <label>Parameter value</label>
          <input
            className="input mono"
            value={modifyValue}
            onChange={(e) => setModifyValue(e.target.value)}
            placeholder="3"
            disabled={modifyAction === "delete"}
          />
        </div>
      </div>
      <div className="field">
        <label>Action</label>
        <div className="chip-list">
          {["set", "append", "delete"].map((a) => (
            <button
              key={a}
              type="button"
              className={`filter-pill ${modifyAction === a ? "active" : ""}`}
              onClick={() => setModifyAction(a)}
            >
              {a === "set" ? "Set (replace)" : a === "append" ? "Append (duplicate)" : "Delete"}
            </button>
          ))}
        </div>
        <span className="hint">
          set() replaces the value(s) · append() adds the same key again · delete() removes the key.
        </span>
      </div>
      <button type="button" className="btn btn-secondary btn-block" onClick={handleModify} disabled={busy}>
        <PencilLine size={16} /> Apply Change
      </button>
    </>
  );

  const validateForm = (
    <>
      <div className="field">
        <label htmlFor="validate-url">Input to validate</label>
        <input
          id="validate-url"
          className="input mono"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="https://google.com  or  just some text"
        />
        <span className="hint">
          Try <code>https://google.com</code> (valid) and <code>hello world</code> (invalid).
        </span>
      </div>
      <button type="button" className="btn btn-secondary btn-block" onClick={handleValidate} disabled={busy}>
        <BadgeCheck size={16} /> Validate URL
      </button>
    </>
  );

  const buildForm = (
    <>
      <div className="form-row">
        <div className="field">
          <label>Protocol</label>
          <select className="select mono" value={buildFields.protocol} onChange={(e) => setBuildField("protocol", e.target.value)}>
            <option value="https:">https:</option>
            <option value="http:">http:</option>
          </select>
        </div>
        <div className="field">
          <label>Hostname</label>
          <input
            className="input mono"
            value={buildFields.hostname}
            onChange={(e) => setBuildField("hostname", e.target.value)}
            placeholder="example.com"
          />
        </div>
      </div>
      <div className="form-row">
        <div className="field">
          <label>Port <span className="hint">(optional)</span></label>
          <input
            className="input mono"
            value={buildFields.port}
            onChange={(e) => setBuildField("port", e.target.value)}
            placeholder="8080"
          />
        </div>
        <div className="field">
          <label>Pathname</label>
          <input
            className="input mono"
            value={buildFields.pathname}
            onChange={(e) => setBuildField("pathname", e.target.value)}
            placeholder="products"
          />
        </div>
      </div>

      <div className="field">
        <label>
          Query parameters <span className="hint">(use URLSearchParams)</span>
        </label>
        <div className="detail-grid">
          {buildParams.map((p, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 32px", gap: 8, alignItems: "center" }}>
              <input
                className="input mono"
                placeholder="key"
                value={p.key}
                onChange={(e) => setParam(i, "key", e.target.value)}
              />
              <input
                className="input mono"
                placeholder="value"
                value={p.value}
                onChange={(e) => setParam(i, "value", e.target.value)}
              />
              <button type="button" className="btn btn-danger btn-sm" onClick={() => removeParam(i)} title="Remove parameter" style={{ width: 32, padding: "6px 0" }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-ghost btn-sm mt-8" onClick={addParam}>
          <Plus size={14} /> Add parameter
        </button>
      </div>

      <div className="field">
        <label>Hash <span className="hint">(optional)</span></label>
        <input className="input mono" value={buildHash} onChange={(e) => setBuildHash(e.target.value)} placeholder="section" />
      </div>

      <button type="button" className="btn btn-secondary btn-block" onClick={handleBuild} disabled={busy}>
        <Hammer size={16} /> Generate URL
      </button>
    </>
  );

  const resolveForm = (
    <>
      <div className="field">
        <label htmlFor="resolve-base">Base URL</label>
        <input
          id="resolve-base"
          className="input mono"
          value={resolveBase}
          onChange={(e) => setResolveBase(e.target.value)}
          placeholder="https://example.com/products/"
        />
      </div>
      <div className="field">
        <label htmlFor="resolve-rel">Relative URL</label>
        <input
          id="resolve-rel"
          className="input mono"
          value={resolveRelative}
          onChange={(e) => setResolveRelative(e.target.value)}
          placeholder="item.html"
        />
      </div>
      <button type="button" className="btn btn-secondary btn-block" onClick={handleResolve} disabled={busy}>
        <GitMerge size={16} /> Resolve URL
      </button>
    </>
  );

  const forms = {
    parse: parseForm,
    params: paramsForm,
    modify: modifyForm,
    validate: validateForm,
    build: buildForm,
    resolve: resolveForm,
  };

  const changedTab = (id) => {
    setTab(id);
    if (id === "parse") setUrlInput((v) => v || DEFAULTS.parse);
    if (id === "params") setUrlInput((v) => v || DEFAULTS.params);
    if (id === "modify") setUrlInput((v) => v || DEFAULTS.modify);
    if (id === "validate" && !urlInput) setUrlInput(DEFAULTS.validate);
  };

  const compRows = parsed
    ? [
        { key: "Protocol", value: parsed.protocol },
        ...(parsed.username ? [{ key: "Username", value: parsed.username }] : []),
        ...(parsed.password ? [{ key: "Password", value: "•••••• (masked)" }] : []),
        { key: "Hostname", value: parsed.hostname || "(default)" },
        { key: "Host", value: parsed.host || "(default)" },
        { key: "Port", value: parsed.port || "(default)" },
        { key: "Pathname", value: parsed.pathname || "/" },
        { key: "Query", value: parsed.search || "(none)" },
        { key: "Hash", value: parsed.hash || "(none)" },
        { key: "Origin", value: parsed.origin },
        { key: "Full URL (href)", value: parsed.href },
      ]
    : [];

  const paramsEntries = result?.data?.entries || [];

  return (
    <>
      <div className="page-header">
        <div className="eyebrow">Node.js Module · Lab 02</div>
        <h1>URL Explorer</h1>
        <p>
          Understand how URLs are structured, parsed, validated and modified using the Node.js{" "}
          <code>url</code> module.
        </p>
      </div>

      <div className="info-strip">
        <div className="card info-tile">
          <div className="tile-icon" style={{ background: "var(--secondary-soft)", color: "#0e7490" }}>
            <Globe size={17} />
          </div>
          <div>
            <div className="k">Module</div>
            <div className="v mono">url</div>
          </div>
        </div>
        <div className="card info-tile">
          <div className="tile-icon" style={{ background: "var(--secondary-soft)", color: "#0e7490" }}>
            <Link2 size={17} />
          </div>
          <div>
            <div className="k">Purpose</div>
            <div className="v">URL parsing &amp; manipulation</div>
          </div>
        </div>
        <div className="card info-tile">
          <div className="tile-icon" style={{ background: "var(--success-soft)", color: "#15803d" }}>
            <BadgeCheck size={17} />
          </div>
          <div>
            <div className="k">API</div>
            <div className="v mono">WHATWG URL + URLSearchParams</div>
          </div>
        </div>
      </div>

      <div className="tabs" role="tablist" aria-label="URL operations">
        {URL_TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`tab-pill ${tab === t.id ? "active" : ""}`}
              onClick={() => changedTab(t.id)}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="card card-pad">
        <OperationCard
          icon={<Link2 size={20} />}
          title={TITLES[tab]}
          desc={DESCS[tab]}
          method={METHODS[tab]}
          moduleName="url"
          tone="url"
        />
        {forms[tab]}
      </div>

      {/* Special rendering for the parse tab: visualize the URL */}
      {tab === "parse" && result?.data?.components && (
        <div className="card card-pad mt-20">
          <div className="card-title" style={{ marginBottom: 18 }}>URL Structure</div>
          <UrlBreakdown components={result.data.components} />
          <table className="comp-table">
            <tbody>
              {compRows.map((r) => (
                <tr key={r.key}>
                  <td>{r.key}</td>
                  <td>{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Special rendering for the params tab: key/value table */}
      {tab === "params" && result?.status === "success" && (
        <div className="card card-pad mt-20">
          <div className="flex-between mb-16">
            <div className="card-title">Query Parameters</div>
            <span className="badge badge-secondary">{paramsEntries.length} parameter(s)</span>
          </div>
          {paramsEntries.length === 0 ? (
            <div className="empty text-sm">This URL has no query parameters.</div>
          ) : (
            <div className="table-wrap" style={{ border: "none" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {paramsEntries.map(([key, value], i) => (
                    <tr key={i}>
                      <td>
                        <span className="cell-name">{key}</span>
                      </td>
                      <td>
                        <span className="chip" style={{ borderColor: "transparent" }}>
                          {value}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Copy button for generated URLs */}
      {tab === "build" && result?.data?.normalized && (
        <div className="card card-pad mt-20 flex-between">
          <div>
            <div className="card-sub text-sm">Generated URL</div>
            <div className="mono" style={{ fontSize: 14, wordBreak: "break-all", marginTop: 4 }}>
              {result.data.normalized}
            </div>
          </div>
          <div style={{ flexShrink: 0 }}>
            {copyButton({ text: result.data.normalized })}
          </div>
        </div>
      )}

      <ResultPanel result={result} />
    </>
  );
}