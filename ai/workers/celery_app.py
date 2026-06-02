"""
Celery 앱 설정
Redis를 broker + backend로 사용
"""
from celery import Celery
from app.core import REDIS_URL

celery_app = Celery(
    "grammar_rag",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Asia/Seoul",
    enable_utc=True,
    # 문제 검증은 생성 후 바로 실행
    task_routes={
        "workers.tasks.validate_problem": {"queue": "validation"},
        "workers.tasks.build_corpus_task": {"queue": "corpus"},
    },
)
