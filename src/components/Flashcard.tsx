"use client";

import { useState } from "react";
import type { Flashcard as FlashcardType } from "@/lib/types";

export default function FlashcardDeck({
  cards,
  subject = "concept",
}: {
  cards: FlashcardType[];
  subject?: "math" | "concept";
}) {
  const isMath = subject === "math";
  const frontLabel = isMath ? "Question" : "Term";
  const backLabel = isMath ? "Solution" : "Definition";
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (!cards || cards.length === 0) {
    return <p className="text-sm text-zinc-500">No flashcards available.</p>;
  }

  const card = cards[index];
  const go = (delta: number) => {
    setFlipped(false);
    setIndex((i) => (i + delta + cards.length) % cards.length);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
        <span>
          Card {index + 1} of {cards.length}
        </span>
      </div>

      <button
        onClick={() => setFlipped((f) => !f)}
        className="group relative h-64 w-full max-w-md [perspective:1200px]"
        aria-label="Flip flashcard"
      >
        <div
          className="relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]"
          style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center overflow-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 p-6 text-white shadow-xl [backface-visibility:hidden]">
            <div className="text-xs uppercase tracking-widest opacity-80">{frontLabel}</div>
            <div
              className={`mt-3 text-center leading-tight ${
                isMath ? "text-xl font-semibold font-mono whitespace-pre-wrap" : "text-3xl font-bold"
              }`}
            >
              {card.term}
            </div>
            <div className="mt-6 text-xs opacity-80">Click to flip</div>
          </div>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center overflow-auto rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 p-6 text-white shadow-xl [backface-visibility:hidden]"
            style={{ transform: "rotateY(180deg)" }}
          >
            <div className="text-xs uppercase tracking-widest opacity-80">{backLabel}</div>
            <div
              className={`mt-3 leading-snug ${
                isMath
                  ? "text-left text-sm font-mono whitespace-pre-wrap w-full"
                  : "text-center text-lg"
              }`}
            >
              {card.definition}
            </div>
            <div className="mt-6 text-xs opacity-80">Click to flip back</div>
          </div>
        </div>
      </button>

      {cards.length > 1 && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => go(-1)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200"
          >
            ← Prev
          </button>
          <div className="flex gap-1.5">
            {cards.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setFlipped(false);
                  setIndex(i);
                }}
                className={`h-2 w-2 rounded-full transition ${
                  i === index
                    ? "bg-indigo-500 w-5"
                    : "bg-zinc-300 hover:bg-zinc-400 dark:bg-white/20"
                }`}
                aria-label={`Go to card ${i + 1}`}
              />
            ))}
          </div>
          <button
            onClick={() => go(1)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200"
          >
            Next →
          </button>
        </div>
      )}
      <p className="text-xs text-zinc-400">Tap the card to reveal the definition.</p>
    </div>
  );
}
