"""
POST /retrieval/sentences — grammar_tags 조건으로 corpus 검색
"""
from fastapi import APIRouter, HTTPException

from app.schemas import RetrievalRequest, RetrievalResponse, CorpusSentence
from app.retrieval import retrieve_by_tags, retrieve_random

router = APIRouter()


@router.post("/sentences", response_model=RetrievalResponse, summary="Grammar-Aware Retrieval")
async def retrieve(req: RetrievalRequest):
    """
    grammar_tags 중 하나라도 포함하는 corpus 문장을 무작위로 반환합니다.
    tags가 비어 있으면 랜덤 문장을 반환합니다.
    """
    if req.grammar_tags:
        rows = retrieve_by_tags(
            grammar_tags=req.grammar_tags,
            limit=req.limit,
            min_tokens=req.min_tokens,
            max_tokens=req.max_tokens,
        )
    else:
        rows = retrieve_random(
            limit=req.limit,
            min_tokens=req.min_tokens,
            max_tokens=req.max_tokens,
        )

    sentences = [
        CorpusSentence(
            id=r["id"],
            sentence=r["sentence"],
            grammar_tags=r["grammar_tags"],
            token_count=r["token_count"],
        )
        for r in rows
    ]

    return RetrievalResponse(
        grammar_tags=req.grammar_tags,
        total_found=len(sentences),
        sentences=sentences,
    )
