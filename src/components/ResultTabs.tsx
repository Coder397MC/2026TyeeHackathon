"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { StudyResult } from "@/lib/types";
import FlashcardDeck from "./Flashcard";
import Quiz from "./Quiz";
import FollowUpChat from "./FollowUpChat";
import ImagePanel from "./ImagePanel";

type Props = {
  result: StudyResult;
  question: string;
};

type Tab = "explanation" | "flashcard" | "quiz";

const ALL_TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "explanation", label: "Explanation", emoji: "💡" },
  { id: "flashcard", label: "Flashcard", emoji: "🃏" },
  { id: "quiz", label: "Practice", emoji: "📝" },
];

export default function ResultTabs({ result, question }: Props) {
  const [tab, setTab] = useState<Tab>("explanation");
  const isOffTopic =
    result.subject === "off_topic" ||
    (result.flashcards.length === 0 && result.quiz.length === 0);
  const TABS = isOffTopic ? ALL_TABS.slice(0, 1) : ALL_TABS;

  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  async function generateImage() {
    if (imageLoading || imageDataUrl || !result.image_prompt) return;
    setImageLoading(true);
    setImageError(null);
    try {
      const res = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: result.image_prompt }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      const data = (await res.json()) as { dataUrl: string };
      setImageDataUrl(data.dataUrl);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Image failed.");
    } finally {
      setImageLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white/80 p-5 shadow-lg ring-1 ring-zinc-200 backdrop-blur dark:bg-white/5 dark:ring-white/10">
      <div className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-400">
        Question
      </div>
      <div className="mb-5 text-sm text-zinc-700 dark:text-zinc-200">{question}</div>

      <div className="mb-5 flex gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-white/5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "text-zinc-900 dark:text-white"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {tab === t.id && (
              <motion.div
                layoutId="tab-bg"
                className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-white/10"
                transition={{ type: "spring", duration: 0.4 }}
              />
            )}
            <span className="relative">
              <span className="mr-1.5">{t.emoji}</span>
              {t.label}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "explanation" && (
            <div>
              <div className="space-y-3 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-200">
                {result.explanation
                  .split(/\n\n+/)
                  .map((p, i) => <p key={i}>{p}</p>)}
              </div>
              {result.image_prompt && result.image_prompt.trim() && (
                <ImagePanel
                  prompt={result.image_prompt}
                  dataUrl={imageDataUrl}
                  loading={imageLoading}
                  error={imageError}
                  onGenerate={generateImage}
                />
              )}
              {result.tip && (
                <div className="mt-5 flex items-start gap-3 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 p-4 ring-1 ring-amber-200 dark:from-amber-500/10 dark:to-yellow-500/10 dark:ring-amber-500/30">
                  <span className="text-xl">💡</span>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                      Smart Tip
                    </div>
                    <div className="mt-1 text-sm text-amber-900 dark:text-amber-100">
                      {result.tip}
                    </div>
                  </div>
                </div>
              )}
              <FollowUpChat question={question} explanation={result.explanation} />
            </div>
          )}
          {tab === "flashcard" && (
            <FlashcardDeck
              cards={result.flashcards}
              subject={result.subject === "math" ? "math" : "concept"}
            />
          )}
          {tab === "quiz" && <Quiz questions={result.quiz} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
