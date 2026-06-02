"""
Corpus Build Pipeline
  HuggingFace dataset -> sentence filter -> Stanza parse -> grammar tag -> PostgreSQL
"""
import re
import json
import logging
from typing import List, Optional

import psycopg2
from psycopg2.extras import execute_values

from app.core import DATABASE_URL
from app.nlp.stanza_parser import parse_sentence
from app.nlp.grammar_tagger import extract_grammar_tags

logger = logging.getLogger(__name__)


# ── DB helpers ────────────────────────────────────────────────────────────────

def get_conn():
    return psycopg2.connect(DATABASE_URL)


def ensure_table():
    """grammar_corpus 테이블이 없으면 생성"""
    ddl = """
    CREATE TABLE IF NOT EXISTS grammar_corpus (
        id          SERIAL PRIMARY KEY,
        sentence    TEXT NOT NULL,
        grammar_tags TEXT[] NOT NULL DEFAULT '{}',
        token_count INTEGER NOT NULL DEFAULT 0,
        source      VARCHAR(64),
        created_at  TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_grammar_corpus_tags
        ON grammar_corpus USING GIN (grammar_tags);
    """
    conn = get_conn()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(ddl)
        logger.info("grammar_corpus table ready")
    finally:
        conn.close()


def save_sentences(rows: List[dict]) -> int:
    """rows: [{sentence, grammar_tags, token_count, source}] -> DB 저장, 저장 건수 반환"""
    if not rows:
        return 0
    data = [
        (r["sentence"], r["grammar_tags"], r["token_count"], r["source"])
        for r in rows
    ]
    conn = get_conn()
    try:
        with conn:
            with conn.cursor() as cur:
                execute_values(
                    cur,
                    """
                    INSERT INTO grammar_corpus (sentence, grammar_tags, token_count, source)
                    VALUES %s
                    ON CONFLICT DO NOTHING
                    """,
                    data,
                    template="(%s, %s, %s, %s)"
                )
        return len(data)
    finally:
        conn.close()


def count_by_tag() -> dict:
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT unnest(grammar_tags) AS tag, COUNT(*) AS cnt
                FROM grammar_corpus
                GROUP BY tag
                ORDER BY cnt DESC
            """)
            return {row[0]: row[1] for row in cur.fetchall()}
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


# ── Text cleaning ─────────────────────────────────────────────────────────────

_CLEAN = re.compile(r"[^a-zA-Z0-9 .,!?'\";\-:()]")
_MULTI_SPACE = re.compile(r" {2,}")


def _clean(text: str) -> str:
    text = text.strip()
    text = _CLEAN.sub(" ", text)
    text = _MULTI_SPACE.sub(" ", text)
    return text.strip()


def _is_valid(text: str, min_tok: int, max_tok: int) -> bool:
    words = text.split()
    if not (min_tok <= len(words) <= max_tok):
        return False
    # 첫 글자 대문자, 끝 구두점 체크
    if not text[0].isupper():
        return False
    if text[-1] not in ".!?\"'":
        return False
    return True


# ── Dataset loaders ───────────────────────────────────────────────────────────

def _load_open_subtitles(max_sentences: int) -> List[str]:
    """
    Helsinki-NLP/open_subtitles 영어 자막 데이터.
    streaming=True 로 메모리 절약.
    """
    from datasets import load_dataset  # lazy import
    logger.info("Loading open_subtitles dataset (streaming)…")
    ds = load_dataset(
        "Helsinki-NLP/open_subtitles",
        lang1="en", lang2="fr",   # en-fr pair → en 컬럼만 사용
        split="train",
        streaming=True,
        trust_remote_code=True,
    )
    sentences = []
    for ex in ds:
        if len(sentences) >= max_sentences * 3:   # 필터 후 충분히 남도록 3배 수집
            break
        text = ex.get("translation", {}).get("en", "") or ""
        text = _clean(text)
        sentences.append(text)
    logger.info("open_subtitles raw: %d lines collected", len(sentences))
    return sentences


def _load_simple_wikipedia(max_sentences: int) -> List[str]:
    """
    wikimedia/wikipedia (20231101.simple) — Simple English Wikipedia.
    각 article의 text를 문장 단위로 분리.
    """
    import re as _re
    from datasets import load_dataset

    logger.info("Loading Simple English Wikipedia (streaming)…")
    ds = load_dataset(
        "wikimedia/wikipedia",
        "20231101.simple",
        split="train",
        streaming=True,
        trust_remote_code=True,
    )
    sent_split = _re.compile(r"(?<=[.!?])\s+")
    sentences = []
    for article in ds:
        text = article.get("text", "")
        for sent in sent_split.split(text):
            sentences.append(_clean(sent))
            if len(sentences) >= max_sentences * 3:
                break
        if len(sentences) >= max_sentences * 3:
            break
    logger.info("simple_wikipedia raw: %d sentences", len(sentences))
    return sentences


# ── Main pipeline ─────────────────────────────────────────────────────────────

def build_corpus(
    dataset_name: str = "open_subtitles",
    max_sentences: int = 5000,
    min_tokens: int = 4,
    max_tokens: int = 25,
) -> dict:
    """
    전체 파이프라인 실행:
    1. HuggingFace 데이터 로드
    2. 문장 필터링
    3. Stanza 파싱 + grammar tag 추출
    4. PostgreSQL 저장
    """
    ensure_table()

    # 1. 데이터 로드
    if dataset_name == "open_subtitles":
        raw = _load_open_subtitles(max_sentences)
        source_label = "open_subtitles"
    elif dataset_name == "simple_wikipedia":
        raw = _load_simple_wikipedia(max_sentences)
        source_label = "simple_wikipedia"
    else:
        raise ValueError(f"Unknown dataset: {dataset_name}")

    # 2. 필터링
    valid = [s for s in raw if _is_valid(s, min_tokens, max_tokens)]
    # 목표 수만큼 슬라이스
    valid = valid[:max_sentences]
    logger.info("After filter: %d sentences", len(valid))

    # 3. 파싱 + tagging
    rows = []
    for i, sent in enumerate(valid):
        try:
            tokens = parse_sentence(sent)
            tags = extract_grammar_tags(tokens)
            if not tags:          # tag 없는 문장은 건너뜀 (corpus 가치 낮음)
                continue
            rows.append({
                "sentence": sent,
                "grammar_tags": tags,
                "token_count": len(tokens),
                "source": source_label,
            })
        except Exception as e:
            logger.warning("Parse error at sentence %d: %s", i, e)

        if (i + 1) % 500 == 0:
            logger.info("Progress: %d / %d parsed", i + 1, len(valid))

    # 4. DB 저장
    saved = save_sentences(rows)
    dist = count_by_tag()

    logger.info("Corpus build done: %d saved", saved)
    return {
        "status": "done",
        "total_parsed": len(rows),
        "total_saved": saved,
        "grammar_tag_distribution": dist,
    }
