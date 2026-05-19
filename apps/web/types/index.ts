/** 临时类型定义 — @flashcard/shared 包就绪后替换为导入 */

export interface Card {
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

export interface ParsedCard {
  question: string;
  answer: string;
  domain: string;
  topic: string;
}

export interface ReasoningStep {
  step: string;
  detail: string;
}

export interface ParseResult {
  cards: ParsedCard[];
  reasoning: ReasoningStep[];
}

export type ReviewRating = "remember" | "blurry" | "forgot";
