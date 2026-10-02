const { URL } = require("url");
const { HttpError } = require("../utils/errors");

/**
 * Return the JSON-friendly components of a WHATWG URL object.
 */
function extractComponents(urlObj) {
  return {
    href: urlObj.href,
    protocol: urlObj.protocol,
    username: urlObj.username,
    password: urlObj.password,
    hostname: urlObj.hostname,
    host: urlObj.host,
    port: urlObj.port,
    pathname: urlObj.pathname,
    search: urlObj.search,
    searchParams: Array.from(urlObj.searchParams.entries()),
    hash: urlObj.hash,
    origin: urlObj.origin,
  };
}

/**
 * Parse a URL string into its individual parts.
 * Throws an HttpError for invalid input.
 */
function parseUrl(input, includeParams = false) {
  if (!input || typeof input !== "string") {
    throw new HttpError("A URL string is required.", 400);
  }
  let urlObj;
  try {
    urlObj = new URL(input.trim());
  } catch {
    throw new HttpError(`"${input}" is not a valid absolute URL. Include a protocol (http:// or https://).`, 400);
  }

  const components = extractComponents(urlObj);
  const params = Array.from(urlObj.searchParams.entries()).map(([key, value]) => ({ key, value }));

  return {
    components,
    url: urlObj.href,
    params,
    breakdown: [
      { key: "protocol", label: "protocol", value: urlObj.protocol },
      { key: "hostname", label: "hostname", value: urlObj.hostname },
      { key: "port", label: "port", value: urlObj.port || "(default)" },
      { key: "pathname", label: "pathname", value: urlObj.pathname },
      { key: "search", label: "query", value: urlObj.search },
      { key: "hash", label: "hash", value: urlObj.hash },
    ].filter((row) => row.value),
  };
}

/**
 * Validate a URL syntactically. Reports whether it is valid WITHOUT
 * claiming the site actually exists.
 */
function validateUrl(input) {
  if (!input || typeof input !== "string") {
    return { valid: false, input, reason: "URL is required." };
  }
  try {
    const urlObj = new URL(input.trim());
    return {
      valid: true,
      input: input.trim(),
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      pathname: urlObj.pathname,
      note: "Syntactically valid. This does NOT guarantee the website exists.",
    };
  } catch {
    return { valid: false, input, reason: "Not a valid absolute URL." };
  }
}

/**
 * Demonstrate URLSearchParams methods (get, has, keys, values, entries, toString).
 */
function getSearchParams(input, name) {
  const parsed = parseUrl(input);
  const sp = new URLSearchParams(parsed.components.search || "");

  const entries = Array.from(sp.entries());

  const result = {
    url: parsed.url,
    queryString: sp.toString(),
    count: entries.length,
    keys: Array.from(sp.keys()),
    values: Array.from(sp.values()),
    entries,
    hasKey: name ? sp.has(name) : false,
    getValue: name ? sp.get(name) : null,
  };

  if (name) {
    result.probedName = name;
  }
  return result;
}

/**
 * Modify query parameters on a URL.
 * action: "set" | "append" | "delete"
 */
function modifyUrl({ url, name, value, action }) {
  if (!url || typeof url !== "string") throw new HttpError("A URL is required.", 400);
  if (!name || typeof name !== "string") throw new HttpError("A parameter name is required.", 400);

  let urlObj;
  try {
    urlObj = new URL(url.trim());
  } catch {
    throw new HttpError(`"${url}" is not a valid URL.`, 400);
  }

  const validActions = ["set", "append", "delete"];
  if (!validActions.includes(action)) {
    throw new HttpError(`Invalid action "${action}". Use one of: ${validActions.join(", ")}.`, 400);
  }

  if (action === "delete") {
    urlObj.searchParams.delete(name);
  } else {
    if (value === undefined || value === null || value === "") {
      throw new HttpError("A parameter value is required.", 400);
    }
    if (action === "append") {
      urlObj.searchParams.append(name, String(value));
    } else {
      urlObj.searchParams.set(name, String(value));
    }
  }

  const modifiedUrl = urlObj.toString();

  const method =
    action === "delete"
      ? "url.searchParams.delete()"
      : action === "append"
        ? "url.searchParams.append()"
        : "url.searchParams.set()";

  return {
    original: url.trim(),
    modified: modifiedUrl,
    action,
    method,
    parameter: name,
    value: action === "delete" ? undefined : String(value),
    params: Array.from(urlObj.searchParams.entries()).map(([k, v]) => ({ key: k, value: v })),
  };
}

/**
 * Build a URL from separate components + query parameter pairs.
 */
function buildUrl({ protocol = "https://", hostname, port, pathname = "/", params = [], hash = "" }) {
  let scheme = String(protocol || "").trim().toLowerCase();
  scheme = scheme.replace(/^(https?|ftp|ws)s?:?\/?\/?$/, "$1");
  scheme = scheme.replace(/[:\/]+$/g, "");
  if (!scheme) scheme = "https";
  scheme += "://";

  const host = String(hostname || "").trim();
  if (!host) throw new HttpError("Hostname is required.", 400);

  const portStr = port !== undefined && port !== null && String(port).trim() !== "" ? String(port).trim() : "";
  if (portStr && !/^\d{1,5}$/.test(portStr)) {
    throw new HttpError("Port must be a number between 1 and 65535.", 400);
  }

  let pathStr = String(pathname || "").trim() || "/";
  if (!pathStr.startsWith("/")) pathStr = `/${pathStr}`;

  // Build query string with URLSearchParams so encoding stays correct.
  const searchParams = new URLSearchParams();
  if (Array.isArray(params)) {
    for (const p of params) {
      if (p && p.key) searchParams.append(String(p.key), String(p.value ?? ""));
    }
  }

  const hashStr = String(hash || "").trim();
  const built = `${scheme}${host}${portStr ? `:${portStr}` : ""}${pathStr}${searchParams.size ? `?${searchParams.toString()}` : ""}${hashStr ? `#${hashStr}` : ""}`;

  // Round-trip through new URL() so the result is normalized & guaranteed valid.
  const urlObj = new URL(built);

  return {
    built: built,
    normalized: urlObj.href,
    hostname: urlObj.hostname,
    port: urlObj.port,
    pathname: urlObj.pathname,
    search: urlObj.search,
    hash: urlObj.hash,
    params: Array.from(urlObj.searchParams.entries()).map(([k, v]) => ({ key: k, value: v })),
  };
}

/**
 * Resolve a relative URL against a base URL.
 */
function resolveUrl({ base, relative }) {
  if (!base || typeof base !== "string") throw new HttpError("A base URL is required.", 400);
  if (relative === undefined || relative === null || String(relative).trim() === "") {
    throw new HttpError("A relative URL is required.", 400);
  }

  let urlObj;
  try {
    urlObj = new URL(String(relative).trim(), base.trim());
  } catch {
    throw new HttpError("Could not resolve. Base URL may be invalid.", 400);
  }

  return {
    base: base.trim(),
    relative: String(relative).trim(),
    resolved: urlObj.href,
    hostname: urlObj.hostname,
    pathname: urlObj.pathname,
  };
}

module.exports = {
  parseUrl,
  validateUrl,
  getSearchParams,
  modifyUrl,
  buildUrl,
  resolveUrl,
};