import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const SRC_DIRS = ["src", "app", "pages", "lib", "components"].filter((d) =>
  fs.existsSync(path.join(ROOT, d))
);

const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

const PATTERNS = [
  { name: "uid", re: /\buid\b/g },
  { name: "userId", re: /\buserId\b/g },
  { name: "ownerId", re: /\bownerId\b/g },
  { name: "ownerUid", re: /\bownerUid\b/g },
  { name: "sessionUid", re: /\bsessionUid\b/g },
  { name: "/api/auth/me", re: /\/api\/auth\/me/g },
  { name: "Authorization header", re: /\bAuthorization\b/g },
  { name: "cookies()", re: /\bcookies\(\)/g },
];

function walk(dir, out = []) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const it of items) {
    if (it.name === "node_modules" || it.name === ".next" || it.name === ".git") continue;
    const full = path.join(dir, it.name);
    if (it.isDirectory()) walk(full, out);
    else {
      const ext = path.extname(it.name);
      if (EXTS.has(ext)) out.push(full);
    }
  }
  return out;
}

function countMatches(s, re) {
  const m = s.match(re);
  return m ? m.length : 0;
}

const files = SRC_DIRS.flatMap((d) => walk(path.join(ROOT, d)));
if (files.length === 0) {
  console.log("❌ No source files found in:", SRC_DIRS.join(", "));
  process.exit(1);
}

const rows = [];

for (const f of files) {
  const rel = path.relative(ROOT, f);
  const s = fs.readFileSync(f, "utf8");
  const counts = {};
  let any = false;

  for (const p of PATTERNS) {
    const c = countMatches(s, p.re);
    counts[p.name] = c;
    if (c > 0) any = true;
  }

  if (any) {
    rows.push({ file: rel, ...counts });
  }
}

rows.sort((a, b) => a.file.localeCompare(b.file));

const header = ["file", ...PATTERNS.map((p) => p.name)];
const lines = [header.join("\t")];

for (const r of rows) {
  lines.push(header.map((k) => String(r[k] ?? 0)).join("\t"));
}

fs.writeFileSync("id-audit.tsv", lines.join("\n"), "utf8");

console.log(`✅ Wrote id-audit.tsv with ${rows.length} files containing ID-related patterns.`);
console.log("Next step: open id-audit.tsv and look for mixed usage (uid + ownerId + userId) in same areas.");
