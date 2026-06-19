"""
POST /corpus/build      — Celery 비동기 빌드 (권장)
POST /corpus/build/sync — 동기 빌드 (소량 테스트)
GET  /corpus/status     — corpus 현황
"""
import logging
from fastapi import APIRouter, HTTPException

from app.schemas import CorpusBuildRequest, CorpusBuildResponse
from app.corpus import count_by_tag, count_corpus

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/build", response_model=CorpusBuildResponse, summary="Corpus 빌드 (Celery 비동기)")
async def build(req: CorpusBuildRequest):
    """
    Celery Worker에게 corpus 빌드 task를 던지고 즉시 반환.
    진행 상황은 GET /corpus/status 로 확인.
    """
    try:
        from workers.tasks import build_corpus_task
        build_corpus_task.apply_async(kwargs={
            "dataset_name":  req.dataset_name,
            "max_sentences": req.max_sentences,
            "min_tokens":    req.min_tokens,
            "max_tokens":    req.max_tokens,
        })
        return CorpusBuildResponse(
            status="queued",
            total_parsed=0,
            total_saved=0,
            grammar_tag_distribution={},
        )
    except Exception as e:
        # Redis/Celery 없을 때 graceful 처리
        logger.warning("Celery 없음, 동기 빌드로 전환: %s", e)
        return await build_sync(req)


@router.post("/build/sync", response_model=CorpusBuildResponse, summary="Corpus 동기 빌드 (테스트용)")
async def build_sync(req: CorpusBuildRequest):
    """소량(max_sentences≤500) 테스트용 동기 빌드. Celery 없어도 동작."""
    if req.max_sentences > 500:
        raise HTTPException(status_code=400, detail="동기 빌드는 max_sentences≤500만 허용")
    from app.corpus import build_corpus
    result = build_corpus(
        dataset_name=req.dataset_name,
        max_sentences=req.max_sentences,
        min_tokens=req.min_tokens,
        max_tokens=req.max_tokens,
    )
    return CorpusBuildResponse(**result)


@router.get("/status", summary="Corpus 현황")
async def status():
    try:
        total = count_corpus()
        dist  = count_by_tag()
    except Exception as e:
        return {"total_sentences": 0, "tag_distribution": {}, "error": str(e)}
    return {"total_sentences": total, "tag_distribution": dist}
