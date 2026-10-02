import { useCallback, useEffect, useRef, useState } from "react";
import {
  FilePlus2,
  FileText,
  FilePen,
  FilePlus as FileAppend,
  FileSignature,
  Trash2,
  List,
  Info,
  FolderTree,
  RefreshCw,
  Boxes,
  Codepen,
  HardDrive,
  ArrowRight,
} from "lucide-react";

import OperationCard from "../components/OperationCard";
import ResultPanel from "../components/ResultPanel";
import FileTable from "../components/FileTable";
import FileSelect from "../components/FileSelect";
import ConfirmModal from "../components/ConfirmModal";
import CodePreview from "../components/CodePreview";
import Spinner from "../components/Spinner";

import {
  listFiles,
  createFile,
  readFile,
  overwriteFile,
  appendFile,
  renameFile,
  deleteFile,
  getFileStats,
} from "../services/fileApi";
import { toast } from "../services/toast";

/* ------------------------------------------------------------------ */

const FS_TABS = [
  { id: "create", label: "Create File", icon: FilePlus2 },
  { id: "read", label: "Read File", icon: FileText },
  { id: "write", label: "Write File", icon: FilePen },
  { id: "append", label: "Append File", icon: FileAppend },
  { id: "rename", label: "Rename File", icon: FileSignature },
  { id: "delete", label: "Delete File", icon: Trash2 },
  { id: "list", label: "List Directory", icon: List },
  { id: "stats", label: "File Metadata", icon: Info },
];

/* Node.js code shown in every operation result so students can copy it. */
const CODE = {
  create: `const fsp = require("fs/promises");

// flag "wx" = write but FAIL if the file already exists
// This is what makes "Create" different from "Write".
await fsp.writeFile(filePath, content, {
  encoding: "utf8",
  flag: "wx",
});
console.log("File created");`,
  read: `const fsp = require("fs/promises");

const content = await fsp.readFile(filePath, "utf8");
console.log(content);`,
  write: `const fsp = require("fs/promises");

// default flag "w" = create if missing, truncate & replace if present
await fsp.writeFile(filePath, content, { encoding: "utf8" });
console.log("File written");`,
  append: `const fsp = require("fs/promises");

// adds text to the end without removing existing content
await fsp.appendFile(filePath, content, "utf8");
console.log("Content appended");`,
  rename: `const fsp = require("fs/promises");

await fsp.rename(oldPath, newPath);
console.log("File renamed");`,
  delete: `const fsp = require("fs/promises");

await fsp.unlink(filePath);
console.log("File deleted");`,
  list: `const fsp = require("fs/promises");

const entries = await fsp.readdir(storageDir, { withFileTypes: true });
for (const entry of entries) {
  const stat = await fsp.stat(path.join(storageDir, entry.name));
  console.log(entry.name, stat.size, "bytes");
}`,
  stats: `const fsp = require("fs/promises");

const stats = await fsp.stat(filePath);
console.log(stats.size);          // size in bytes
console.log(stats.birthtime);     // creation time
console.log(stats.mtime);         // last modified
console.log(stats.isFile());      // true/false
console.log(stats.isDirectory()); // true/false`,
};

const USE_CASES = {
  create: "Creating notes, reports, configuration files, or documents.",
  read: "Reading saved documents, logs or configuration files.",
  write: "Updating configuration files, saved documents or regenerated reports.",
  append: "Appending to logs, journal files and activity records.",
  rename: "Renaming documents or organizing files into a naming convention.",
  delete: "Removing unwanted or temporary files.",
  list: "File explorers, document managers and backup utilities.",
  stats: "File inspection, disk usage monitoring and storage analysis.",
};

function buildDetails(data, wrapKeys = []) {
  return Object.entries(data)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([key, value]) => ({
      key: key.replace(/([A-Z])/g, " $1").toUpperCase(),
      value: typeof value === "object" ? JSON.stringify(value, null, 2) : String(value),
      wrap: wrapKeys.includes(key) || typeof value === "object",
    }));
}

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

/* ------------------------------------------------------------------ */

export default function FileSystemLab() {
  const [tab, setTab] = useState("create");
  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [filesError, setFilesError] = useState("");

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const [form, setForm] = useState({ name: "", content: "", newName: "", selectedFile: "" });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const explorerRef = useRef(null);
  const inputRef = useRef(null);

  const refresh = useCallback(async () => {
    setFilesLoading(true);
    setFilesError("");
    try {
      setFiles(await listFiles());
    } catch (err) {
      setFilesError(err.message);
    } finally {
      setFilesLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const scrollToExplorer = () => {
    if (explorerRef.current) {
      explorerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  /** Shared execution pipeline. Validates, calls the API, builds the result panel. */
  const runOp = async ({ meta, execute, inputLabel, details, successNote }) => {
    setBusy(true);
    setResult(null);
    try {
      const res = await execute();
      setResult({
        status: "success",
        operation: res.operation || meta.method,
        methodLabel: meta.method + "()",
        message: res.message,
        input: inputLabel,
        details: details ? details(res) : [],
        code: CODE[meta.id],
        useCase: USE_CASES[meta.id],
      });
      toast.success(successNote || res.message);
      return res;
    } catch (err) {
      setResult({
        status: "error",
        operation: meta.method,
        methodLabel: meta.method + "()",
        message: err.message,
        input: inputLabel,
        details: [{ key: "Error", value: err.message, wrap: true }],
        code: CODE[meta.id],
        useCase: USE_CASES[meta.id],
      });
      toast.error(err.message);
      return null;
    } finally {
      setBusy(false);
      refresh();
    }
  };

  const clientError = (meta, message) => {
    setResult({
      status: "error",
      operation: meta.method,
      methodLabel: meta.method + "()",
      message,
      details: [{ key: "Error", value: message, wrap: true }],
      code: CODE[meta.id],
      useCase: USE_CASES[meta.id],
    });
    toast.error(message);
    if (inputRef.current) inputRef.current.focus();
  };

  /* ---------------- handlers ---------------- */

  const handleCreate = async () => {
    const name = form.name.trim();
    if (!name) return clientError({ id: "create", method: "fs.writeFile" }, "Filename cannot be empty.");
    await runOp({
      meta: { id: "create", method: "fs.writeFile" },
      execute: () => createFile(name, form.content),
      inputLabel: `name = "${name}" · content = ${JSON.stringify(form.content)}`,
      details: (res) =>
        buildDetails(
          {
            Filename: res.data.file.name,
            Size: res.data.file.sizeLabel,
            Created: formatTime(res.data.file.birthtime),
          },
          []
        ),
      successNote: `Created "${name}"`,
    });
  };

  const handleRead = async () => {
    if (!form.selectedFile) return clientError({ id: "read", method: "fs.readFile" }, "Select a file to read.");
    const res = await runOp({
      meta: { id: "read", method: "fs.readFile" },
      execute: () => readFile(form.selectedFile),
      inputLabel: `filename = "${form.selectedFile}"`,
      details: (r) =>
        buildDetails(
          {
            Filename: r.data.name,
            Size: r.data.sizeLabel,
            "Last Modified": formatTime(r.data.mtime),
            Content: r.data.content,
          },
          ["Content"]
        ),
      successNote: `Read "${form.selectedFile}"`,
    });
    if (res) setField("content", res.data.content);
  };

  const handleWrite = async () => {
    if (!form.selectedFile) return clientError({ id: "write", method: "fs.writeFile" }, "Select a file to overwrite.");
    await runOp({
      meta: { id: "write", method: "fs.writeFile" },
      execute: () => overwriteFile(form.selectedFile, form.content),
      inputLabel: `filename = "${form.selectedFile}" · new content = ${JSON.stringify(form.content)}`,
      details: (r) =>
        buildDetails(
          {
            Filename: r.data.name,
            "New Size": r.data.sizeLabel,
            "Last Modified": formatTime(r.data.mtime),
            "Write Mode": "truncate + write (flag: w)",
          },
          []
        ),
      successNote: `Overwrote "${form.selectedFile}"`,
    });
  };

  const handleAppend = async () => {
    if (!form.selectedFile) return clientError({ id: "append", method: "fs.appendFile" }, "Select a file to append to.");
    if (!form.content.trim()) return clientError({ id: "append", method: "fs.appendFile" }, "Content to append cannot be empty.");
    await runOp({
      meta: { id: "append", method: "fs.appendFile" },
      execute: () => appendFile(form.selectedFile, form.content),
      inputLabel: `filename = "${form.selectedFile}" · appended = ${JSON.stringify(form.content)}`,
      details: (r) => [
        { key: "Filename", value: form.selectedFile },
        { key: "Appended", value: form.content.replace(/\n$/, ""), wrap: true },
        { key: "Note", value: r.data.existed ? "Old content preserved, new content added at the end." : "File did not exist — fs.appendFile created it." },
      ],
      successNote: `Appended to "${form.selectedFile}"`,
    });
  };

  const handleRename = async () => {
    if (!form.selectedFile) return clientError({ id: "rename", method: "fs.rename" }, "Select the file to rename.");
    const newName = form.newName.trim();
    if (!newName) return clientError({ id: "rename", method: "fs.rename" }, "Enter the new filename.");
    const res = await runOp({
      meta: { id: "rename", method: "fs.rename" },
      execute: () => renameFile(form.selectedFile, newName),
      inputLabel: `${form.selectedFile}  ->  ${newName}`,
      details: (r) => [
        { key: "Old Name", value: r.data.oldName },
        { key: "New Name", value: r.data.newName },
        { key: "Result", value: "File moved to the new name in the same directory." },
      ],
      successNote: `Renamed to "${newName}"`,
    });
    if (res) setForm((f) => ({ ...f, selectedFile: newName, newName: "" }));
  };

  const handleDelete = async () => {
    const file = deleteTarget;
    setDeleteTarget(null);
    if (!file) return;
    const res = await runOp({
      meta: { id: "delete", method: "fs.unlink" },
      execute: () => deleteFile(file),
      inputLabel: `filename = "${file}"`,
      details: () => [{ key: "Deleted File", value: file }],
      successNote: `Deleted "${file}"`,
    });
    if (res && form.selectedFile === file) setField("selectedFile", "");
  };

  const handleScan = async () => {
    const res = await runOp({
      meta: { id: "list", method: "fs.readdir" },
      execute: () => listFiles(),
      inputLabel: `directory = "backend/storage"`,
      details: (r) => {
        const total = r.reduce((sum, f) => sum + (f.isDirectory ? 0 : f.size), 0);
        return [
          { key: "Found", value: `${r.length} file(s)` },
          { key: "Total Size", value: `${(total / 1024).toFixed(2)} KB` },
          { key: "Method", value: "fs.readdir() + fs.stat() per entry" },
        ];
      },
      successNote: `Found ${files.length} file(s)`,
    });
    if (res) scrollToExplorer();
  };

  const handleStats = async () => {
    if (!form.selectedFile) return clientError({ id: "stats", method: "fs.stat" }, "Select a file to inspect.");
    await runOp({
      meta: { id: "stats", method: "fs.stat" },
      execute: () => getFileStats(form.selectedFile),
      inputLabel: `filename = "${form.selectedFile}"`,
      details: (r) =>
        buildDetails(
          {
            Filename: r.data.name,
            Size: r.data.sizeLabel,
            "Size (Bytes)": r.data.size,
            Extension: "." + r.data.extension,
            "Created": formatTime(r.data.birthtime),
            "Last Modified": formatTime(r.data.mtime),
            "Is File": r.data.isFile ? "yes" : "no",
            "Is Directory": r.data.isDirectory ? "yes" : "no",
            "Safe Path": r.data.safePath,
          },
          ["Safe Path"]
        ),
      successNote: `Metadata for "${form.selectedFile}"`,
    });
  };

  /* ---------------- per-tab forms ---------------- */

  const createForm = (
    <>
      <div className="field">
        <label htmlFor="create-name">File name</label>
        <input
          id="create-name"
          ref={inputRef}
          className="input mono"
          placeholder="student.txt"
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
        />
        <span className="hint">Only a plain filename is allowed — no folders, no absolute paths.</span>
      </div>
      <div className="field">
        <label htmlFor="create-content">File content</label>
        <textarea
          id="create-content"
          className="textarea"
          placeholder={"My name is KPR.\nI am learning Node.js."}
          value={form.content}
          onChange={(e) => setField("content", e.target.value)}
        />
      </div>
      <div className="info-tile card" style={{ gridTemplateColumns: "1fr", marginBottom: 16 }}>
        <div className="text-sm" style={{ color: "var(--muted)" }}>
          <strong style={{ color: "var(--text)" }}>Create vs Write:</strong> Create uses{" "}
          <code>flag: "wx"</code> and fails if the file already exists. Write replaces content without
          error. A truly educational difference rendered by Node itself.
        </div>
      </div>
      <button type="button" className="btn btn-primary btn-block" onClick={handleCreate} disabled={busy}>
        <FilePlus2 size={16} /> Create File
      </button>
    </>
  );

  const readForm = (
    <>
      <div className="field">
        <label>File to read</label>
        <FileSelect files={files} value={form.selectedFile} onChange={(v) => setField("selectedFile", v)} />
      </div>
      <button type="button" className="btn btn-primary btn-block" onClick={handleRead} disabled={busy || !form.selectedFile}>
        <FileText size={16} /> Read File
      </button>
    </>
  );

  const writeForm = (
    <>
      <div className="field">
        <label>File to overwrite</label>
        <FileSelect files={files} value={form.selectedFile} onChange={(v) => setField("selectedFile", v)} />
      </div>
      <div className="field">
        <label htmlFor="write-content">New content</label>
        <textarea
          id="write-content"
          className="textarea"
          placeholder="This text will completely replace the old file content."
          value={form.content}
          onChange={(e) => setField("content", e.target.value)}
        />
      </div>
      <button type="button" className="btn btn-primary btn-block" onClick={handleWrite} disabled={busy || !form.selectedFile}>
        <FilePen size={16} /> Overwrite File
      </button>
    </>
  );

  const appendForm = (
    <>
      <div className="field">
        <label>File to append to</label>
        <FileSelect files={files} value={form.selectedFile} onChange={(v) => setField("selectedFile", v)} />
      </div>
      <div className="field">
        <label htmlFor="append-content">Content to append</label>
        <textarea
          id="append-content"
          className="textarea"
          placeholder={"Web Technologies Assignment."}
          value={form.content}
          onChange={(e) => setField("content", e.target.value)}
        />
        <span className="hint">Existing content is preserved — new text appears at the end.</span>
      </div>
      <button type="button" className="btn btn-primary btn-block" onClick={handleAppend} disabled={busy || !form.selectedFile}>
        <FileAppend size={16} /> Append Content
      </button>
    </>
  );

  const renameForm = (
    <>
      <div className="field">
        <label>Current file name</label>
        <FileSelect files={files} value={form.selectedFile} onChange={(v) => setField("selectedFile", v)} />
      </div>
      <div className="field">
        <label htmlFor="new-name">New file name</label>
        <input
          id="new-name"
          ref={inputRef}
          className="input mono"
          placeholder="renamed_student.txt"
          value={form.newName}
          onChange={(e) => setField("newName", e.target.value)}
        />
      </div>
      <button type="button" className="btn btn-primary btn-block" onClick={handleRename} disabled={busy || !form.selectedFile}>
        <FileSignature size={16} /> Rename File
      </button>
    </>
  );

  const deleteForm = (
    <>
      <div className="field">
        <label>File to delete</label>
        <FileSelect files={files} value={form.selectedFile} onChange={(v) => setField("selectedFile", v)} />
      </div>
      <div className="info-tile card" style={{ gridTemplateColumns: "1fr", marginBottom: 16 }}>
        <div className="text-sm" style={{ color: "var(--muted)" }}>
          <strong style={{ color: "var(--text)" }}>Safety:</strong> the backend sandboxes every path and
          never allows deletion outside <code>backend/storage</code>. A confirmation step runs on the frontend.
        </div>
      </div>
      <button
        type="button"
        className="btn btn-danger btn-block"
        disabled={busy || !form.selectedFile}
        onClick={() => setDeleteTarget(form.selectedFile)}
      >
        <Trash2 size={16} /> Delete File
      </button>
    </>
  );

  const listForm = (
    <>
      <div className="text-sm mb-16" style={{ color: "var(--muted)" }}>
        Click <strong style={{ color: "var(--text)" }}>Scan Directory</strong> to run{" "}
        <code>fs.readdir()</code> against the backend. The resulting table appears below in the Storage
        Explorer.
      </div>
      <button type="button" className="btn btn-primary btn-block" onClick={handleScan} disabled={busy}>
        <List size={16} /> Scan Directory
      </button>
    </>
  );

  const statsForm = (
    <>
      <div className="field">
        <label>File to inspect</label>
        <FileSelect files={files} value={form.selectedFile} onChange={(v) => setField("selectedFile", v)} />
      </div>
      <button type="button" className="btn btn-primary btn-block" onClick={handleStats} disabled={busy || !form.selectedFile}>
        <Info size={16} /> Inspect Metadata
      </button>
    </>
  );

  const forms = {
    create: createForm,
    read: readForm,
    write: writeForm,
    append: appendForm,
    rename: renameForm,
    delete: deleteForm,
    list: listForm,
    stats: statsForm,
  };

  const tabMeta = {
    create: { title: "Create File", desc: "Create a brand new file with content. Fails if the file already exists.", method: "fs.writeFile" },
    read: { title: "Read File", desc: "Read the contents of an existing file together with its size.", method: "fs.readFile" },
    write: { title: "Write / Overwrite File", desc: "Replace the contents of a file (or create it if missing).", method: "fs.writeFile" },
    append: { title: "Append File", desc: "Add content to the end of a file without removing existing content.", method: "fs.appendFile" },
    rename: { title: "Rename File", desc: "Rename or move a file within the storage directory.", method: "fs.rename" },
    delete: { title: "Delete File", desc: "Remove a file with a confirmation step.", method: "fs.unlink" },
    list: { title: "List Directory", desc: "List every file and folder in storage with sizes and modified times.", method: "fs.readdir" },
    stats: { title: "File Metadata", desc: "Inspect size, times, type and extension of a single file.", method: "fs.stat" },
  };

  const meta = tabMeta[tab];

  return (
    <>
      <div className="page-header">
        <div className="eyebrow">Node.js Module · Lab 01</div>
        <h1>File System Lab</h1>
        <p>Interact with files and folders using the Node.js fs module — every click runs real Node code.</p>
      </div>

      <div className="info-strip">
        <div className="card info-tile">
          <div className="tile-icon" style={{ background: "var(--primary-soft)", color: "#4338ca" }}>
            <Boxes size={17} />
          </div>
          <div>
            <div className="k">Module</div>
            <div className="v mono">fs</div>
          </div>
        </div>
        <div className="card info-tile">
          <div className="tile-icon" style={{ background: "var(--secondary-soft)", color: "#0e7490" }}>
            <Codepen size={17} />
          </div>
          <div>
            <div className="k">Purpose</div>
            <div className="v">Interact with the file system</div>
          </div>
        </div>
        <div className="card info-tile">
          <div className="tile-icon" style={{ background: "var(--success-soft)", color: "#15803d" }}>
            <HardDrive size={17} />
          </div>
          <div>
            <div className="k">Backend</div>
            <div className="v mono">Node.js + Express</div>
          </div>
        </div>
      </div>

      <div className="tabs" role="tablist" aria-label="File system operations">
        {FS_TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              type="button"
              className={`tab-pill ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="card card-pad">
        <OperationCard
          icon={tab === "list" ? <List size={20} /> : <FolderTree size={20} />}
          title={meta.title}
          desc={meta.desc}
          method={meta.method + "()"}
          moduleName="fs"
          tone="fs"
        />
        {tab === "list" && (
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={refresh} disabled={busy || filesLoading}>
              <RefreshCw size={14} className={filesLoading ? "spin" : ""} /> Refresh list
            </button>
          </div>
        )}
        {forms[tab]}
      </div>

      <ResultPanel result={result} />

      {/* Storage explorer — always visible below the operation area */}
      <div ref={explorerRef} className="section-head" style={{ marginTop: 36 }}>
        <h2>
          <HardDrive size={18} style={{ verticalAlign: -2, color: "var(--secondary)" }} />
          Storage Explorer
        </h2>
        <span className="rule" />
        <button type="button" className="btn btn-ghost btn-sm" onClick={refresh} disabled={filesLoading}>
          <RefreshCw size={14} className={filesLoading ? "spin" : ""} /> Refresh
        </button>
      </div>
      <FileTable
        files={files}
        loading={filesLoading}
        error={filesError}
        onSelect={(f) => {
          setField("selectedFile", f.name);
          setTab("read");
          toast.info(`Selected "${f.name}" — open the Read tab`);
        }}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete this file?"
        description="The file will be permanently removed from backend/storage using fs.unlink(). This cannot be undone."
        fileName={deleteTarget}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}