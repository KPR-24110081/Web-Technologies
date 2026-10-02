import { apiRequest } from "./api";

// All these functions call the real Express endpoints, which in turn
// execute actual Node.js fs module operations against backend/storage.

export async function listFiles() {
  const data = await apiRequest("/files");
  return data.data.files;
}

export async function createFile(name, content) {
  return apiRequest("/files", { method: "POST", body: { name, content } });
}

export async function readFile(name) {
  return apiRequest(`/files/${encodeURIComponent(name)}`);
}

export async function overwriteFile(name, content) {
  return apiRequest(`/files/${encodeURIComponent(name)}`, {
    method: "PUT",
    body: { content },
  });
}

export async function appendFile(name, content) {
  return apiRequest(`/files/${encodeURIComponent(name)}/append`, {
    method: "POST",
    body: { content },
  });
}

export async function renameFile(name, newName) {
  return apiRequest(`/files/${encodeURIComponent(name)}/rename`, {
    method: "PATCH",
    body: { newName },
  });
}

export async function deleteFile(name) {
  return apiRequest(`/files/${encodeURIComponent(name)}`, { method: "DELETE" });
}

export async function getFileStats(name) {
  return apiRequest(`/files/${encodeURIComponent(name)}/stats`);
}