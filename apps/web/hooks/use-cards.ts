"use client";

import { useState, useEffect, useCallback } from "react";
import type { Card } from "@flashcard/shared";
import { fetchCards } from "@/lib/api";

export function useCards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCards();
      setCards(data.cards);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载卡片失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { cards, loading, error, reload: load };
}
