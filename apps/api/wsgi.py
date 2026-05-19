"""PythonAnywhere WSGI 入口"""
import sys

# 将项目路径加入 Python 路径
sys.path.insert(0, "/home/cjxlearn111/flashcard/apps/api")

from main import app as application
