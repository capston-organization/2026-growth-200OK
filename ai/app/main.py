from fastapi import FastAPI
from pydantic import BaseModel  # 요청 데이터 형식 정의

from app.nlp.stanza_parser import parse_sentence

app = FastAPI(
    title="Grammar RAG Engine",
    description="AI NLP Server for grammar-aware problem generation",
    version="0.1.0",
)

class ParseRequest(BaseModel):
    text: str

@app.get("/")
def root():
    return {"message": "Grammar RAG Engine is running"}

@app.post("/parse")
def parse(request: ParseRequest):
    return {
        "input": request.text,
        "tokens": parse_sentence(request.text)
    }