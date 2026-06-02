"""
Celery Tasks
- validate_problem: 생성된 문제 품질 검증 (LLM-as-a-judge)
- build_corpus_task: corpus 빌드 비동기 실행
"""
import logging
import json
import psycopg2

from workers.celery_app import celery_app
from app.core import DATABASE_URL
from app.evaluator import evaluate_problem

logger = logging.getLogger(__name__)


# ── DB 헬퍼 ──────────────────────────────────────────────────────────────────

def _get_conn():
    return psycopg2.connect(DATABASE_URL)


def _get_problem(problem_id: int) -> dict | None:
    conn = _get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, question, options_json, correct_answer,
                       scope, sentence_with_blank, grammar_tag
                FROM grammar_problems
                WHERE id = %s
            """, [problem_id])
            row = cur.fetchone()
            if not row:
                return None
            return {
                "id":                  row[0],
                "question":            row[1],
                "options":             json.loads(row[2]) if row[2] else [],
                "correct_answer":      row[3],
                "scope":               row[4],
                "sentence_with_blank": row[5],
                "grammar_tag":         row[6],
            }
    finally:
        conn.close()


def _update_validation(problem_id: int, passed: bool, score: float, reason: str):
    conn = _get_conn()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE grammar_problems
                    SET is_validated = %s,
                        quality_score = %s,
                        validation_reason = %s,
                        validated_at = NOW()
                    WHERE id = %s
                """, [passed, score, reason, problem_id])
    finally:
        conn.close()


# ── Task 1: 문제 품질 검증 ────────────────────────────────────────────────────

@celery_app.task(
    name="workers.tasks.validate_problem",
    bind=True,
    max_retries=2,
    default_retry_delay=10,
)
def validate_problem(self, problem_id: int):
    """
    생성된 문제를 LLM-as-a-judge로 검증.
    통과: is_validated=True 로 업데이트
    실패: is_validated=False + 재생성 또는 제거
    """
    logger.info("[Celery] validate_problem start: problem_id=%d", problem_id)

    try:
        problem = _get_problem(problem_id)
        if not problem:
            logger.warning("[Celery] problem_id=%d not found", problem_id)
            return {"status": "not_found", "problem_id": problem_id}

        result = evaluate_problem(problem)

        passed = result.get("decision") == "pass"
        score  = result.get("overall_score", 0.0)
        reason = result.get("reason", "")

        _update_validation(problem_id, passed, score, reason)

        logger.info(
            "[Celery] validate_problem done: problem_id=%d passed=%s score=%.1f",
            problem_id, passed, score,
        )
        return {"status": "done", "problem_id": problem_id, "passed": passed, "score": score}

    except Exception as exc:
        logger.error("[Celery] validate_problem error: %s", exc)
        raise self.retry(exc=exc)


# ── Task 2: Corpus 빌드 ───────────────────────────────────────────────────────

@celery_app.task(
    name="workers.tasks.build_corpus_task",
    bind=True,
    max_retries=1,
)
def build_corpus_task(
    self,
    dataset_name: str = "open_subtitles",
    max_sentences: int = 5000,
    min_tokens: int = 4,
    max_tokens: int = 25,
):
    """
    Corpus 빌드를 Celery 백그라운드에서 실행.
    POST /corpus/build 에서 호출됨.
    """
    logger.info("[Celery] build_corpus_task start: dataset=%s max=%d", dataset_name, max_sentences)
    try:
        from app.corpus import build_corpus
        result = build_corpus(
            dataset_name=dataset_name,
            max_sentences=max_sentences,
            min_tokens=min_tokens,
            max_tokens=max_tokens,
        )
        logger.info("[Celery] build_corpus_task done: saved=%d", result.get("total_saved", 0))
        return result
    except Exception as exc:
        logger.error("[Celery] build_corpus_task error: %s", exc)
        raise self.retry(exc=exc)
