"""
POST /generate/problems — RAG 기반 문제 생성 (SpringBoot 연동 핵심 엔드포인트)
"""
import logging
import re
import random
from typing import List, Dict
from fastapi import APIRouter, HTTPException

from app.schemas import ProblemGenerationRequest, ProblemGenerationResponse, GeneratedProblem
from app.nlp.stanza_parser import parse_sentence
from app.nlp.grammar_tagger import extract_grammar_tags
from app.retrieval import retrieve_by_tags, retrieve_random
from app.generator import generate_problems

router = APIRouter()
logger = logging.getLogger(__name__)

# 태그별 최대 문제 비율 (전체 문제 수에서 한 태그가 차지할 수 있는 최대 비율)
MAX_RATIO_PER_TAG = 0.4

# 안정적으로 탐지되는 v1 태그 (정확성 검증됨)
STABLE_TAGS = [
    "tense_past",
    "tense_present",
    "subject_verb_agreement",
    "auxiliary_verb",
    "preposition",
    "article",
    "passive_voice",
    "comparative",
]


def _retrieve_balanced(grammar_tags: List[str], problem_count: int) -> List[Dict]:
    """
    태그별로 골고루 corpus 문장을 검색.
    각 태그에서 최대 MAX_RATIO_PER_TAG 비율만큼만 가져와서 다양성 보장.
    """
    if not grammar_tags:
        return retrieve_random(limit=problem_count * 2)

    # 안정적인 태그만 필터링
    stable = [t for t in grammar_tags if t in STABLE_TAGS]
    if not stable:
        stable = grammar_tags

    # 태그별 목표 문장 수 계산
    max_per_tag = max(1, int(problem_count * MAX_RATIO_PER_TAG))
    per_tag_count = max(1, (problem_count * 2) // len(stable))
    per_tag_count = min(per_tag_count, max_per_tag)

    collected = []
    used_ids = []

    # 태그를 섞어서 다양성 확보
    shuffled_tags = stable.copy()
    random.shuffle(shuffled_tags)

    for tag in shuffled_tags:
        rows = retrieve_by_tags(
            grammar_tags=[tag],          # 태그 하나씩 검색 → 해당 문법 문장만
            limit=per_tag_count,
            exclude_ids=used_ids,
        )
        collected.extend(rows)
        used_ids.extend([r["id"] for r in rows])

    # 부족하면 랜덤으로 보충
    if len(collected) < problem_count:
        extra = retrieve_random(
            limit=problem_count - len(collected),
            min_tokens=5,
            max_tokens=20,
        )
        collected.extend(extra)

    random.shuffle(collected)
    return collected[:problem_count * 2]


@router.post(
    "/problems",
    response_model=ProblemGenerationResponse,
    summary="RAG 문제 생성 (SpringBoot → FastAPI 핵심 연동 엔드포인트)",
)
async def generate(req: ProblemGenerationRequest):
    """
    RAG Pipeline (균형 잡힌 다양한 문법 문제 생성):
    1. source_text 있으면 → Stanza 파싱 → grammar_tags 추출
    2. 태그별로 골고루 corpus 검색 (Balanced Retrieval)
    3. source_text + retrieved sentences → Gemini 문제 생성
    """
    # ── Step 1: grammar_tags 확정 ─────────────────────────────────────────────
    grammar_tags = req.grammar_tags or []

    if req.source_text and not grammar_tags:
        try:
            tokens = parse_sentence(req.source_text[:2000])
            grammar_tags = extract_grammar_tags(tokens)
            logger.info("Extracted grammar_tags from source_text: %s", grammar_tags)
        except Exception as e:
            logger.warning("Failed to parse source_text: %s", e)
            grammar_tags = []

    # ── Step 2: Balanced Retrieval ────────────────────────────────────────────
    try:
        retrieved = _retrieve_balanced(grammar_tags, req.problem_count)
    except Exception:
        retrieved = []

    retrieved_sentences = [r["sentence"] for r in retrieved]

    # source_text는 grammar_tags 추출에만 사용 (저작권 리스크 0)
    # 문제 문장은 HuggingFace Corpus에서만 가져옴
    source_sentences = retrieved_sentences

    if not source_sentences:
        raise HTTPException(
            status_code=422,
            detail="corpus가 비어 있습니다. POST /corpus/build 로 먼저 corpus를 구축하세요.",
        )

    logger.info(
        "Generating %d problems from %d sentences, tags: %s",
        req.problem_count, len(source_sentences), grammar_tags
    )

    # ── Step 3: LLM 문제 생성 ─────────────────────────────────────────────────
    problems_raw = generate_problems(
        source_sentences=source_sentences,
        problem_count=req.problem_count,
        problem_types=req.problem_types,
        grammar_tags=grammar_tags if grammar_tags else None,
        personalization_context=req.personalization_context,
    )

    if not problems_raw:
        raise HTTPException(
            status_code=500,
            detail="문제 생성에 실패했습니다. Gemini API 키를 확인하세요."
        )

    problems = [GeneratedProblem(**p) for p in problems_raw]

    return ProblemGenerationResponse(
        problems=problems,
        source_sentences=source_sentences[:5],
        grammar_tags_used=grammar_tags,
    )