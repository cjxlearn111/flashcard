"""测试知识卡片思维链（修正编码输出到文件）"""
import json
import urllib.request

API_URL = "http://127.0.0.1:5000/api/brief"

with open(r"f:\vs code\pythen\flashcard\apps\api\services\prompts\knowledge_card.yaml", "r", encoding="utf-8") as f:
    prompt_yaml = f.read()

tests = [
    {
        "name": "技术概念 - Docker",
        "text": "Docker 是一个开源的容器化平台，它允许开发者将应用及其依赖打包到一个轻量级、可移植的容器中。容器共享宿主机的操作系统内核，启动只需毫秒级。Docker 使用镜像（Image）作为模板创建容器，Dockerfile 定义构建步骤。Docker Compose 可编排多容器应用。"
    },
    {
        "name": "编程技巧 - React Hooks",
        "text": "useEffect 是 React 的 Hook，用于处理副作用。它的依赖数组机制很关键：传空数组 [] 只在挂载时执行，传变量则在变量变化时执行，不传数组则每次渲染都执行。cleanup 函数在组件卸载或重新执行前调用，用于取消订阅和清理定时器。"
    },
    {
        "name": "工具记录 - Claude Code",
        "text": "Claude Code 是 Anthropic 推出的命令行 AI 编程助手。它直接在终端运行，可以读写文件、执行命令、搜索代码。支持 Git 操作和 PR 管理。目前已在 VS Code 和 JetBrains 中集成扩展。官网 https://claude.ai/code"
    },
    {
        "name": "理论学习 - 认知负荷理论",
        "text": "认知负荷理论（Cognitive Load Theory）由 Sweller 提出，认为工作记忆容量有限。有三种负荷：内在负荷（任务本身复杂度）、外在负荷（信息呈现方式）、相关负荷（深层加工）。教学应减少外在负荷，优化内在负荷，促进相关负荷。"
    },
]

output_lines = []
for t in tests:
    output_lines.append(f"\n{'='*60}")
    output_lines.append(f"  {t['name']}")
    output_lines.append(f"{'='*60}")
    body = json.dumps({"text": t["text"], "prompt": prompt_yaml}).encode("utf-8")
    req = urllib.request.Request(API_URL, data=body, method="POST")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read())
            data = result.get("data", {})
            output_lines.append(f"标题: {data.get('title', 'N/A')}")
            output_lines.append(f"概要: {data.get('summary', 'N/A')}")
            output_lines.append(f"标签: {data.get('tags', [])}")
            output_lines.append(f"")
            output_lines.append(f"关键点 ({len(data.get('key_points', []))} 个):")
            for kp in data.get("key_points", []):
                output_lines.append(f"  - {kp.get('point')}")
                output_lines.append(f"    {kp.get('detail', '')}")
            output_lines.append(f"")
            output_lines.append(f"代码示例 ({len(data.get('code_examples', []))} 个):")
            for ce in data.get("code_examples", []):
                output_lines.append(f"  [{ce.get('language')}] {ce.get('title')}")
                output_lines.append(f"  {ce.get('code', '')}")
            output_lines.append(f"")
            output_lines.append(f"资源 ({len(data.get('resources', []))} 个):")
            for r in data.get("resources", []):
                output_lines.append(f"  · {r.get('title')} ({r.get('type')})")
                output_lines.append(f"    {r.get('url', '')}")
            output_lines.append(f"")
            output_lines.append(f"关联概念 ({len(data.get('related_concepts', []))} 个):")
            for rc in data.get("related_concepts", []):
                output_lines.append(f"  * {rc.get('concept')}: {rc.get('relationship')}")
    except Exception as e:
        output_lines.append(f"错误: {e}")

result = "\n".join(output_lines)
with open(r"f:\vs code\pythen\flashcard\knowledge_test_result.txt", "w", encoding="utf-8") as f:
    f.write(result)
print("结果已保存到 knowledge_test_result.txt")
