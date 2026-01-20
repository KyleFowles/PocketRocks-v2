import fs from "fs";
import path from "path";

const FILES = [
  "src/lib/rocks.ts",
  "src/app/api/rocks/route.ts",
  "src/app/api/rocks/[rockId]/route.ts",
].filter((p) => fs.existsSync(p));

if (FILES.length === 0) {
  console.log("❌ Could not find expected files. Edit FILES in scripts/fix-rock-userid.mjs to match your repo.");
  process.exit(1);
}

function patchFile(file, patches) {
  let s = fs.readFileSync(file, "utf8");
  const orig = s;

  for (const { name, re, replace } of patches) {
    const m = s.match(re);
    if (!m) {
      console.log(`⚠️  [SKIP] ${path.basename(file)}: patch not applied (${name})`);
      continue;
    }
    s = s.replace(re, replace);
    console.log(`✅ [OK] ${path.basename(file)}: applied (${name})`);
  }

  if (s !== orig) fs.writeFileSync(file, s, "utf8");
}

for (const f of FILES) {
  const base = path.basename(f);

  // These patches are intentionally conservative (only apply if patterns exist).
  patchFile(f, [
    {
      name: "Ensure server returns userId (alias ownerId if needed)",
      re: /ownerId\s*:/g,
      replace: "userId:",
    },
  ]);

  // Extra: if your API code uses ownerId as the field name in output,
  // switching it to userId makes the client consistent.
}

console.log("✅ Done. Now run: npm run dev and retest.");
console.log("If any patch skipped, paste that file’s relevant section and I’ll generate a precise patch for it.");
