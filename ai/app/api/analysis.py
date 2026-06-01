"""
POST /analysis/weak-tags — 오답 데이터 → 취약 grammar tag 분석
"""
from collections import defaultdict
from typing import List

from fastapi import APIRouter, HTTPException

from app.schemas import AnalysisRequest, AnalysisResponse, WeakGrammarTag
from app.generator import generate_analysis_feedback
from app.nlp.stanza_parser import parse_sentence
from app.nlp.grammar_tagger import extract_grammar_tags

router = APIRouter()

# 미리 정의된 tag → 한국어 scope 매핑
TAG_TO_SCOPE = {
    "subject_verb_agreement": "수일치",
    "tense_present": "현재시제",
    "tense_past": "과거시제",
    "auxiliary_verb": "조동사",
    "preposition": "전치사",
    "article": "관사",
    "comparative": "비교급",
    "to_infinitive": "to부정사",
    "passive_voice": "수동태",
    "basic_word_order": "문장구조",
}


@router.post("/weak-tags", response_model=AnalysisResponse, summary="취약 문법 태그 분석")
async def analyze_weak_tags(req: AnalysisRequest):
    """
    오답 문제 목록을 받아 각 문제의 정답 문장을 Stanza로 파싱,
    grammar_tag 별 오답 빈도를 계산하여 취약 태그 Top5와 추천 복습 태그를 반환합니다.
    """
    if not req.wrong_problems:
        raise HTTPException(status_code=400, detail="wrong_problems가 비어 있습니다.")

    tag_wrong_count: dict = defaultdict(int)
    tag_total_count: dict = defaultdict(int)

    for item in req.wrong_problems:
        # 정답 문장을 파싱해서 grammar tags 추출
        answer_text = item.get("correct_answer", "") or item.get("question", "")
        if not answer_text:
            continue
        try:
            tokens = parse_sentence(answer_text)
            tags = extract_grammar_tags(tokens)
        except Exception:
            tags = []

        for tag in tags:
            tag_total_count[tag] += 1
            tag_wrong_count[tag] += 1  # 오답 문제이므로 전부 오답 카운트

    if not tag_wrong_count:
        return AnalysisResponse(
            weak_tags=[],
            recommended_grammar_tags=[],
            feedback_summary="분석할 오답 데이터가 부족합니다. 게임을 더 플레이해 주세요!",
        )

    # 오답 수 기준 정렬
    sorted_tags = sorted(tag_wrong_count.items(), key=lambda x: x[1], reverse=True)

    total_problems = len(req.wrong_problems)
    weak_tags: List[WeakGrammarTag] = []
    for tag, wc in sorted_tags[:5]:
        tc = tag_total_count.get(tag, wc)
        rate = round((wc / total_problems) * 100, 1)
        weak_tags.append(WeakGrammarTag(tag=tag, wrong_count=wc, wrong_rate=rate))

    recommended = [t.tag for t in weak_tags[:3]]
    feedback = generate_analysis_feedback([t.dict() for t in weak_tags])

    return AnalysisResponse(
        weak_tags=weak_tags,
        recommended_grammar_tags=recommended,
        feedback_summary=feedback,
    )
