"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";

type Props = {
  onAsk: (q: string, files: File[]) => void;
  loading: boolean;
};

const EXAMPLES = [
  "Solve for x: 3(x - 4) = 2x + 7",
  "How does natural selection lead to new species over time?",
  "Compare the causes of World War I and World War II",
  "Find the area of a triangle with vertices at (0,0), (6,0), and (3,4)",
];

const ACCEPT =
  "image/png,image/jpeg,image/webp,image/gif,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

function isImage(f: File) {
  return f.type.startsWith("image/");
}

function fileIcon(f: File) {
  if (isImage(f)) return "🖼️";
  if (f.type === "application/pdf") return "📄";
  if (f.name.toLowerCase().endsWith(".docx")) return "📝";
  return "📎";
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function AskForm({ onAsk, loading }: Props) {
  const [value, setValue] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addFiles(newFiles: File[]) {
    setFileError(null);
    const accepted: File[] = [];
    for (const f of newFiles) {
      if (f.size > MAX_FILE_BYTES) {
        setFileError(`${f.name} is too big (max 10 MB).`);
        continue;
      }
      accepted.push(f);
    }
    setFiles((prev) => [...prev, ...accepted]);
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if ((!value.trim() && files.length === 0) || loading) return;
    onAsk(value.trim() || "Please help me with this.", files);
  }

  function onPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = Array.from(e.clipboardData.items);
    const pasted: File[] = [];
    for (const item of items) {
      if (item.kind === "file") {
        const f = item.getAsFile();
        if (f) pasted.push(f);
      }
    }
    if (pasted.length) {
      e.preventDefault();
      addFiles(pasted);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files?.length) {
          addFiles(Array.from(e.dataTransfer.files));
        }
      }}
      className={`rounded-2xl bg-white/80 p-5 shadow-lg ring-1 backdrop-blur transition dark:bg-white/5 ${
        dragOver
          ? "ring-2 ring-indigo-400"
          : "ring-zinc-200 dark:ring-white/10"
      }`}
    >
      <form onSubmit={submit} className="flex flex-col gap-3">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onPaste={onPaste}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(e);
          }}
          placeholder="Type or paste a homework question — or drop an image / PDF / Word file…"
          rows={3}
          disabled={loading}
          className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:opacity-60 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-indigo-900/40"
        />

        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs dark:border-white/10 dark:bg-white/5"
              >
                <span>{fileIcon(f)}</span>
                <span className="max-w-[180px] truncate font-medium text-zinc-700 dark:text-zinc-200">
                  {f.name}
                </span>
                <span className="text-zinc-400">{formatSize(f.size)}</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  disabled={loading}
                  className="ml-1 text-zinc-400 hover:text-red-500"
                  aria-label="Remove file"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {fileError && (
          <div className="text-xs text-red-600 dark:text-red-400">{fileError}</div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addFiles(Array.from(e.target.files));
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
            >
              <span>📎</span>
              <span>Attach</span>
            </button>
            <span className="hidden text-xs text-zinc-400 sm:inline">
              Image · PDF · Word · paste · drop
            </span>
          </div>
          <button
            type="submit"
            disabled={loading || (!value.trim() && files.length === 0)}
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Thinking…" : "Ask Tyee"}
          </button>
        </div>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            disabled={loading}
            onClick={() => {
              setValue(ex);
              onAsk(ex, []);
            }}
            className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600 transition hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:border-indigo-400/50"
          >
            {ex}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
