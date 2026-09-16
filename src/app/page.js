"use client";

import { useCallback, useEffect, useState } from "react";
import AssetUploadPanel from "@/components/sanity/AssetUploadPanel";
import DocumentUploadPanel from "@/components/sanity/DocumentUploadPanel";
import DocumentExplorer from "@/components/sanity/DocumentExplorer";
import Toast from "@/components/ui/Toast";
import { getPublicSanityConfig } from "@/lib/sanity/config";

export default function HomePage() {
  const [jsonValue, setJsonValue] = useState("");
  const [toast, setToast] = useState(null);
  const [status, setStatus] = useState({
    connected: false,
    loading: true,
    projectId: "",
    dataset: "",
    apiVersion: "",
    hasWriteToken: false,
    error: null,
  });

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type, key: Date.now() });
  }, []);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/sanity/status");
      const data = await res.json();
      setStatus({
        connected: Boolean(data.connected),
        loading: false,
        projectId: data.projectId || "",
        dataset: data.dataset || "",
        apiVersion: data.apiVersion || "2024-01-01",
        hasWriteToken: Boolean(data.hasWriteToken),
        error: data.error || null,
      });
    } catch (err) {
      const cfg = getPublicSanityConfig();
      setStatus({
        connected: false,
        loading: false,
        projectId: cfg.projectId,
        dataset: cfg.dataset,
        apiVersion: cfg.apiVersion,
        hasWriteToken: false,
        error: err.message || "Status check failed",
      });
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleInsertRef = useCallback(
    (refObj) => {
      try {
        const current = jsonValue?.trim() ? JSON.parse(jsonValue) : {};
        if (typeof current === "object" && !Array.isArray(current)) {
          const next = { ...current, _insertedAsset: refObj };
          setJsonValue(JSON.stringify(next, null, 2));
          showToast(
            "Inserted under _insertedAsset – rename the field as needed",
            "info"
          );
        } else {
          showToast("Copy the asset reference and paste into your JSON", "info");
        }
      } catch {
        showToast("Could not insert – paste the reference manually", "info");
      }
    },
    [jsonValue, showToast]
  );

  const handleLoadDocument = useCallback((doc) => {
    setJsonValue(JSON.stringify(doc, null, 2));
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/80">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-50">
              Sanity Content Upload Tool
            </h1>
            <p className="text-xs text-zinc-500">Drive X · standalone utility</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5">
              <span className="text-zinc-500">Project </span>
              <span className="font-mono text-zinc-200">
                {status.projectId || "—"}
              </span>
            </div>
            <div className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5">
              <span className="text-zinc-500">Dataset </span>
              <span className="font-mono text-zinc-200">
                {status.dataset || "—"}
              </span>
            </div>
            <div className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5">
              <span className="text-zinc-500">API </span>
              <span className="font-mono text-zinc-200">
                {status.apiVersion || "—"}
              </span>
            </div>
            <div
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 ${
                status.loading
                  ? "border-zinc-700 text-zinc-400"
                  : status.connected
                    ? "border-emerald-800 bg-emerald-950/50 text-emerald-300"
                    : "border-red-800 bg-red-950/50 text-red-300"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  status.loading
                    ? "bg-zinc-500"
                    : status.connected
                      ? "bg-emerald-400"
                      : "bg-red-400"
                }`}
              />
              {status.loading
                ? "Checking…"
                : status.connected
                  ? status.hasWriteToken
                    ? "Connected (write)"
                    : "Connected (read-only)"
                  : "Disconnected"}
            </div>
            <button
              type="button"
              onClick={checkStatus}
              className="rounded border border-zinc-600 px-2 py-1 text-zinc-400 hover:bg-zinc-800"
            >
              Refresh
            </button>
          </div>
        </div>
        {status.error && !status.connected && (
          <div className="border-t border-red-900/50 bg-red-950/30 px-4 py-2 text-center text-xs text-red-300">
            {status.error}. Set env vars in{" "}
            <code className="font-mono">.env.local</code> and restart.
          </div>
        )}
        {status.connected && !status.hasWriteToken && (
          <div className="border-t border-amber-900/50 bg-amber-950/30 px-4 py-2 text-center text-xs text-amber-300">
            Write token missing. Uploads and mutations will fail until{" "}
            <code className="font-mono">SANITY_API_WRITE_TOKEN</code> is set.
          </div>
        )}
      </header>

      {/* Main two-column workspace */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left column – Assets */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
            <AssetUploadPanel
              onToast={showToast}
              onInsertRef={handleInsertRef}
              onAssetUploaded={() => {}}
            />
          </section>

          {/* Right column – Documents */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
            <DocumentUploadPanel
              jsonValue={jsonValue}
              onJsonChange={setJsonValue}
              onToast={showToast}
              onDocumentCreated={() => {}}
            />
          </section>
        </div>

        {/* Explorer full width below */}
        <section className="mt-6">
          <DocumentExplorer
            onLoadDocument={handleLoadDocument}
            onToast={showToast}
          />
        </section>
      </main>

      <footer className="border-t border-zinc-900 py-4 text-center text-xs text-zinc-600">
        Drive X · Sanity Content Upload Tool · Token stays server-side
      </footer>

      {toast && (
        <Toast
          key={toast.key}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
