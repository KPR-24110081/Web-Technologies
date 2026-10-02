import { apiRequest } from "./api";

// All URL operations are executed on the backend using the WHATWG url module.

export async function parseUrl(url) {
  return apiRequest("/url/parse", { method: "POST", body: { url } });
}

export async function validateUrl(url) {
  return apiRequest("/url/validate", { method: "POST", body: { url } });
}

export async function inspectParams(url, name = "") {
  return apiRequest("/url/params", { method: "POST", body: { url, name } });
}

export async function modifyUrl({ url, name, value, action }) {
  return apiRequest("/url/modify", { method: "POST", body: { url, name, value, action } });
}

export async function buildUrl(payload) {
  return apiRequest("/url/build", { method: "POST", body: payload });
}

export async function resolveUrl({ base, relative }) {
  return apiRequest("/url/resolve", { method: "POST", body: { base, relative } });
}