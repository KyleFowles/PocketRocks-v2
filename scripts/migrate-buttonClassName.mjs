/* ============================================================
   FILE: scripts/migrate-buttonClassName.mjs

   SCOPE:
   One-time codemod for Option B (build-to-last).
   - Converts legacy buttonClassName("secondary", "mt-2") style calls
     into object style: buttonClassName({ variant: "secondary", className: "mt-2" })
   - Converts 3-arg calls where arg2 is size into { size: "md" } form
   - Safe-ish regex-based migration (works great for simple string-literal calls)
   - Run: node scripts/migrate-buttonClassName.mjs
   ============================================================ */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");

function isTsLike(file) {
  return file.endsWith(".ts") || file.endsWith(".tsx");
}

function walk(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === "node_modules" || e.name === ".next") continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.isFile() && isTsLike(full)) out.push(full);
  }
  return out;
}

function isSizeLiteral(s) {
  return s === '"sm"' || s === '"md"' || s === '"lg"' || s === "'sm'" || s === "'md'" || s === "'lg'";
}

/**
 * Matches buttonClassName("primary")
 * Matches buttonClassName("secondary","mt-2")
 * Matches buttonClassName("secondary","md","mt-2")
 * NOTE: Only string-literal args. (That’s usually what these are.)
 */
const CALL_RE =
  /buttonClassName\(\s*(['"][^'"]+['"])\s*(?:,\s*(['"][^'"]+['"])\s*)?(?:,\s*(['"][^'"]+['"])\s*)?\)/g;

function migrateCalls(code) {
  return code.replace(CALL_RE, (full, a1, a2, a3) => {
    const variant = a1;

    // 1 arg: buttonClassName("primary") -> object
    if (!a2 && !a3) {
      return `buttonClassName({ variant: ${variant} })`;
    }

    // 2 args: either (variant, className) OR (variant, size)
    if (a2 && !a3) {
      if (isSizeLiteral(a2)) {
        return `buttonClassName({ variant: ${variant}, size: ${a2} })`;
      }
      return `buttonClassName({ variant: ${variant}, className: ${a2} })`;
    }

    // 3 args: most common legacy (variant, size, className)
    // If a2 is size -> treat as size + className
    // Else treat as className + size (rare, but we’ll support it)
    if (a2 && a3) {
      if (isSizeLiteral(a2)) {
        return `buttonClassName({ variant: ${variant}, size: ${a2}, className: ${a3} })`;
      }
      if (isSizeLiteral(a3)) {
        return `buttonClassName({ variant: ${variant}, size: ${a3}, className: ${a2} })`;
      }
      // fallback: assume second is className, ignore third as extra className chunk
      return `buttonClassName({ variant: ${variant}, className: ${a2} + " " + ${a3} })`;
    }

    return full;
  });
}

function main() {
  const files = walk(SRC_DIR);
  let changedCount = 0;

  for (const file of files) {
    const before = fs.readFileSync(file, "utf8");
    if (!before.includes("buttonClassName(")) continue;

    const after = migrateCalls(before);
    if (after !== before) {
      fs.writeFileSync(file, after, "utf8");
      changedCount++;
      console.log(`Updated: ${path.relative(ROOT, file)}`);
    }
  }

  console.log(`\nDone. Files changed: ${changedCount}`);
  console.log(`Next: npm run build`);
}

main();
