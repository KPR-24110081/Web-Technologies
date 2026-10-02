// Tiny pub/sub toast helper used by the toast container at the app root.

const listeners = new Set();

export const toast = {
  show(message, type = "info") {
    const payload = { id: `${Date.now()}-${Math.random()}`, message, type };
    listeners.forEach((fn) => fn(payload));
  },
  success(message) {
    this.show(message, "success");
  },
  error(message) {
    this.show(message, "error");
  },
  info(message) {
    this.show(message, "info");
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

/** Copy text to the clipboard with a legacy fallback. */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}