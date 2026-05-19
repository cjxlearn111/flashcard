"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Card {
  id: number;
  domain: string;
  topic: string;
  question: string;
  answer: string;
  source: string;
  dateCreated: string;
  tag: string;
  nextReview: string;
  level: number;
}

type ReviewRating = "remember" | "blurry" | "forgot";

export default function ReviewPage() {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/review")
      .then((r) => r.json())
      .then((data) => setCards(data.cards))
      .catch(() => {});
  }, []);

  const handleRating = async (rating: ReviewRating) => {
    const current = cards[index];
    if (!current) return;
    try {
      await fetch("http://localhost:5000/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: current.id, rating }),
      });
    } catch {
      // ignore network errors during review
    }
    if (index < cards.length - 1) {
      setIndex((i) => i + 1);
      setShowAnswer(false);
    } else {
      router.push("/");
    }
  };

  const current = cards[index];

  if (!current) {
    return (
      <main className="max-w-5xl mx-auto px-6 pt-8 text-center py-20 text-slate-500">
        <p>没有待复习的卡片</p>
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-slate-800 transition-colors mt-4"
        >
          返回首页
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-6 pt-12 pb-16">
      {/* 进度指示 */}
      <div className="text-center mb-8">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
          {index + 1} / {cards.length}
        </span>
      </div>

      {/* 复习卡片 — 点击翻转 */}
      <div
        className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm cursor-pointer hover:shadow-md transition-all"
        onClick={() => setShowAnswer(true)}
      >
        <div className="text-center mb-6">
          {current.domain && (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
              {current.domain}
            </span>
          )}
        </div>
        <div className="text-xs font-semibold text-slate-400 mb-2 text-center uppercase tracking-wide">
          问题
        </div>
        <div className="text-lg font-semibold text-slate-900 text-center leading-relaxed mb-6">
          {current.question}
        </div>

        {showAnswer && (
          <>
            <div className="border-t border-slate-100 my-6" />
            <div className="text-xs font-semibold text-slate-400 mb-2 text-center uppercase tracking-wide">
              答案
            </div>
            <div className="text-base text-slate-700 text-center leading-relaxed">
              {current.answer}
            </div>
          </>
        )}

        {!showAnswer && (
          <div className="text-center text-sm text-slate-400 mt-4">
            点击翻转
          </div>
        )}
      </div>

      {/* 评分按钮 — 翻转后显示 */}
      {showAnswer && (
        <div className="flex gap-3 justify-center mt-8">
          <button
            onClick={() => handleRating("remember")}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-50 px-5 py-2.5 text-sm font-medium text-emerald-600 hover:bg-emerald-100 transition-colors"
          >
            记住了
          </button>
          <button
            onClick={() => handleRating("blurry")}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-white border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            模糊
          </button>
          <button
            onClick={() => handleRating("forgot")}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-red-50 px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
          >
            忘了
          </button>
        </div>
      )}
    </main>
  );
}
