"use client";

import { useState } from "react";
import type { ParsedCard, ReasoningStep } from "@flashcard/shared";
import { parseText } from "@/lib/api";

export function useParse() {
  const [parsedCards, setParsedCards] = useState<ParsedCard[]>([]);
  const [reasoning, setReasoning] = useState<ReasoningStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async (text: string) => {
    if (!text.trim()) {
      setError("请先粘贴 AI 回答");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const data = await parseText(text);
      if (!data.cards?.length) {
        throw new Error("未能解析出卡片，请检查输入内容");
      }
      setParsedCards(data.cards);
      setReasoning(data.reasoning || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "解析失败");
    } finally {
      setLoading(false);
    }
  };

  const editCard = (index: number, field: keyof ParsedCard, value: string) => {
    setParsedCards((prev) =>
      prev.map((card, i) =>
        i === index ? { ...card, [field]: value } : card,
      ),
    );
  };

  const deleteCard = (index: number) => {
    setParsedCards((prev) => prev.filter((_, i) => i !== index));
  };

  const reset = () => {
    setParsedCards([]);
    setReasoning([]);
    setError(null);
  };

  return {
    parsedCards,
    reasoning,
    loading,
    error,
    handleParse,
    editCard,
    deleteCard,
    reset,
  };
}
