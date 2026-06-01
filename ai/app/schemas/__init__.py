from pydantic import BaseModel, Field
from typing import List, Optional


# ── Parse ─────────────────────────────────────────────────────────────────────

class ParseRequest(BaseModel):
    text: str = Field(..., description="분석할 영어 문장")


class TokenInfo(BaseModel):
    id: int
    text: str
    lemma: str
    upos: str
    xpos: str
    head: int
    deprel: str
    feats: Optional[str] = None


class ParseResponse(BaseModel):
    input: str
    tokens: List[TokenInfo]
    grammar_tags: List[str]


# ── Corpus Build ──────────────────────────────────────────────────────────────

class CorpusBuildRequest(BaseModel):
    dataset_name: str = Field(
        default="open_subtitles",
        description="HuggingFace dataset: 'open_subtitles' | 'simple_wikipedia'"
    )
    max_sentences: int = Field(default=5000, ge=100, le=50000)
    min_tokens: int = Field(default=4, ge=2)
    max_tokens: int = Field(default=25, le=60)


class CorpusBuildResponse(BaseModel):
    status: str
    total_parsed: int
    total_saved: int
    grammar_tag_distribution: dict


# ── Retrieval ─────────────────────────────────────────────────────────────────

class RetrievalRequest(BaseModel):
    grammar_tags: List[str] = Field(
        ...,
        description="검색할 grammar tag 목록 (OR 조건)",
        example=["tense_past", "auxiliary_verb"]
    )
    limit: int = Field(default=10, ge=1, le=50)
    min_tokens: int = Field(default=4)
    max_tokens: int = Field(default=20)


class CorpusSentence(BaseModel):
    id: int
    sentence: str
    grammar_tags: List[str]
    token_count: int


class RetrievalResponse(BaseModel):
    grammar_tags: List[str]
    total_found: int
    sentences: List[CorpusSentence]


# ── Problem Generation ────────────────────────────────────────────────────────

class ProblemGenerationRequest(BaseModel):
    source_text: Optional[str] = Field(
        None,
        description="사용자 입력 텍스트 (없으면 corpus에서 자동 검색)"
    )
    grammar_tags: Optional[List[str]] = Field(
        None,
        description="문제에 포함할 grammar tag (취약점 기반 개인화)"
    )
    problem_count: int = Field(default=5, ge=1, le=20)
    problem_types: List[str] = Field(
        default=["MULTIPLE_CHOICE", "OX", "SHORT_ANSWER"]
    )
    personalization_context: Optional[str] = Field(
        None,
        description="SpringBoot 사용자 취약점 JSON"
    )


class GeneratedProblem(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    type: str
    scope: str


class ProblemGenerationResponse(BaseModel):
    problems: List[GeneratedProblem]
    source_sentences: List[str]
    grammar_tags_used: List[str]


# ── Analysis ──────────────────────────────────────────────────────────────────

class AnalysisRequest(BaseModel):
    wrong_problems: List[dict] = Field(
        ...,
        description="오답 목록. 각 항목: {question, correct_answer, user_answer, scope}"
    )


class WeakGrammarTag(BaseModel):
    tag: str
    wrong_count: int
    wrong_rate: float


class AnalysisResponse(BaseModel):
    weak_tags: List[WeakGrammarTag]
    recommended_grammar_tags: List[str]
    feedback_summary: str
