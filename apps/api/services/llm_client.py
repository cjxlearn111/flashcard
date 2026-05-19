"""LLM API 适配器 — 你以后填 API Key 和 URL"""

import json
import urllib.request
import urllib.error


class LLMClient:
    """OpenAI 兼容格式的大模型 API 客户端"""

    def __init__(
        self,
        api_key: str = "",
        api_url: str = "",
        model: str = "",
        timeout: int = 60,
    ):
        self.api_key = api_key
        self.api_url = api_url.rstrip("/")
        self.model = model
        self.timeout = timeout

    def chat(self, system_prompt: str, user_text: str) -> str:
        """调用大模型，返回响应文本。没配 Key 时返回 mock 数据。"""
        if not self.api_key:
            return self._mock_response(user_text)

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }
        body = {
            "model": self.model or "gpt-4o",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_text},
            ],
            "temperature": 0.3,
        }

        req = urllib.request.Request(
            f"{self.api_url}/chat/completions",
            data=json.dumps(body).encode("utf-8"),
            headers=headers,
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                return result["choices"][0]["message"]["content"]
        except urllib.error.HTTPError as e:
            return json.dumps({"error": f"API 请求失败 (HTTP {e.code})"})
        except urllib.error.URLError as e:
            return json.dumps({"error": f"网络错误: {e.reason}"})
        except (json.JSONDecodeError, KeyError) as e:
            return json.dumps({"error": f"响应解析失败: {e}"})

    def _mock_response(self, user_text: str) -> str:
        """没配 API Key 时返回模拟数据，方便前端调试"""
        return json.dumps(
            {
                "conclusion": "RLHF 通过人类反馈优化语言模型，使其输出更符合人类偏好。",
                "domain": "AI与技术",
                "terms": [
                    {"term": "RLHF", "definition": "基于人类反馈的强化学习"},
                    {"term": "SFT", "definition": "监督微调，用标注数据训练"},
                    {"term": "奖励模型", "definition": "给模型输出打分的模型"},
                ],
                "claim_groups": [
                    {
                        "claim": "RLHF 是对齐技术的核心方法",
                        "reasoning": "预训练模型仅掌握语言统计规律，无法理解人类意图。RLHF 通过奖励模型将人类偏好注入生成过程。SFT 阶段提供了初始对齐基础，RLHF 阶段进一步强化。",
                        "support": "Anthropic 和 OpenAI 的实验均表明 RLHF 显著降低有害输出率。",
                    }
                ],
                "principles": [
                    {
                        "condition": "训练对齐型语言模型时",
                        "action": "先做 SFT 做初始对齐，再用 RLHF 精细调优",
                        "boundary": "标注数据质量差时 RLHF 效果反而下降。",
                    }
                ],
                "tensions": [
                    {
                        "description": "RLHF 可能降低模型在数学推理等客观任务上的准确性",
                        "affects": "主张：RLHF 是对齐技术的核心方法",
                    }
                ],
                "evidence_map": [
                    {
                        "claim_index": 0,
                        "evidence": "OpenAI InstructGPT 论文显示 RLHF 在有害输出率上降低 25%",
                        "confidence": "A",
                        "source": "InstructGPT 论文 (2022)",
                    }
                ],
            }
        )
