/** 数据库卡片模型 */
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

/** 解析结果中的单张卡片 */
export interface ParsedCard {
  question: string;
  answer: string;
  domain: string;
  topic: string;
}

/** CoT 推理步骤 */
export interface ReasoningStep {
  step: string;
  detail: string;
}

/** 解析 API 响应 */
export interface ParseResult {
  cards: ParsedCard[];
  reasoning: ReasoningStep[];
}

/** 结构化简报数据 */
export interface BriefData {
  conclusion: string;
  domain: string;
  terms: { term: string; definition: string }[];
  claim_groups: { claim: string; reasoning: string; support: string }[];
  principles: { condition: string; action: string; boundary: string }[];
  tensions: { description: string; affects: string }[];
  evidence_map: { claim_index: number; evidence: string; confidence: string; source: string }[];
}

/** 简报 API 响应 */
export interface BriefResult {
  brief: string;
  data: BriefData;
  reasoning: ReasoningStep[];
}

/** 数据库简报模型 */
export interface Brief {
  id: number;
  title: string;
  domain: string;
  source: string;
  dataJson: string;
  briefMd: string;
  dateCreated: string;
  dateUpdated: string;
}

/** 复习评分 */
export type ReviewRating = "remember" | "blurry" | "forgot";

/** 保存卡片请求 */
export interface SaveCardsRequest {
  cards: ParsedCard[];
}

/** 提交复习请求 */
export interface SubmitReviewRequest {
  id: number;
  rating: ReviewRating;
}

/** API 统一响应格式 */
export interface ApiResponse<T> {
  status: "ok" | "error";
  data?: T;
  error?: string;
}

// ── 知识卡片 ──

export interface KnowledgeCardData {
  domain: string;
  terms: { term: string; definition: string }[];
  knowledge_points: {
    title: string;
    type: "核心概念" | "方法" | "原则" | "事实";
    content: string;
    related_pre: string;
    related_extend: string;
  }[];
  tables: {
    table_title: string;
    table_type: "对比表" | "汇总表" | "清单表";
    headers: string[];
    rows: string[][];
  }[];
  resources: { name: string; type: string; url: string; description: string }[];
  knowledge_extend: {
    concept: string;
    relationship: "前置" | "延伸" | "相似" | "对比";
    detail: string;
  }[];
}

export interface KnowledgeCardResult {
  data: KnowledgeCardData;
}

export interface KnowledgeCardItem {
  id: number;
  title: string;
  tags: string;
  source: string;
  dataJson: string;
  summaryMd: string;
  dateCreated: string;
  dateUpdated: string;
}
