"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AskForm from "@/components/AskForm";
import ResultTabs from "@/components/ResultTabs";
import type { StudyResult } from "@/lib/types";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StudyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState("");

  async function handleAsk(q: string, files: File[] = []) {
    setLoading(true);
    setError(null);
    setResult(null);
    const displayQ =
      files.length > 0 ? `${q}${q ? "\n\n" : ""}📎 ${files.map((f) => f.name).join(", ")}` : q;
    setQuestion(displayQ);
    try {
      const form = new FormData();
      form.append("question", q);
      for (const f of files) form.append("files", f);
      const res = await fetch("/api/ask", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      const data = (await res.json()) as StudyResult;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-indigo-950">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8 sm:py-12">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <div className="flex w-full flex-col items-center gap-4 rounded-2xl bg-gradient-to-br from-indigo-600 via-fuchsia-500 to-cyan-500 px-6 py-5 shadow-lg sm:flex-row sm:justify-between sm:gap-6 sm:px-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/TyeeHorizontalwText-White.svg"
              alt="Tyee Study Buddy"
              className="h-12 w-auto sm:h-14"
            />
            <div className="hidden h-12 w-px bg-white/30 sm:block" />
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <div className="text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                Study Buddy
              </div>
              <ThemeToggle />
            </div>
          </div>
          <p className="mt-3 text-base text-zinc-600 dark:text-zinc-300">
            Ask anything. Get a simple explanation, flashcards, and practice questions.
          </p>
        </motion.header>

        <AskForm onAsk={handleAsk} loading={loading} />

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
            >
              {error}
            </motion.div>
          )}

          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-3 rounded-xl bg-white/60 p-8 text-zinc-500 shadow-sm ring-1 ring-zinc-100 backdrop-blur dark:bg-white/5 dark:text-zinc-400 dark:ring-white/10"
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-fuchsia-500 [animation-delay:120ms]" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-500 [animation-delay:240ms]" />
              <span className="ml-2 text-sm">Thinking…</span>
            </motion.div>
          )}

          {result && !loading && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <ResultTabs result={result} question={question} />
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="pt-8 text-center text-xs text-zinc-400">
          v1 · guest mode · history coming in v2
        </footer>
      </main>
    </div>
  );
}
