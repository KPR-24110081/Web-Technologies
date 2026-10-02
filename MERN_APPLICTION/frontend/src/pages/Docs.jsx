import { Server, FolderTree, Link2, Leaf, Boxes, GitMerge, Layers, Lightbulb, Database } from "lucide-react";

import CodePreview from "../components/CodePreview";

const LAYERS = [
  {
    letter: "M",
    name: "MongoDB",
    role: "NoSQL document database. Stores every operation as a JSON-like document in the 'operations' collection of the 'nodescope' database.",
  },
  {
    letter: "E",
    name: "Express.js",
    role: "Minimal Node.js web framework that maps HTTP requests (GET/POST/PUT/PATCH/DELETE) to handler functions and clean JSON responses.",
  },
  {
    letter: "R",
    name: "React",
    role: "JavaScript library for building the UI. Components render forms, tables and cards, then update from API responses.",
  },
  {
    letter: "N",
    name: "Node.js",
    role: "JavaScript runtime on the server. Executes the actual fs and url module logic driven by Express routes.",
  },
];

const SECTION_CODE = {
  fs: `const fsp = require("fs/promises");

await fsp.writeFile("hello.txt", "Hello World");   // create/write
const text = await fsp.readFile("hello.txt", "utf8"); // read
await fsp.appendFile("hello.txt", "\\nMore text");   // append
await fsp.rename("hello.txt", "renamed.txt");        // rename
await fsp.unlink("renamed.txt");                     // delete
const stats = await fsp.stat("hello.txt");           // metadata
const entries = await fsp.readdir(".");              // list`,
  path: `const path = require("path");

path.join("storage", "notes.txt");   // storage\\notes.txt
path.extname("report.pdf");          // .pdf
path.basename("/a/b/report.pdf");    // report.pdf
path.resolve("storage", "x.txt");    // absolute path
// resolveSafePath() uses path.resolve + path.sep checks
// to keep every file INSIDE backend/storage (anti-traversal).`,
  url: `const { URL } = require("url");

const u = new URL("https://example.com:8080/products?id=25#top");
u.protocol;   // "https:"
u.hostname;   // "example.com"
u.port;       // "8080"
u.pathname;   // "/products"
u.searchParams.get("id");  // "25"   (URLSearchParams)

const resolved = new URL("item.html",
  "https://example.com/products/").href;`,
  mongo: `// Mongoose schema -> MongoDB collection
const Operation = mongoose.model("Operation", operationSchema);

await Operation.create({ type: "FILE", operation: "CREATE", status: "success" });
await Operation.find({ type: "URL" }).sort({ createdAt: -1 }).limit(20);
await Operation.countDocuments({ status: "success" });`,
};

function Section({ icon, title, children }) {
  return (
    <div className="card card-pad" style={{ marginBottom: 18 }}>
      <div className="flex" style={{ marginBottom: 10 }}>
        <div className="tile-icon" style={{ width: 36, height: 36, borderRadius: 9, background: "var(--primary-soft)", color: "#4338ca", display: "grid", placeItems: "center" }}>
          {icon}
        </div>
        <h2 style={{ fontSize: 17 }}>{title}</h2>
      </div>
      <div className="text-sm" style={{ color: "var(--text-dim)", lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  );
}

export default function Docs() {
  return (
    <>
      <div className="page-header">
        <div className="eyebrow">Learn · MERN Stack</div>
        <h1>Documentation &amp; About</h1>
        <p>What MERN is, what each Node.js core module does, and how all the pieces talk to each other.</p>
      </div>

      {/* MERN strip */}
      <div className="info-strip">
        {LAYERS.map((l) => (
          <div key={l.letter} className="card info-tile">
            <div className="tile-icon" style={{ background: "var(--primary-soft)", color: "#4338ca" }}>
              <strong style={{ fontSize: 14 }}>{l.letter}</strong>
            </div>
            <div>
              <div className="v">{l.name}</div>
              <div className="text-sm text-muted" style={{ marginTop: 3 }}>{l.role}</div>
            </div>
          </div>
        ))}
      </div>

      <Section icon={<Boxes size={17} />} title="What is the MERN stack?">
        MERN is a full-stack JavaScript architecture: <strong>MongoDB</strong> (database),{" "}
        <strong>Express.js</strong> (server framework), <strong>React</strong> (frontend UI) and{" "}
        <strong>Node.js</strong> (runtime). One language — JavaScript — powers the entire stack, from
        the MongoDB query logic to the React components in this dashboard. The{" "}
        <em>M</em> matters most in this lab: without MongoDB the app falls back to flat files; with it,
        every operation becomes a queryable document.
      </Section>

      <Section icon={<FolderTree size={17} />} title="Node.js fs module (File System)">
        <p>
          The <code>fs/promises</code> API performs real file I/O on the server. This lab demonstrates
          create, read, write, append, rename, delete, list and stat using{" "}
          <code>writeFile</code>, <code>readFile</code>, <code>appendFile</code>, <code>rename</code>,{" "}
          <code>unlink</code>, <code>readdir</code> and <code>stat</code>. The <code>wx</code> flag makes
          writeFile behave like a strict "create only" operation.
        </p>
        <CodePreview code={SECTION_CODE.fs} title="fs operations in NodeScope" />
        <p className="mt-12" style={{ color: "var(--muted)" }}>
          <strong>Security:</strong> filenames are validated and resolved with the path module; anything
          containing <code>/</code>, <code>\</code> or <code>..</code> is rejected so no file can escape{" "}
          <code>backend/storage</code>.
        </p>
      </Section>

      <Section icon={<Layers size={17} />} title="Node.js path module">
        <p>
          Builds and normalises file paths. It powers <code>resolveSafePath()</code> in{" "}
          <code>backend/utils/safePath.js</code> — the function that guarantees every resolved path stays
          inside the storage sandbox (defense against directory traversal).
        </p>
        <CodePreview code={SECTION_CODE.path} title="path utilities used by the sandbox" />
      </Section>

      <Section icon={<Link2 size={17} />} title="Node.js url module (WHATWG URL + URLSearchParams)">
        <p>
          The <code>URL</code> class parses a URL into protocol, hostname, port, pathname, search, hash,
          origin and more. <code>URLSearchParams</code> gives a friendly API for the query string:{" "}
          <code>get()</code>, <code>has()</code>, <code>keys()</code>, <code>values()</code>,{" "}
          <code>entries()</code>, <code>set()</code>, <code>append()</code>, <code>delete()</code> and{" "}
          <code>toString()</code>. <code>new URL(relative, base)</code> resolves relative references.
        </p>
        <CodePreview code={SECTION_CODE.url} title="url + URLSearchParams in action" />
      </Section>

      <Section icon={<Leaf size={17} />} title="What is MongoDB?">
        MongoDB is a NoSQL document database. Data lives in <em>collections</em> of JSON-like documents
        rather than fixed tables. This app persists each run operation in the <code>NodeScope</code>{" "}
        database, <code>operations</code> collection, so the history and dashboard survive server
        restarts.
      </Section>

      <Section icon={<Server size={17} />} title="What is Mongoose (ODM)?">
        Mongoose is an <strong>O</strong>bject-<strong>D</strong>ocument <strong>M</strong>apping library.
        A schema (see <code>backend/models/Operation.js</code>) declares the shape of a document, and the
        model gives methods like <code>create()</code>, <code>find()</code>,{" "}
        <code>countDocuments()</code> and <code>deleteMany()</code> — turning JS objects into MongoDB
        documents and back.
        <CodePreview code={SECTION_CODE.mongo} title="Mongoose model usage" />
      </Section>

      <Section icon={<GitMerge size={17} />} title="How React communicates with Express">
        React never touches MongoDB or the file system directly. Each page calls a wrapper in{" "}
        <code>client-side services/</code> that uses <code>fetch()</code> to send HTTP requests (with a
        JSON body) to <code>/api/...</code>. Express parses the body, runs the Node.js logic, and
        answers with <code>{`{ success, message, data }`}</code>. React then updates the UI with the
        response — no page reload.
      </Section>

      <Section icon={<Database size={17} />} title="How Express communicates with MongoDB">
        Express handlers call Mongoose model methods inside services/controllers. For example, after{" "}
        <code>fs.writeFile()</code> succeeds, <code>logOperation()</code> creates an Operation document.{" "}
        <code>/api/history</code> and <code>/api/stats</code> read those same documents back with query
        filters and aggregations.
      </Section>

      <Section icon={<Lightbulb size={17} />} title="End-to-end: a single operation">
        <div className="card card-pad" style={{ background: "var(--bg)", border: "1px dashed var(--border-strong)" }}>
          <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }}>
            <li>User clicks <strong>Create File</strong> in React.</li>
            <li><code>services/fileApi.js</code> POSTs <code>{`{ name, content }`}</code> to <code>/api/files</code>.</li>
            <li>Express routes to <code>fileController.createFile</code>.</li>
            <li>Node.js runs <code>fs.writeFile(filePath, content, {'{ flag: "wx" }'})</code>.</li>
            <li>Mongoose stores a <code>FILE / CREATE / success</code> document in MongoDB.</li>
            <li>Express returns <code>{`{ success: true, data: { file } }`}</code>.</li>
            <li>React renders the result panel and refreshes the file table.</li>
          </ol>
        </div>
        The same pattern holds for every URL operation: React → Express → <code>new URL()</code> → MongoDB
        history → response → UI.
      </Section>
    </>
  );
}