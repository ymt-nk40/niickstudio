"use client";

import { useMemo, useState } from "react";

/**
 * Pure JSON editor – never mutates the user's data structure.
 * Format / minify only affect whitespace.
 */
export default function JsonEditor({
  value,
  onChange,
  onInsert,
  disabled,
}) {
  const [localError, setLocalError] = useState(null);

  const validation = useMemo(() => {
    if (!value || !value.trim()) {
      return { valid: false, error: "Empty", parsed: null, isArray: false, count: 0 };
    }
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        const invalid = parsed.filter(
          (d) => !d || typeof d !== "object" || Array.isArray(d) || typeof d._type !== "string"
        );
        return {
          valid: invalid.length === 0,
          error:
            invalid.length > 0
              ? `${invalid.length} document(s) missing valid _type`
              : null,
          parsed,
          isArray: true,
          count: parsed.length,
        };
      }
      if (typeof parsed !== "object" || parsed === null) {
        return {
          valid: false,
          error: "Root must be an object or array of objects",
          parsed: null,
          isArray: false,
          count: 0,
        };
      }
      if (typeof parsed._type !== "string") {
        return {
          valid: false,
          error: "Missing or invalid _type (must be a string)",
          parsed,
          isArray: false,
          count: 1,
        };
      }
      return {
        valid: true,
        error: null,
        parsed,
        isArray: false,
        count: 1,
        type: parsed._type,
        id: parsed._id || null,
      };
    } catch (e) {
      return {
        valid: false,
        error: e.message || "Invalid JSON",
        parsed: null,
        isArray: false,
        count: 0,
      };
    }
  }, [value]);

  const handleFormat = () => {
    if (!validation.parsed) {
      setLocalError(validation.error || "Cannot format invalid JSON");
      return;
    }
    onChange(JSON.stringify(validation.parsed, null, 2));
    setLocalError(null);
  };

  const handleMinify = () => {
    if (!validation.parsed) {
      setLocalError(validation.error || "Cannot minify invalid JSON");
      return;
    }
    onChange(JSON.stringify(validation.parsed));
    setLocalError(null);
  };

  const handleClear = () => {
    onChange("");
    setLocalError(null);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value || "");
      setLocalError(null);
    } catch {
      setLocalError("Copy failed");
    }
  };

  // Expose validation to parent via onInsert? Parent will re-parse.
  // Provide a way for parent to get validation if needed.

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleFormat}
          disabled={disabled}
          className="rounded border border-zinc-600 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
        >
          Format
        </button>
        <button
          type="button"
          onClick={handleMinify}
          disabled={disabled}
          className="rounded border border-zinc-600 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
        >
          Minify
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={disabled || !value}
          className="rounded border border-zinc-600 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
        >
          Copy
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className="rounded border border-zinc-600 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
        >
          Clear
        </button>
        <span
          className={`ml-auto text-xs ${
            validation.valid
              ? "text-emerald-400"
              : value?.trim()
                ? "text-red-400"
                : "text-zinc-500"
          }`}
        >
          {validation.valid
            ? validation.isArray
              ? `Valid · ${validation.count} documents`
              : `Valid · ${validation.type}${validation.id ? ` · ${validation.id}` : ""}`
            : value?.trim()
              ? validation.error
              : "Paste JSON…"}
        </span>
      </div>

      <textarea
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setLocalError(null);
        }}
        disabled={disabled}
        spellCheck={false}
        placeholder={`{\n  "_type": "project",\n  "title": "Drive X",\n  "slug": { "_type": "slug", "current": "drive-x" }\n}`}
        className="min-h-[280px] flex-1 resize-y rounded-lg border border-zinc-700 bg-zinc-950 p-3 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600 disabled:opacity-60"
      />

      {(localError || (value?.trim() && !validation.valid)) && (
        <p className="text-xs text-red-400">{localError || validation.error}</p>
      )}
    </div>
  );
}

// Re-export validation helper for parent
export function validateJsonDocument(text) {
  if (!text || !text.trim()) {
    return { valid: false, error: "Empty JSON", parsed: null, isArray: false };
  }
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      const invalid = parsed.filter(
        (d) => !d || typeof d !== "object" || Array.isArray(d) || typeof d._type !== "string"
      );
      return {
        valid: invalid.length === 0,
        error: invalid.length ? `${invalid.length} invalid document(s)` : null,
        parsed,
        isArray: true,
        count: parsed.length,
      };
    }
    if (typeof parsed !== "object" || parsed === null) {
      return { valid: false, error: "Root must be an object", parsed: null, isArray: false };
    }
    if (typeof parsed._type !== "string") {
      return { valid: false, error: "Missing _type", parsed, isArray: false };
    }
    return {
      valid: true,
      error: null,
      parsed,
      isArray: false,
      type: parsed._type,
      id: parsed._id || null,
    };
  } catch (e) {
    return { valid: false, error: e.message, parsed: null, isArray: false };
  }
}
