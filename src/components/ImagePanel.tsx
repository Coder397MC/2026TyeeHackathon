"use client";

import { motion, AnimatePresence } from "framer-motion";

type Props = {
  prompt: string;
  dataUrl: string | null;
  loading: boolean;
  error: string | null;
  onGenerate: () => void;
};

export default function ImagePanel({ dataUrl, loading, error, onGenerate }: Props) {
  return (
    <div className="mt-5">
      {!dataUrl && !loading && (
        <button
          onClick={onGenerate}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200"
        >
          <span>🎨</span>
          <span>Visualize this</span>
          <span className="text-xs text-zinc-400">(takes 2-3 min)</span>
        </button>
      )}

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex aspect-square w-full max-w-sm items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 via-fuchsia-100 to-cyan-100 text-sm text-zinc-600 dark:from-indigo-500/10 dark:via-fuchsia-500/10 dark:to-cyan-500/10 dark:text-zinc-300"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-fuchsia-500 [animation-delay:120ms]" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-500 [animation-delay:240ms]" />
              </div>
              <span>Drawing your diagram…</span>
            </div>
          </motion.div>
        )}

        {dataUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="overflow-hidden rounded-xl ring-1 ring-zinc-200 dark:ring-white/10"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={dataUrl} alt="Concept illustration" className="w-full" />
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
