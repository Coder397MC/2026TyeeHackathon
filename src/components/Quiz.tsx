"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { QuizQuestion } from "@/lib/types";

export default function Quiz({ questions }: { questions: QuizQuestion[] }) {
  const [answers, setAnswers] = useState<Record<number, string>>({});

  function choose(qIdx: number, label: string) {
    if (answers[qIdx]) return;
    setAnswers((a) => ({ ...a, [qIdx]: label }));
  }

  const score = questions.reduce((n, q, i) => n + (answers[i] === q.correct ? 1 : 0), 0);
  const answered = Object.keys(answers).length;
  const done = answered === questions.length;

  return (
    <div className="space-y-6">
      {questions.map((q, qIdx) => {
        const chosen = answers[qIdx];
        return (
          <div key={qIdx} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
            <div className="mb-3 flex items-start gap-2">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                {qIdx + 1}
              </span>
              <div className="text-[15px] font-medium text-zinc-800 dark:text-zinc-100">
                {q.question}
              </div>
            </div>
            <div className="grid gap-2">
              {q.choices.map((c) => {
                const isChosen = chosen === c.label;
                const isCorrect = c.label === q.correct;
                const reveal = !!chosen;
                let cls =
                  "border-zinc-200 bg-white hover:border-indigo-300 dark:border-white/10 dark:bg-white/5";
                if (reveal && isCorrect)
                  cls = "border-emerald-400 bg-emerald-50 dark:border-emerald-500/50 dark:bg-emerald-500/10";
                else if (reveal && isChosen && !isCorrect)
                  cls = "border-red-400 bg-red-50 dark:border-red-500/50 dark:bg-red-500/10";
                else if (reveal)
                  cls = "border-zinc-200 bg-white opacity-60 dark:border-white/10 dark:bg-white/5";
                return (
                  <button
                    key={c.label}
                    onClick={() => choose(qIdx, c.label)}
                    disabled={!!chosen}
                    className={`flex items-start gap-3 rounded-lg border px-3 py-2 text-left text-sm transition ${cls}`}
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                      {c.label}
                    </span>
                    <span className="text-zinc-800 dark:text-zinc-100">{c.text}</span>
                  </button>
                );
              })}
            </div>
            {chosen && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-3 rounded-lg p-3 text-sm ${
                  chosen === q.correct
                    ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200"
                    : "bg-red-50 text-red-900 dark:bg-red-500/10 dark:text-red-200"
                }`}
              >
                <div className="font-semibold">
                  {chosen === q.correct ? "✅ Correct!" : `❌ Not quite — the answer is ${q.correct}.`}
                </div>
                <div className="mt-1 opacity-90">{q.explanation}</div>
              </motion.div>
            )}
          </div>
        );
      })}

      {done && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 p-4 text-center text-white shadow-md"
        >
          <div className="text-xs uppercase tracking-widest opacity-80">Your score</div>
          <div className="mt-1 text-3xl font-bold">
            {score} / {questions.length}
          </div>
        </motion.div>
      )}
    </div>
  );
}
