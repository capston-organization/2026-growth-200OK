"""
POST /corpus/build  — HuggingFace 데이터셋 파이프라인 실행
GET  /corpus/status — corpus 현황 조회
"""
import logging
from fastapi import APIRouter, BackgroundTasks, HTTPException

from app.schemas import CorpusBuildRequest, CorpusBuildResponse
from app.corpus import build_corpus, count_by_tag, count_corpus

router = APIRouter()
logger = logging.getLogger(__name__)

# 빌드 상태 메모리 캐시 (단순 플래그)
_build_state: dict = {"running": False, "last_result": None}


def _run_build(req: CorpusBuildRequest):
    _build_state["running"] = True
    try:
        result = build_corpus(
            dataset_name=req.dataset_name,
            max_sentences=req.max_sentences,
            min_tokens=req.min_tokens,
            max_tokens=req.max_tokens,
        )
        _build_state["last_result"] = result
    except Exception as e:
        logger.error("build_corpus failed: %s", e)
        _build_state["last_result"] = {"status": "error", "error": str(e)}
    finally:
        _build_state["running"] = False


@router.post("/build", response_model=CorpusBuildResponse, summary="Corpus 빌드 (백그라운드)")
async def build(req: CorpusBuildRequest, background_tasks: BackgroundTasks):
    """
    HuggingFace 데이터셋을 파싱해 grammar_corpus 테이블에 저장.
    시간이 오래 걸리므로 백그라운드로 실행되며 즉시 202 응답을 반환합니다.
    완료 여부는 GET /corpus/status 로 확인하세요.
    """
    if _build_state["running"]:
        raise HTTPException(status_code=409, detail="빌드가 이미 실행 중입니다.")
    background_tasks.add_task(_run_build, req)
    return CorpusBuildResponse(
        status="started",
        total_parsed=0,
        total_saved=0,
        grammar_tag_distribution={},
    )


@router.post("/build/sync", response_model=CorpusBuildResponse, summary="Corpus 빌드 (동기, 테스트용)")
async def build_sync(req: CorpusBuildRequest):
    """소규모(max_sentences≤500) 테스트용 동기 빌드"""
    if req.max_sentences > 500:
        raise HTTPException(status_code=400, detail="동기 빌드는 max_sentences≤500만 허용")
    result = build_corpus(
        dataset_name=req.dataset_name,
        max_sentences=req.max_sentences,
        min_tokens=req.min_tokens,
        max_tokens=req.max_tokens,
    )
    return CorpusBuildResponse(**result)


@router.get("/status", summary="Corpus 현황 조회")
async def status():
    total = 0
    dist = {}
    try:
        total = count_corpus()
        dist = count_by_tag()
    except Exception as e:
        return {"total_sentences": 0, "tag_distribution": {}, "build_running": _build_state["running"], "error": str(e)}
    return {
        "total_sentences": total,
        "tag_distribution": dist,
        "build_running": _build_state["running"],
        "last_build_result": _build_state.get("last_result"),
    }
