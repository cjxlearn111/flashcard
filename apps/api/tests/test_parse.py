"""解析引擎快速验证"""

from services.parser import CoTParser

parser = CoTParser()

test_text = """## 关键概念
**RLHF** 是指基于人类反馈的强化学习，是一种对齐技术。

## 原子化知识卡片
Card 1: 预训练
预训练是指在大规模无标注数据上训练模型，使其掌握通用语言能力的过程。
"""

result = parser.parse(test_text)

print(f"卡片数: {len(result['cards'])}")
print(f"推理步数: {len(result['reasoning'])}")
for i, card in enumerate(result["cards"]):
    print(f"\n卡片 {i+1}:")
    print(f"  知识点: {card['question']}")
    print(f"  解释: {card['answer'][:60]}...")
    print(f"  领域: {card['domain']}")
