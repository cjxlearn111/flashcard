"use client";

import { useState, useCallback } from "react";
import type { Card, ReviewRating } from "@flashcard/shared";
import { fetchReview, submitReview } from "@/lib/api";

export function useReview() {
  const [reviewCards, setReviewCards] = useState<Card[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const startReview = useCallback(async () => {
    const data = await fetchReview();
    setReviewCards(data.cards);
    setReviewIndex(0);
    setShowAnswer(false);
  }, []);

  const handleRating = useCallback(
    async (rating: ReviewRating) => {
      const current = reviewCards[reviewIndex];
      if (!current) return false;
      await submitReview({ id: current.id, rating });
      if (reviewIndex < reviewCards.length - 1) {
        setReviewIndex((i) => i + 1);
        setShowAnswer(false);
        return false;
      }
      return true;
    },
    [reviewCards, reviewIndex],
  );

  return {
    currentCard: reviewCards[reviewIndex],
    reviewCards,
    reviewIndex,
    showAnswer,
    setShowAnswer,
    startReview,
    handleRating,
  };
}
