import os

# 数据库路径：优先用环境变量（PythonAnywhere 设置），否则用本地路径
_DEFAULT_DB = os.path.join(os.path.dirname(__file__), "..", "..", "cards.db")
DB_PATH = os.environ.get("FLASHCARD_DB_PATH", _DEFAULT_DB)

API_PORT = int(os.environ.get("API_PORT", "5000"))
API_DEBUG = os.environ.get("API_DEBUG", "false").lower() == "true"

# LLM 配置：环境变量覆盖硬编码默认值
LLM_API_KEY = os.environ.get("LLM_API_KEY", "")
LLM_API_URL = os.environ.get("LLM_API_URL", "https://api.deepseek.com")
LLM_MODEL = os.environ.get("LLM_MODEL", "deepseek-v4-flash")
