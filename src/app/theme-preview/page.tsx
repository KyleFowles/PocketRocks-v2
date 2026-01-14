/* ============================================================
   FILE: src/app/theme-preview/page.tsx

   SCOPE:
   Theme Preview (internal tool page)
   - Pick ONE base color and generate the theme automatically
   - Simple intensity toggle: Subtle / Bold (replaces manual sliders)
   - Save/load presets (localStorage)
   - Export/import JSON
   - Generate DEFAULT_THEME block + changed-only override
   - Diff vs DEFAULT_THEME
   ============================================================ */

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/Button";
import {
  applyTheme,
  BASE_BUTTON_COLOR,
  buildThemeFromBase,
  DEFAULT_THEME,
  type ThemeTokens,
} from "@/lib/theme";

type TokenKey = keyof ThemeTokens;

const STORAGE_PREFIX = "pocketrocks_theme_slot_";
type SlotId = 1 | 2 | 3;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function isHex(v: string) {
  return /^#[0-9a-fA-F]{6}$/.test((v || "").trim());
}

function clampHex(v: string) {
  const s = (v || "").trim();
  return isHex(s) ? s.toUpperCase() : "#000000";
}

function safeJsonStringify(obj: any) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return "";
  }
}

function isObject(v: any) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function normalizeTheme(maybe: any): ThemeTokens | null {
  if (!isObject(maybe)) return null;

  const required: Array<TokenKey> = [
    "buttonTop",
    "buttonMain",
    "buttonBottom",
    "buttonEdge",
    "buttonInnerTop",
    "buttonInnerBottom",
    "buttonSheen",
    "buttonGlow",
    "buttonGlowStrong",
    "focusRing",
    "focusRingStrong",
  ];

  for (const k of required) if (typeof maybe[k] !== "string") return null;

  return {
    buttonTop: maybe.buttonTop,
    buttonMain: maybe.buttonMain,
    buttonBottom: maybe.buttonBottom,
    buttonEdge: maybe.buttonEdge,
    buttonInnerTop: maybe.buttonInnerTop,
    buttonInnerBottom: maybe.buttonInnerBottom,
    buttonSheen: maybe.buttonSheen,
    buttonGlow: maybe.buttonGlow,
    buttonGlowStrong: maybe.buttonGlowStrong,
    focusRing: maybe.focusRing,
    focusRingStrong: maybe.focusRingStrong,
  };
}

function stableKeyOrder(): Array<TokenKey> {
  return [
    "buttonTop",
    "buttonMain",
    "buttonBottom",
    "buttonEdge",
    "buttonInnerTop",
    "buttonInnerBottom",
    "buttonSheen",
    "buttonGlow",
    "buttonGlowStrong",
    "focusRing",
    "focusRingStrong",
  ];
}

function buildDefaultThemeBlock(tokens: ThemeTokens) {
  const lines = stableKeyOrder().map((k) => `  ${k}: ${JSON.stringify(tokens[k])},`);
  return [`export const DEFAULT_THEME: ThemeTokens = {`, ...lines, `};`, ``].join("\n");
}

function diffTokens(current: ThemeTokens, baseline: ThemeTokens) {
  return stableKeyOrder()
    .map((k) => {
      const before = String(baseline[k]);
      const after = String(current[k]);
      return { key: k, before, after, changed: before !== after };
    })
    .filter((d) => d.changed);
}

function buildChangedOnlyBlock(current: ThemeTokens, baseline: ThemeTokens) {
  const diffs = diffTokens(current, baseline);
  if (diffs.length === 0) return `// No changes vs DEFAULT_THEME\n`;

  const lines = diffs.map((d) => `  ${d.key}: ${JSON.stringify(d.after)},`);
  return [
    `// Changed-only override (useful for client themes, experiments, etc.)`,
    `export const THEME_OVERRIDE: Partial<ThemeTokens> = {`,
    ...lines,
    `};`,
    ``,
  ].join("\n");
}

function toDisplayName(k: string) {
  return k
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
      {children}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/12 bg-white/7 px-2 py-0.5 text-[11px] font-semibold text-white/75">
      {children}
    </span>
  );
}

type IntensityMode = "subtle" | "bold";

function intensityToParams(mode: IntensityMode) {
  // Subtle: less gradient + less glow (clean SaaS)
  if (mode === "subtle") return { depth: 0.52, punch: 0.48 };
  // Bold: more gradient + more glow (more “sizzle”)
  return { depth: 0.78, punch: 0.76 };
}

function Segmented({
  value,
  onChange,
}: {
  value: IntensityMode;
  onChange: (v: IntensityMode) => void;
}) {
  return (
    <div className="flex overflow-hidden rounded-xl border border-white/10 bg-black/20 p-1">
      <button
        type="button"
        onClick={() => onChange("subtle")}
        className={[
          "flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition",
          value === "subtle"
            ? "bg-white/10 text-white/90"
            : "bg-transparent text-white/60 hover:bg-white/7 hover:text-white/80",
        ].join(" ")}
      >
        Subtle
      </button>
      <button
        type="button"
        onClick={() => onChange("bold")}
        className={[
          "flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition",
          value === "bold"
            ? "bg-white/10 text-white/90"
            : "bg-transparent text-white/60 hover:bg-white/7 hover:text-white/80",
        ].join(" ")}
      >
        Bold
      </button>
    </div>
  );
}

export default function ThemePreviewPage() {
  // You pick one base, we generate the tokens
  const [baseHex, setBaseHex] = useState<string>(BASE_BUTTON_COLOR);

  // New: simple intensity toggle
  const [intensity, setIntensity] = useState<IntensityMode>("bold");

  const params = useMemo(() => intensityToParams(intensity), [intensity]);

  // Generated theme tokens
  const tokens = useMemo(
    () => buildThemeFromBase(clampHex(baseHex), params),
    [baseHex, params]
  );

  // Tool UI
  const [jsonText, setJsonText] = useState("");
  const [codeText, setCodeText] = useState("");
  const [overrideText, setOverrideText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [showOnlyChanges, setShowOnlyChanges] = useState(true);

  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    applyTheme(tokens);
  }, [tokens]);

  const diffs = useMemo(() => diffTokens(tokens, DEFAULT_THEME), [tokens]);
  const changedCount = diffs.length;

  function toast(msg: string, ms = 2000) {
    setStatus(msg);
    setTimeout(() => setStatus(null), ms);
  }

  function resetToDefaults() {
    setBaseHex(BASE_BUTTON_COLOR);
    setIntensity("bold");
    toast("Reset to base defaults.", 1500);
  }

  function saveSlot(slot: SlotId) {
    try {
      const payload = { baseHex: clampHex(baseHex), intensity };
      localStorage.setItem(`${STORAGE_PREFIX}${slot}`, safeJsonStringify(payload));
      toast(`Saved to Slot ${slot}.`);
    } catch {
      toast("Could not save (localStorage blocked).", 2500);
    }
  }

  function loadSlot(slot: SlotId) {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${slot}`);
      if (!raw) return toast(`Slot ${slot} is empty.`);

      const parsed = JSON.parse(raw);
      if (!isObject(parsed)) return toast(`Slot ${slot} is invalid.`, 2500);

      const nextBase = typeof parsed.baseHex === "string" ? clampHex(parsed.baseHex) : BASE_BUTTON_COLOR;
      const nextIntensity: IntensityMode =
        parsed.intensity === "subtle" || parsed.intensity === "bold" ? parsed.intensity : "bold";

      setBaseHex(nextBase);
      setIntensity(nextIntensity);
      toast(`Loaded Slot ${slot}.`);
    } catch {
      toast(`Failed to load Slot ${slot}.`, 2500);
    }
  }

  function exportJsonToBox() {
    setJsonText(safeJsonStringify(tokens));
    toast("Exported theme tokens to JSON box.");
  }

  async function copyJsonToClipboard() {
    try {
      await navigator.clipboard.writeText(safeJsonStringify(tokens));
      toast("Copied theme JSON to clipboard.");
    } catch {
      toast("Copy failed. Export and copy manually.", 2500);
    }
  }

  function downloadJson() {
    const txt = safeJsonStringify(tokens);
    const blob = new Blob([txt], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "pocketrocks-theme.json";
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
    toast("Downloaded theme JSON.");
  }

  function importFromJsonString(raw: string) {
    try {
      const parsed = JSON.parse(raw);
      const normalized = normalizeTheme(parsed);
      if (!normalized) return toast("Import failed: JSON does not match ThemeTokens.", 3000);

      // Import applies tokens directly for preview use
      applyTheme(normalized);
      setJsonText(safeJsonStringify(normalized));
      toast("Imported and applied theme tokens (preview only).", 2500);
    } catch {
      toast("Import failed: invalid JSON.", 3000);
    }
  }

  function handleFilePick() {
    fileRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      setJsonText(text);
      importFromJsonString(text);
    } catch {
      toast("Could not read file.", 2500);
    }
  }

  function generateBlocks() {
    setCodeText(buildDefaultThemeBlock(tokens));
    setOverrideText(buildChangedOnlyBlock(tokens, DEFAULT_THEME));
    toast("Generated theme blocks.");
  }

  async function copyDefaultThemeBlock() {
    const code = buildDefaultThemeBlock(tokens);
    try {
      await navigator.clipboard.writeText(code);
      setCodeText(code);
      toast("Copied DEFAULT_THEME block.");
    } catch {
      setCodeText(code);
      toast("Copy failed. Use the box.", 2500);
    }
  }

  async function copyOverrideBlock() {
    const code = buildChangedOnlyBlock(tokens, DEFAULT_THEME);
    try {
      await navigator.clipboard.writeText(code);
      setOverrideText(code);
      toast("Copied changed-only override block.");
    } catch {
      setOverrideText(code);
      toast("Copy failed. Use the box.", 2500);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-white/95">Theme Preview</h1>
        <p className="text-sm text-white/65">
          Pick one base button color. PocketRocks generates a cohesive theme automatically.
        </p>
        <div className="mt-1 flex items-center gap-2">
          <Badge>
            Changes vs default: <span className="ml-1 text-white/90">{changedCount}</span>
          </Badge>
          {status ? <div className="text-sm font-semibold text-white/85">{status}</div> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
        {/* LEFT */}
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div className="text-lg font-semibold text-white/90">Generator Controls</div>
            <Button variant="secondary" size="sm" onClick={resetToDefaults}>
              Reset
            </Button>
          </div>

          <div className="mt-4 space-y-4">
            {/* Base Color */}
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="mb-2 text-sm font-semibold text-white/85">Base Button Color</div>
              <div className="flex items-center justify-between gap-3">
                <input
                  type="color"
                  value={isHex(baseHex) ? baseHex : "#000000"}
                  onChange={(e) => setBaseHex(e.target.value.toUpperCase())}
                  className="h-10 w-12 cursor-pointer rounded-lg border border-white/15 bg-transparent"
                  aria-label="Base color picker"
                />
                <input
                  value={baseHex}
                  onChange={(e) => setBaseHex(e.target.value)}
                  className="h-10 w-full rounded-xl border border-white/15 bg-black/30 px-3 text-sm font-semibold text-white/90 outline-none focus:border-white/30"
                  placeholder="#RRGGBB"
                  aria-label="Base color hex"
                />
              </div>
              <div className="mt-2 text-xs text-white/55">
                You pick one color. The app generates top/main/bottom, glow, and ring automatically.
              </div>
            </div>

            {/* NEW: Intensity toggle */}
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="mb-2 text-sm font-semibold text-white/85">Intensity</div>
              <Segmented value={intensity} onChange={(v) => setIntensity(v)} />
              <div className="mt-2 text-xs text-white/55">
                Subtle = cleaner, calmer SaaS. Bold = more pop and glow.
              </div>
            </div>

            {/* Presets */}
            <div>
              <div className="mb-2 text-sm font-semibold text-white/80">Preset Slots (local)</div>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="secondary" size="sm" onClick={() => saveSlot(1)}>
                  Save 1
                </Button>
                <Button variant="secondary" size="sm" onClick={() => saveSlot(2)}>
                  Save 2
                </Button>
                <Button variant="secondary" size="sm" onClick={() => saveSlot(3)}>
                  Save 3
                </Button>

                <Button variant="ghost" size="sm" onClick={() => loadSlot(1)}>
                  Load 1
                </Button>
                <Button variant="ghost" size="sm" onClick={() => loadSlot(2)}>
                  Load 2
                </Button>
                <Button variant="ghost" size="sm" onClick={() => loadSlot(3)}>
                  Load 3
                </Button>
              </div>
            </div>

            {/* Export / Import */}
            <div>
              <div className="mb-2 text-sm font-semibold text-white/80">Export / Import</div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="primary" size="sm" onClick={copyJsonToClipboard}>
                  Copy JSON
                </Button>
                <Button variant="secondary" size="sm" onClick={downloadJson}>
                  Download JSON
                </Button>
                <Button variant="ghost" size="sm" onClick={exportJsonToBox}>
                  Export to Box
                </Button>
                <Button variant="ghost" size="sm" onClick={handleFilePick}>
                  Import File
                </Button>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-2">
                <div className="mb-2 text-xs font-semibold text-white/70">Paste JSON here to import tokens:</div>
                <textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  className="h-32 w-full resize-none rounded-lg border border-white/15 bg-black/30 p-2 text-xs text-white/90 outline-none focus:border-white/30"
                  placeholder='Click "Export to Box" or paste theme JSON here...'
                />
                <div className="mt-2 flex gap-2">
                  <Button variant="primary" size="sm" onClick={() => importFromJsonString(jsonText || "")}>
                    Import From Box
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setJsonText("")}>
                    Clear
                  </Button>
                </div>
              </div>
            </div>

            {/* Lock it in */}
            <div>
              <div className="mb-2 text-sm font-semibold text-white/80">Lock It In</div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="primary" size="sm" onClick={generateBlocks}>
                  Generate Blocks
                </Button>
                <Button variant="secondary" size="sm" onClick={copyDefaultThemeBlock}>
                  Copy DEFAULT_THEME
                </Button>
              </div>

              <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-2">
                <div className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold text-white/70">
                  <span>Paste-ready DEFAULT_THEME</span>
                  <Badge>{stableKeyOrder().length} keys</Badge>
                </div>
                <textarea
                  value={codeText}
                  onChange={(e) => setCodeText(e.target.value)}
                  className="h-36 w-full resize-none rounded-lg border border-white/15 bg-black/30 p-2 font-mono text-[11px] text-white/90 outline-none focus:border-white/30"
                  placeholder='Click "Generate Blocks"'
                />
              </div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="text-xs text-white/55">Changed-only override (great for client themes).</div>
                <Button variant="ghost" size="sm" onClick={copyOverrideBlock}>
                  Copy Override
                </Button>
              </div>

              <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-2">
                <div className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold text-white/70">
                  <span>Changed-only override</span>
                  <Badge>{changedCount} changed</Badge>
                </div>
                <textarea
                  value={overrideText}
                  onChange={(e) => setOverrideText(e.target.value)}
                  className="h-28 w-full resize-none rounded-lg border border-white/15 bg-black/30 p-2 font-mono text-[11px] text-white/90 outline-none focus:border-white/30"
                  placeholder='Click "Generate Blocks"'
                />
              </div>
            </div>

            {/* Diff */}
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-white/80">Compare vs DEFAULT_THEME</div>
                <button
                  type="button"
                  onClick={() => setShowOnlyChanges((v) => !v)}
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs font-semibold text-white/80 hover:bg-white/7"
                >
                  {showOnlyChanges ? "Show All" : "Show Only Changes"}
                </button>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                {showOnlyChanges ? (
                  changedCount === 0 ? (
                    <div className="text-sm text-white/65">No changes. You’re matching DEFAULT_THEME.</div>
                  ) : (
                    <div className="space-y-2">
                      {diffs.map((d) => (
                        <div key={String(d.key)} className="rounded-xl border border-white/10 bg-white/5 p-2">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <div className="text-xs font-semibold text-white/85">{toDisplayName(String(d.key))}</div>
                            <Badge>changed</Badge>
                          </div>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div className="rounded-lg border border-white/10 bg-black/25 p-2">
                              <div className="mb-1 text-[10px] font-semibold text-white/55">DEFAULT</div>
                              <div className="flex items-center justify-between gap-2">
                                <code className="text-[11px] text-white/75">{d.before}</code>
                                <div className="h-5 w-8 rounded-md border border-white/15" style={{ background: d.before }} />
                              </div>
                            </div>
                            <div className="rounded-lg border border-white/10 bg-black/25 p-2">
                              <div className="mb-1 text-[10px] font-semibold text-white/55">CURRENT</div>
                              <div className="flex items-center justify-between gap-2">
                                <code className="text-[11px] text-white/90">{d.after}</code>
                                <div className="h-5 w-8 rounded-md border border-white/15" style={{ background: d.after }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="space-y-2">
                    {stableKeyOrder().map((k) => {
                      const before = String(DEFAULT_THEME[k]);
                      const after = String(tokens[k]);
                      const changed = before !== after;

                      return (
                        <div
                          key={String(k)}
                          className={[
                            "rounded-xl border p-2",
                            changed ? "border-white/14 bg-white/6" : "border-white/8 bg-white/4",
                          ].join(" ")}
                        >
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <div className="text-xs font-semibold text-white/85">{toDisplayName(String(k))}</div>
                            {changed ? <Badge>changed</Badge> : <span className="text-[11px] text-white/45">same</span>}
                          </div>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div className="rounded-lg border border-white/10 bg-black/25 p-2">
                              <div className="mb-1 text-[10px] font-semibold text-white/55">DEFAULT</div>
                              <div className="flex items-center justify-between gap-2">
                                <code className="text-[11px] text-white/70">{before}</code>
                                <div className="h-5 w-8 rounded-md border border-white/15" style={{ background: before }} />
                              </div>
                            </div>
                            <div className="rounded-lg border border-white/10 bg-black/25 p-2">
                              <div className="mb-1 text-[10px] font-semibold text-white/55">CURRENT</div>
                              <div className="flex items-center justify-between gap-2">
                                <code className="text-[11px] text-white/85">{after}</code>
                                <div className="h-5 w-8 rounded-md border border-white/15" style={{ background: after }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* RIGHT */}
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between gap-2">
              <div className="text-lg font-semibold text-white/90">Buttons Preview</div>
              <Badge>{intensity}</Badge>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Button variant="primary" size="sm">
                Primary (sm)
              </Button>
              <Button variant="primary" size="md">
                Primary (md)
              </Button>
              <Button variant="primary" size="lg">
                Primary (lg)
              </Button>

              <Button variant="primary" size="md" fullWidth>
                Full Width Primary
              </Button>

              <Button variant="primary" size="md" disabled>
                Disabled Primary
              </Button>

              <Button variant="primary" size="md" loading>
                Loading Primary
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="dangerGhost">Danger Ghost</Button>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/65">
              Your job: base color + intensity. Everything else stays cohesive.
            </div>
          </Card>

          <Card>
            <div className="text-lg font-semibold text-white/90">Generated Tokens (read-only)</div>
            <div className="mt-3 space-y-2">
              {stableKeyOrder().map((k) => (
                <div
                  key={String(k)}
                  className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                >
                  <div className="text-xs font-semibold text-white/75">{toDisplayName(String(k))}</div>
                  <div className="flex items-center gap-2">
                    <code className="text-[11px] text-white/85">{String(tokens[k])}</code>
                    <div className="h-5 w-8 rounded-md border border-white/15" style={{ background: String(tokens[k]) }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
