from fastapi import APIRouter

from app.api.corpus import router as corpus_router
from app.api.retrieval import router as retrieval_router
from app.api.generate import router as generate_router
from app.api.analysis import router as analysis_router

api_router = APIRouter()
api_router.include_router(corpus_router,    prefix="/corpus",    tags=["Corpus"])
api_router.include_router(retrieval_router, prefix="/retrieval", tags=["Retrieval"])
api_router.include_router(generate_router,  prefix="/generate",  tags=["Generate"])
api_router.include_router(analysis_router,  prefix="/analysis",  tags=["Analysis"])
