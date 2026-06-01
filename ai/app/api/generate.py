"""
POST /generate/problems — RAG 기반 문제 생성 (SpringBoot 연동 핵심 엔드포인트)
"""
import logging
from fastapi import APIRouter, HTTPException

from app.schemas import ProblemGenerationRequest, ProblemGenerationResponse, GeneratedProblem
from app.nlp.stanza_parser import parse_sentence
from app.nlp.grammar_tagger import extract_grammar_tags
from app.retrieval import retrieve_by_tags, retrieve_random
from app.generator import generate_problems

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/problems",
    response_model=ProblemGenerationResponse,
    summary="RAG 문제 생성 (SpringBoot → FastAPI 핵심 연동 엔드포인트)",
)
async def generate(req: ProblemGenerationRequest):
    """
    RAG Pipeline:
    1. source_text 있으면 → Stanza 파싱 → grammar_tags 추출
    2. grammar_tags로 corpus 검색 (Retrieval)
    3. source_text + retrieved sentences → Gemini 문제 생성

    source_text 없으면 grammar_tags로만 corpus 검색 후 문제 생성.
    grammar_tags도 없으면 랜덤 corpus 문장으로 생성.
    """
    # ── Step 1: grammar_tags 확정 ─────────────────────────────────────────────
    grammar_tags = req.grammar_tags or []

    if req.source_text and not grammar_tags:
        # 사용자가 직접 텍스트를 넣었지만 취약점 태그가 없을 때 → 텍스트에서 추출
        try:
            tokens = parse_sentence(req.source_text[:2000])
            grammar_tags = extract_grammar_tags(tokens)
        except Exception as e:
            logger.warning("Failed to parse source_text: %s", e)
            grammar_tags = []

    # ── Step 2: Retrieval ─────────────────────────────────────────────────────
    # 문제 1개당 후보 문장 2~3개 필요
    retrieve_count = min(req.problem_count * 3, 30)

    if grammar_tags:
        retrieved = retrieve_by_tags(
            grammar_tags=grammar_tags,
            limit=retrieve_count,
        )
    else:
        retrieved = retrieve_random(limit=retrieve_count)

    retrieved_sentences = [r["sentence"] for r in retrieved]

    # source_text가 있으면 corpus 문장과 함께 섞어서 사용
    if req.source_text:
        # 사용자 텍스트를 문장 단위로 분리
        import re
        user_sents = [
            s.strip()
            for s in re.split(r"(?<=[.!?])\s+", req.source_text)
            if len(s.strip()) > 5
        ]
        # 사용자 문장 우선, corpus 보완
        source_sentences = (user_sents + retrieved_sentences)[:retrieve_count]
    else:
        source_sentences = retrieved_sentences

    if not source_sentences:
        raise HTTPException(
            status_code=422,
            detail="corpus가 비어 있습니다. POST /corpus/build 로 먼저 corpus를 구축하세요.",
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
        raise HTTPException(status_code=500, detail="문제 생성에 실패했습니다. Gemini API 키를 확인하세요.")

    problems = [GeneratedProblem(**p) for p in problems_raw]

    return ProblemGenerationResponse(
        problems=problems,
        source_sentences=source_sentences[:5],  # 디버깅용 상위 5개만 반환
        grammar_tags_used=grammar_tags,
    )
