# PRD: 技术简报生成 API

基于知识提炼思维链 v3.3 规范，为学习卡片 App 新增技术简报生成能力。

---

## 1. 概述

### 1.1 目标
实现 YAML v3.3 规范的 5 阶段思维链流水线，将 AI 回答/学习笔记转换为结构化 **Markdown 技术简报**，作为现有卡片提取功能的补充输出格式。

### 1.2 用户故事
- 用户粘贴一段技术类 AI 回答，点击"生成简报"获得一份可读性强的 Markdown 技术简报
- 简报包含核心结论、术语表、论证骨架、可复用原则、待裁决事项、证据附录
- 用户可以将简报复制到笔记工具或继续编辑

### 1.3 与现有功能的关系

| 维度 | 现有 `/api/parse`（卡片提取） | 新增 `/api/brief`（简报生成） |
|---|---|---|
| 输出 | `cards[]` Q&A 对列表 | 一段完整 Markdown 文本 |
| 用途 | 存入复习系统 | 独立阅读/分享/归档 |
| 处理深度 | 浅层分割 + QA 匹配 | 5 阶段深层思维链 |
| 风格约束 | 无 | 无破折号、置信度入附录 |

---

## 2. 功能需求

### 2.1 API 接口

```
POST /api/brief
Content-Type: application/json

Request:  {"text": "..."}
Response: {"brief": "## 核心结论\n...", "reasoning": [...]}
```

- `text` — 原始文本（必填，非空）
- `brief` — 生成的 Markdown 技术简报全文
- `reasoning` — 5 阶段思维链追踪记录

### 2.2 5 阶段流水线

#### 阶段 1 — 信息分层

从原文提取 6 类信息：

| 信息类型 | 提取方法 | 输出格式 |
|---|---|---|
| 结论 | 找全文最核心主张，凝练一句话 | 字符串 |
| 术语 | 关键术语 + 20 字内定义 | `{term, definition}[]` |
| 主张群组 | 聚类不超过 5 组，每组含主主张 + 推理链 | `{claim, reasoning}[]` |
| 证据映射 | 匹配支撑证据（内部使用） | `{claim_index, evidence, confidence, source}[]` |
| 原则 | IF-THEN 规则 + 失效边界 | `{condition, action, boundary}[]` |
| 待裁决 | 逻辑矛盾、未证主张、边界缺失 | `{description, affects}[]` |

#### 阶段 2 — 论证流构建

- 遍历每个主张群组，生成一个论证段落
- 段落结构：**粗体主张句** + 推理段（3-5 句）+ 支撑句
- 核心约束：
  - 全段禁止使用 `——`（破折号）
  - 支撑句中严禁出现 `(置信度:A/B/C)` 字样
  - 置信度统一进入附录

#### 阶段 3 — 证据附录合成

- 收集阶段 2 所有被引证据，去重
- 生成 Markdown 表格：证据编号 \| 证据内容 \| 置信度 \| 来源
- 按置信度 A > B > C 排序

#### 阶段 4 — 简报组装

按固定顺序组装 Markdown：

```markdown
## 核心结论

一句话结论

## 术语速查

| 术语 | 定义 |
|---|---|

## 论证骨架

**粗体主张句**
推理段。支撑句。

**粗体主张句**
推理段。支撑句。

## 可复用原则

- **IF** [条件] **THEN** [行动]
  失效边界：[描述]

## 待裁决与边界

- [!] [描述]。若成立，将动摇 [具体主张/原则]。

## 附录：证据来源与置信度

| 编号 | 证据内容 | 置信度 | 来源 |
|---|---|---|---|
```

#### 阶段 5 — 质量校验

检查清单：
1. 一句话结论是否仅一句话？
2. 术语表 ≤ 10 行？
3. 全篇是否未出现任何 `——`？
4. 论证段落的支撑句中是否不含置信度标注？
5. 每条原则是否包含失效边界？
6. 附录表格是否覆盖所有被引证据？
7. 全文粗体部分能否独立传达核心逻辑？

校验结果写入 `reasoning` 追踪，严重问题返回 warning 但不阻止输出。

---

## 3. 文件变更清单

### 后端（Python Flask）

| 步骤 | 文件 | 操作 | 说明 |
|---|---|---|---|
| 1 | `apps/api/services/brief_parser.py` | 新建 | `BriefParser` 类，实现 5 阶段流水线 |
| 2 | `apps/api/routers/brief.py` | 新建 | `POST /api/brief` 路由 |
| 3 | `apps/api/main.py` | 修改 | 注册 brief 蓝图 |

### 共享类型

| 步骤 | 文件 | 操作 | 说明 |
|---|---|---|---|
| 4 | `packages/shared/src/index.ts` | 修改 | 新增 `BriefResult` 类型 |

### 前端（Next.js）

| 步骤 | 文件 | 操作 | 说明 |
|---|---|---|---|
| 5 | `apps/web/lib/api.ts` | 修改 | 新增 `generateBrief(text)` 函数 |
| 6 | `apps/web/app/brief/page.tsx` | 新建 | 简报展示页面 |
| 7 | `apps/web/app/page.tsx` | 修改 | 首页新增"生成简报"按钮 |

---

## 4. 技术设计

### 4.1 `BriefParser` 类结构

```python
class BriefParser:
    def parse(self, text: str) -> dict:
        layers = self._extract_layers(text)                     # 阶段 1
        arguments = self._build_arguments(layers)                # 阶段 2
        appendix = self._build_appendix(layers)                  # 阶段 3
        brief = self._assemble_brief(layers, arguments, appendix) # 阶段 4
        reasoning = self._validate_brief(brief, layers, appendix) # 阶段 5
        return {"brief": brief, "reasoning": reasoning}
```

### 4.2 核心实现策略

**阶段 1** 是核心难点：从无结构文本中提取 6 类信息。采用规则匹配 + 启发式方法：

- **结论提取**：扫描首段/末段的总结性语句，匹配"总之/因此/核心/关键/本质上"等标记词。若无匹配，取第一段粗体句或第一段首句。
- **术语提取**：复用现有 `_split_qa` 中的加粗匹配逻辑 `**(...)`，以及定义句式（"是指/即/是"）。
- **主张群组**：按 `##` 或 `###` 标题分组，每组首句或粗体句为主主张，后续内容为推理链。限制不超过 5 组。
- **证据匹配**：查找"指出/发现/验证/研究表明/实验显示"等引用标记，提取证据内容、置信度（若有）和出处。
- **原则提取**：匹配 IF-THEN 句式、"当...时"条件句式，或从"建议/应该/需要"祈使句中提炼。失效边界匹配"除非/但当...不适用/如果...则不"等转折结构。
- **待裁决检测**：匹配"但是/然而/矛盾/未定义/未知/争议/不确定"等标记，输出矛盾描述和影响范围。

**复用的现有逻辑**：
- `CoTParser._detect_sections` — 章节分割
- `CoTParser._guess_domain` — 领域分类
- `CoTParser._split_qa` 中的加粗匹配和定义句式匹配

**阶段 2-4** 主要是模板组装和字符串处理，规则明确，实现难度较低。

### 4.3 前端设计

- 首页"生成简报"按钮与"提取卡片"并列，同样走 `sessionStorage` 传文本
- `http://localhost:3000/brief` 页面展示渲染后的 Markdown 简报 + 一键复制按钮
- Markdown 渲染方案：使用轻量级 `react-markdown` 或直接 `pre` 标签展示源码（MVP 阶段可先展示源码，用户自行复制）

---

## 5. 实施步骤

| 步骤 | 内容 | 产出验证 |
|---|---|---|
| 1 | 新建 `BriefParser`，实现阶段 1（分层提取）+ 阶段 4（简报组装） | 可生成基础版简报（结论+术语+主张） |
| 2 | 实现阶段 2（论证流构建）+ 阶段 3（证据附录） | 简报包含完整论证段落和附录表格 |
| 3 | 实现阶段 5（质量校验） | reasoning 包含 7 项检查结果 |
| 4 | 新建 `routers/brief.py`，注册到 `main.py` | `curl POST /api/brief` 返回 JSON |
| 5 | 前端新增 `generateBrief` API 函数 + 类型 | TypeScript 编译通过 |
| 6 | 新建简报页面 + 首页入口 | 端到端流程可用 |

---

## 6. 验收标准

1. `curl -X POST http://localhost:5000/api/brief -H "Content-Type: application/json" -d '{"text":"..."}'` 返回含 `brief` 字段的 JSON
2. 返回的 Markdown 包含 6 个标准章节（核心结论、术语速查、论证骨架、可复用原则、待裁决与边界、附录）
3. 全篇不包含 `——`（破折号）
4. 论证段落中无 `(置信度:)` 字样
5. 原则条目均包含失效边界
6. `bun run check-types` 通过
7. 现有 `/api/parse` 卡片提取功能不受影响
