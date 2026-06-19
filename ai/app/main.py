import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.nlp.stanza_parser import parse_sentence
from app.nlp.grammar_tagger import extract_grammar_tags
from app.schemas import ParseRequest, ParseResponse

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Grammar RAG Engine",
    description="""
## 200OK AI NLP Server

RAG 기반 영어 문법 문제 생성 파이프라인

### 주요 엔드포인트
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/corpus/build` | HuggingFace 데이터셋 파싱 → DB 저장 |
| GET  | `/corpus/status` | corpus 현황 |
| POST | `/retrieval/sentences` | grammar_tags 조건 검색 |
| **POST** | **`/generate/problems`** | **SpringBoot 연동 핵심: RAG 문제 생성** |
| POST | `/analysis/weak-tags` | 오답 기반 취약 태그 분석 |
| POST | `/parse` | 단일 문장 Stanza 파싱 (디버그) |
    """,
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 핵심 RAG API 라우터 등록
app.include_router(api_router, prefix="/api")


# ── 기존 /parse 엔드포인트 유지 (하위 호환) ──────────────────────────────────

@app.get("/")
def root():
    return {
        "message": "Grammar RAG Engine is running",
        "docs": "/docs",
        "key_endpoints": {
            "generate_problems": "POST /api/generate/problems",
            "corpus_build": "POST /api/corpus/build",
            "retrieval": "POST /api/retrieval/sentences",
            "analysis": "POST /api/analysis/weak-tags",
        },
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/parse", response_model=ParseResponse, tags=["Debug"])
def parse(request: ParseRequest):
    """단일 문장 파싱 (디버그용, 기존 엔드포인트 유지)"""
    tokens = parse_sentence(request.text)
    grammar_tags = extract_grammar_tags(tokens)
    return ParseResponse(
        input=request.text,
        tokens=tokens,
        grammar_tags=grammar_tags,
    )
