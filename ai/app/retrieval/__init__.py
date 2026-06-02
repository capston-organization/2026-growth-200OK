"""
Grammar-Aware Retrieval
grammar_tags 조건으로 corpus에서 후보 문장을 검색
"""
import logging
from typing import List, Optional

import psycopg2

from app.core import DATABASE_URL

logger = logging.getLogger(__name__)


def get_conn():
    return psycopg2.connect(DATABASE_URL)


def retrieve_by_tags(
    grammar_tags: List[str],
    limit: int = 10,
    min_tokens: int = 4,
    max_tokens: int = 20,
    exclude_ids: Optional[List[int]] = None,
) -> List[dict]:
    """
    grammar_tags 중 하나라도 포함하는 문장을 랜덤하게 limit개 반환.
    exclude_ids: 이미 사용된 문장 id 제외 (중복 방지)
    """
    if not grammar_tags:
        return []

    # PostgreSQL ANY(ARRAY[...]) 로 OR 검색
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            base_sql = """
                SELECT id, sentence, grammar_tags, token_count
                FROM grammar_corpus
                WHERE grammar_tags && %s::text[]          -- 교집합이 있으면 (OR)
                  AND token_count BETWEEN %s AND %s
            """
            params: list = [grammar_tags, min_tokens, max_tokens]

            if exclude_ids:
                base_sql += " AND id != ALL(%s)"
                params.append(exclude_ids)

            base_sql += " ORDER BY RANDOM() LIMIT %s"
            params.append(limit)

            cur.execute(base_sql, params)
            rows = cur.fetchall()

        return [
            {
                "id": r[0],
                "sentence": r[1],
                "grammar_tags": list(r[2]) if r[2] else [],
                "token_count": r[3],
            }
            for r in rows
        ]
    finally:
        conn.close()


def retrieve_random(
    limit: int = 10,
    min_tokens: int = 5,
    max_tokens: int = 20,
) -> List[dict]:
    """grammar_tags 조건 없이 랜덤 문장 반환 (fallback용)"""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, sentence, grammar_tags, token_count
                FROM grammar_corpus
                WHERE token_count BETWEEN %s AND %s
                ORDER BY RANDOM()
                LIMIT %s
                """,
                [min_tokens, max_tokens, limit],
            )
            rows = cur.fetchall()
        return [
            {
                "id": r[0],
                "sentence": r[1],
                "grammar_tags": list(r[2]) if r[2] else [],
                "token_count": r[3],
            }
            for r in rows
        ]
    finally:
        conn.close()


def count_corpus() -> int:
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM grammar_corpus")
            return cur.fetchone()[0]
    finally:
        conn.close()
