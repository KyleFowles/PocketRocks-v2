/* ============================================================
   FILE: scripts/convert-buttons-to-Button.ts

   SCOPE:
   Converts <button> usage to <Button> component across src/.
   - Replaces <button>...</button> and <button />
   - Adds import: import { Button } from "@/components/Button";
   - Removes common Tailwind orange/red ring/bg/gradient classes that fight the component
   - IMPORTANT: Review diffs after running
   - FIX: Avoids TypeScript error with JsxSpreadAttribute (Turbopack/Next build)
   ============================================================ */

import { Project, SyntaxKind, Node, JsxAttribute } from "ts-morph";
import path from "path";

const project = new Project({
  tsConfigFilePath: path.join(process.cwd(), "tsconfig.json"),
  skipAddingFilesFromTsConfig: false,
});

const SOURCE_GLOBS = ["src/**/*.ts", "src/**/*.tsx"];
const files = project.addSourceFilesAtPaths(SOURCE_GLOBS);

function hasButtonImport(text: string) {
  return /from\s+["']@\/components\/Button["']/.test(text);
}

function addButtonImportIfNeeded(sourceText: string) {
  if (hasButtonImport(sourceText)) return sourceText;

  const lines = sourceText.split("\n");
  let lastImportLine = -1;

  for (let i = 0; i < lines.length; i++) {
    if (/^\s*import\s/.test(lines[i])) lastImportLine = i;
  }

  const importLine = `import { Button } from "@/components/Button";`;
  if (lastImportLine >= 0) {
    lines.splice(lastImportLine + 1, 0, importLine);
  } else {
    lines.unshift(importLine, "");
  }

  return lines.join("\n");
}

function getJsxAttributeByName(attrs: ReturnType<any>, name: string): JsxAttribute | undefined {
  // attrs includes JsxAttribute and JsxSpreadAttribute — only JsxAttribute has getNameNode()
  for (const a of attrs) {
    if (Node.isJsxAttribute(a)) {
      if (a.getNameNode().getText() === name) return a;
    }
  }
  return undefined;
}

function getStringInitializerValue(attr?: JsxAttribute): string {
  if (!attr) return "";
  const init = attr.getInitializer();
  if (!init) return "";

  // className="..."
  if (Node.isStringLiteral(init)) {
    return init.getLiteralText();
  }

  // className={"..."} or className={'...'}
  if (Node.isJsxExpression(init)) {
    const expr = init.getExpression();
    if (expr && Node.isStringLiteral(expr)) return expr.getLiteralText();
  }

  // Anything else (cn(), template strings, etc.) — skip auto-parsing
  return "";
}

function setStringInitializer(attr: JsxAttribute, value: string) {
  // Set as a normal string literal: className="..."
  attr.setInitializer(`"${value}"`);
}

function classifyVariant(className: string) {
  const c = className || "";
  if (/bg-orange|from-orange|to-orange|ring-orange|text-orange/.test(c)) return "primary";
  if (/bg-red|from-red|to-red|ring-red|text-red/.test(c)) return "danger";
  if (/bg-transparent|ghost/.test(c)) return "ghost";
  if (/secondary|outline|border/.test(c)) return "secondary";
  return "primary";
}

function stripTailwindColorStuff(className: string) {
  return (className || "")
    .replace(/\bbg-orange-\S+\b/g, "")
    .replace(/\bhover:bg-orange-\S+\b/g, "")
    .replace(/\bactive:bg-orange-\S+\b/g, "")
    .replace(/\bring-orange-\S+\b/g, "")
    .replace(/\bfocus:ring-orange-\S+\b/g, "")
    .replace(/\bfocus-visible:ring-orange-\S+\b/g, "")
    .replace(/\bfrom-orange-\S+\b/g, "")
    .replace(/\bto-orange-\S+\b/g, "")
    .replace(/\bvia-orange-\S+\b/g, "")
    .replace(/\btext-orange-\S+\b/g, "")
    .replace(/\bborder-orange-\S+\b/g, "")
    .replace(/\bbg-red-\S+\b/g, "")
    .replace(/\bhover:bg-red-\S+\b/g, "")
    .replace(/\bactive:bg-red-\S+\b/g, "")
    .replace(/\bring-red-\S+\b/g, "")
    .replace(/\bfocus:ring-red-\S+\b/g, "")
    .replace(/\bfocus-visible:ring-red-\S+\b/g, "")
    .replace(/\bfrom-red-\S+\b/g, "")
    .replace(/\bto-red-\S+\b/g, "")
    .replace(/\bvia-red-\S+\b/g, "")
    .replace(/\btext-red-\S+\b/g, "")
    .replace(/\bborder-red-\S+\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

let changedCount = 0;

for (const sf of files) {
  // only touch src/ files
  if (!sf.getFilePath().includes(path.join("src", path.sep))) continue;

  const jsxElems = sf.getDescendantsOfKind(SyntaxKind.JsxElement);
  const jsxSelf = sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);

  let touched = false;

  // Convert <button>...</button>
  for (const el of jsxElems) {
    const opening = el.getOpeningElement();
    const tag = opening.getTagNameNode().getText();
    if (tag !== "button") continue;

    const attrs = opening.getAttributes();
    const classAttr = getJsxAttributeByName(attrs, "className");

    const classText = getStringInitializerValue(classAttr);
    const variant = classifyVariant(classText);
    const cleaned = stripTailwindColorStuff(classText);

    // change tag name
    opening.getTagNameNode().replaceWithText("Button");
    el.getClosingElement().getTagNameNode().replaceWithText("Button");

    // set variant prop if needed
    if (variant !== "primary") {
      opening.addAttribute({ name: "variant", initializer: `"${variant}"` });
    }

    // update className only if it was a simple string we could parse
    if (classAttr) {
      if (classText) {
        if (cleaned) setStringInitializer(classAttr, cleaned);
        else classAttr.remove();
      }
      // If className was complex (cn(), template literal, etc.) we leave it alone.
    }

    touched = true;
  }

  // Convert <button />
  for (const el of jsxSelf) {
    const tag = el.getTagNameNode().getText();
    if (tag !== "button") continue;

    const attrs = el.getAttributes();
    const classAttr = getJsxAttributeByName(attrs, "className");

    const classText = getStringInitializerValue(classAttr);
    const variant = classifyVariant(classText);
    const cleaned = stripTailwindColorStuff(classText);

    el.getTagNameNode().replaceWithText("Button");

    if (variant !== "primary") {
      el.addAttribute({ name: "variant", initializer: `"${variant}"` });
    }

    if (classAttr) {
      if (classText) {
        if (cleaned) setStringInitializer(classAttr, cleaned);
        else classAttr.remove();
      }
    }

    touched = true;
  }

  if (touched) {
    let text = sf.getFullText();
    text = addButtonImportIfNeeded(text);
    sf.replaceWithText(text);
    changedCount++;
  }
}

project.saveSync();
console.log(`Done. Updated ${changedCount} files.`);
