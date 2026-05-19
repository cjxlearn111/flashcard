import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

from flask import Flask
from flask_cors import CORS

from config import API_PORT, API_DEBUG
from routers.parse import router as parse_router
from routers.cards import router as cards_router
from routers.review import router as review_router
from routers.brief import router as brief_router
from routers.briefs import router as briefs_router
from routers import settings as settings_module
from routers.knowledge import router as knowledge_router

app = Flask(__name__)
CORS(app)

# 注册蓝图
app.register_blueprint(parse_router)
app.register_blueprint(cards_router)
app.register_blueprint(review_router)
app.register_blueprint(brief_router)
app.register_blueprint(briefs_router)
app.register_blueprint(settings_module.router)
app.register_blueprint(knowledge_router)

# ── LLM 配置：优先使用数据库中的设置，fallback 到 config.py ──
from config import LLM_API_KEY, LLM_API_URL, LLM_MODEL
from services.llm_client import LLMClient
from routers.brief import parser

# 从数据库读取已保存的设置，覆盖硬编码默认值
saved = settings_module.load_active_config()

from routers.knowledge import llm as knowledge_llm

shared_llm = LLMClient(
    api_key=saved.get("llm_api_key") or LLM_API_KEY,
    api_url=saved.get("llm_api_url") or LLM_API_URL,
    model=saved.get("llm_model") or LLM_MODEL,
)
parser.llm = shared_llm
knowledge_llm.api_key = shared_llm.api_key
knowledge_llm.api_url = shared_llm.api_url
knowledge_llm.model = shared_llm.model


def on_settings_changed(settings: dict[str, str]) -> None:
    """前端修改设置后立即更新 LLMClient，无需重启"""
    parser.llm.api_key = settings.get("llm_api_key", LLM_API_KEY)
    parser.llm.api_url = settings.get("llm_api_url", LLM_API_URL).rstrip("/")
    parser.llm.model = settings.get("llm_model", LLM_MODEL)

    knowledge_llm.api_key = parser.llm.api_key
    knowledge_llm.api_url = parser.llm.api_url
    knowledge_llm.model = parser.llm.model


settings_module.set_on_update(on_settings_changed)


@app.route("/")
def home():
    return "学习卡片 App 运行中!"


if __name__ == "__main__":
    app.run(debug=API_DEBUG, port=API_PORT, host="0.0.0.0")
