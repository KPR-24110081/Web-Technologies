const urlService = require("../services/urlService");
const { logOperation } = require("../utils/history");

/**
 * POST /api/url/parse  { url }
 * Break a URL into its WHATWG components.
 */
async function parseUrl(req, res, next) {
  try {
    const { url } = req.body;
    const data = urlService.parseUrl(url, true);
    await logOperation({
      type: "URL",
      operation: "PARSE",
      method: "new URL()",
      status: "success",
      input: url,
      result: data,
      message: "URL parsed",
    });
    res.json({
      success: true,
      operation: "new URL()",
      message: "URL parsed successfully",
      data,
    });
  } catch (err) {
    await logOperation({ type: "URL", operation: "PARSE", status: "error", input: req.body.url, error: err.message });
    next(err);
  }
}

/**
 * POST /api/url/validate  { url }
 * Check whether a URL is syntactically valid.
 */
async function validateUrl(req, res, next) {
  try {
    const { url } = req.body;
    const data = urlService.validateUrl(url);
    await logOperation({
      type: "URL",
      operation: "VALIDATE",
      method: "new URL() + try/catch",
      status: "success",
      input: url,
      result: { valid: data.valid },
      message: "URL validated",
    });
    res.json({
      success: true,
      operation: "new URL() + try/catch",
      message: data.valid ? "URL is valid" : "URL is invalid",
      data,
    });
  } catch (err) {
    await logOperation({ type: "URL", operation: "VALIDATE", status: "error", input: req.body.url, error: err.message });
    next(err);
  }
}

/**
 * POST /api/url/params  { url, name }
 * Demonstrate URLSearchParams methods: get, has, keys, values, entries, toString.
 */
async function getParams(req, res, next) {
  try {
    const { url, name } = req.body;
    const data = urlService.getSearchParams(url, name);
    await logOperation({
      type: "URL",
      operation: "PARAMS",
      method: "url.searchParams.*",
      status: "success",
      input: url,
      result: { count: data.count, entries: data.entries },
      message: "Query parameters inspected",
    });
    res.json({
      success: true,
      operation: "url.searchParams",
      message: "Query parameters retrieved",
      data,
    });
  } catch (err) {
    await logOperation({ type: "URL", operation: "PARAMS", status: "error", input: req.body.url, error: err.message });
    next(err);
  }
}

/**
 * POST /api/url/modify  { url, name, value, action }
 * Modify query parameters with set / append / delete.
 */
async function modifyUrl(req, res, next) {
  try {
    const { url, name, value, action } = req.body;
    const data = urlService.modifyUrl({ url, name, value, action });
    const methodName =
      action === "delete"
        ? "url.searchParams.delete()"
        : action === "append"
          ? "url.searchParams.append()"
          : "url.searchParams.set()";
    await logOperation({
      type: "URL",
      operation: "MODIFY",
      method: methodName,
      status: "success",
      input: url,
      result: { original: data.original, modified: data.modified, action: data.action },
      message: `URL modified (${action})`,
    });
    res.json({
      success: true,
      operation: methodName,
      message: "URL modified successfully",
      data,
    });
  } catch (err) {
    await logOperation({ type: "URL", operation: "MODIFY", status: "error", input: req.body.url, error: err.message });
    next(err);
  }
}

/**
 * POST /api/url/build  { protocol, hostname, port, pathname, params, hash }
 * Build a URL from separate components.
 */
async function buildUrl(req, res, next) {
  try {
    const data = urlService.buildUrl(req.body);
    await logOperation({
      type: "URL",
      operation: "BUILD",
      method: "new URL() + URLSearchParams",
      status: "success",
      input: JSON.stringify(req.body),
      result: { built: data.normalized },
      message: "URL built",
    });
    res.json({
      success: true,
      operation: "new URL() + URLSearchParams",
      message: "URL generated successfully",
      data,
    });
  } catch (err) {
    await logOperation({ type: "URL", operation: "BUILD", status: "error", input: JSON.stringify(req.body), error: err.message });
    next(err);
  }
}

/**
 * POST /api/url/resolve  { base, relative }
 * Resolve a relative URL against a base URL.
 */
async function resolveUrl(req, res, next) {
  try {
    const { base, relative } = req.body;
    const data = urlService.resolveUrl({ base, relative });
    await logOperation({
      type: "URL",
      operation: "RESOLVE",
      method: "new URL(relative, base)",
      status: "success",
      input: `${base} + ${relative}`,
      result: { resolved: data.resolved },
      message: "URL resolved",
    });
    res.json({
      success: true,
      operation: "new URL(relative, base)",
      message: "URL resolved successfully",
      data,
    });
  } catch (err) {
    await logOperation({ type: "URL", operation: "RESOLVE", status: "error", input: `${req.body.base} + ${req.body.relative}`, error: err.message });
    next(err);
  }
}

module.exports = {
  parseUrl,
  validateUrl,
  getParams,
  modifyUrl,
  buildUrl,
  resolveUrl,
};