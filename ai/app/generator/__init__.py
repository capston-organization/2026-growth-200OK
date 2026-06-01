"""
LLM Problem Generator
corpus 문장들을 기반으로 Gemini API 호출 → 문제/해설/피드백 JSON 생성
"""
import json
import logging
import re
from typing import List, Optional

import requests

from app.core import GEMINI_API_KEY, GEMINI_MODEL, GEMINI_BASE_URL

logger = logging.getLogger(__name__)

MAX_SOURCE_CHARS = 8000  # 프롬프트에 넣을 최대 텍스트 길이
GEMINI_TIMEOUT = 60


# ── Gemini 호출 ───────────────────────────────────────────────────────────────

def _call_gemini(prompt: str) -> str:
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not set")

    url = f"{GEMINI_BASE_URL}/{GEMINI_MODEL}:generateContent"
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
    }
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 4096,
        },
    }
    resp = requests.post(url, headers=headers, json=body, timeout=GEMINI_TIMEOUT)
    resp.raise_for_status()
    data = resp.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        return ""


# ── JSON 추출 헬퍼 ────────────────────────────────────────────────────────────

def _extract_json(raw: str) -> str:
    """LLM 응답에서 JSON 배열/오브젝트 블록만 추출"""
    raw = raw.strip()
    # ```json ... ``` 블록 제거
    raw = re.sub(r"```(?:json)?", "", raw).replace("```", "").strip()

    start_arr = raw.find("[")
    start_obj = raw.find("{")
    if start_arr < 0 and start_obj < 0:
        return raw

    if start_arr >= 0 and (start_obj < 0 or start_arr <= start_obj):
        start = start_arr
        open_c, close_c = "[", "]"
    else:
        start = start_obj
        open_c, close_c = "{", "}"

    depth = 1
    i = start + 1
    while i < len(raw) and depth > 0:
        if raw[i] == open_c:
            depth += 1
        elif raw[i] == close_c:
            depth -= 1
        i += 1
    return raw[start:i] if depth == 0 else raw


def _truncate(text: str, max_len: int) -> str:
    return text[:max_len] if text and len(text) > max_len else (text or "")


def _strip_symbol(s: str) -> str:
    """①~⑤, 1. 2. 등 선택지 기호 제거"""
    if not s:
        return ""
    s = s.strip()
    if s and "①②③④⑤".find(s[0]) >= 0:
        s = s[1:].strip()
    elif len(s) >= 2 and s[1] == "." and s[0].isdigit():
        s = s[2:].strip()
    return s


# ── 문제 생성 ─────────────────────────────────────────────────────────────────

def generate_problems(
    source_sentences: List[str],
    problem_count: int,
    problem_types: List[str],
    grammar_tags: Optional[List[str]] = None,
    personalization_context: Optional[str] = None,
) -> List[dict]:
    """
    source_sentences: corpus에서 검색된 (또는 사용자 입력) 문장들
    반환: [{question, options, correct_answer, type, scope}]
    """
    if not source_sentences:
        return []

    # 소스 문장을 프롬프트에 넣을 텍스트로 변환
    source_block = "\n".join(f"- {s}" for s in source_sentences)
    source_block = _truncate(source_block, MAX_SOURCE_CHARS)

    type_str = ", ".join(problem_types) if problem_types else "MULTIPLE_CHOICE, OX, SHORT_ANSWER"

    # 문법 태그 힌트 블록
    tag_hint = ""
    if grammar_tags:
        tag_hint = f"""
[Grammar focus — 아래 문법 요소 중심으로 문제를 구성하세요]
{', '.join(grammar_tags)}
"""

    # 개인화 블록
    personal_block = ""
    if personalization_context:
        personal_block = f"""
[개인화 컨텍스트 — 취약 개념 중심으로 문제를 구성하세요]
{personalization_context}
"""

    prompt = f"""아래 영어 문장들을 학습 자료로 사용하여 정확히 {problem_count}개의 영어 문법/어휘 퀴즈 문제를 만들어 주세요.

[문제 유형] (반드시 아래만 사용)
- SHORT_ANSWER: 단답형. 질문 80자 이내, 정답 50자 이내.
- OX: O/X 문제. 질문 80자 이내, 정답은 "O" 또는 "X"만.
- MULTIPLE_CHOICE: 5지선다. 반드시 선택지 정확히 5개. ①② 기호 없이 내용만.

사용할 유형: {type_str}

[규칙]
- question: 한국어로, 80자 이내
- options: SHORT_ANSWER/OX는 빈 배열 []. MULTIPLE_CHOICE는 정확히 5개 배열.
- correct_answer: OX는 "O"/"X", 단답형 50자 이내, 객관식은 5개 중 정답 문자열
- type: SHORT_ANSWER / OX / MULTIPLE_CHOICE
- scope: 학습 범위 2~12자 (예: 과거시제, 조동사, 관계대명사)

JSON 배열만 출력. 설명 금지. 코드블록 금지.
{tag_hint}{personal_block}
[학습 자료 문장]
{source_block}
"""

    try:
        raw = _call_gemini(prompt)
        return _parse_problems(raw, problem_count, problem_types)
    except Exception as e:
        logger.error("generate_problems error: %s", e)
        return []


def _parse_problems(raw: str, count: int, types: List[str]) -> List[dict]:
    try:
        json_str = _extract_json(raw)
        items = json.loads(json_str)
        result = []
        for item in items:
            if not isinstance(item, dict):
                continue
            p_type = str(item.get("type", "MULTIPLE_CHOICE")).upper()
            options = item.get("options", [])
            if not isinstance(options, list):
                options = []
            # sanitize
            options = [_strip_symbol(str(o)) for o in options]
            options = [o for o in options if o]

            if p_type == "MULTIPLE_CHOICE":
                options = options[:5]
                correct = _strip_symbol(str(item.get("correct_answer", "")))
                correct = _truncate(correct, 50)
            elif p_type == "OX":
                options = []
                correct = str(item.get("correct_answer", "O")).upper()
                correct = correct if correct in ("O", "X") else "O"
            else:  # SHORT_ANSWER
                options = []
                correct = _truncate(str(item.get("correct_answer", "")), 50)

            result.append({
                "question": _truncate(str(item.get("question", "")), 80),
                "options": options,
                "correct_answer": correct,
                "type": p_type,
                "scope": _truncate(str(item.get("scope", "기타")), 12),
            })
        return result[:count]
    except Exception as e:
        logger.warning("Problem parse error: %s | raw=%s", e, raw[:200])
        return []


# ── 오답 분석 피드백 ──────────────────────────────────────────────────────────

def generate_analysis_feedback(
    weak_tags: List[dict],
) -> str:
    """
    weak_tags: [{tag, wrong_count, wrong_rate}]
    취약 문법 태그 기반으로 개인화 피드백 문자열 생성
    """
    if not weak_tags:
        return "아직 분석할 데이터가 부족합니다. 더 많은 게임을 플레이해 주세요!"

    top = weak_tags[:3]
    tag_lines = "\n".join(
        f"- {w['tag']}: 오답률 {w['wrong_rate']:.0f}% ({w['wrong_count']}회 오답)"
        for w in top
    )

    prompt = f"""학생의 영어 문법 취약점 분석 결과입니다:
{tag_lines}

위 결과를 바탕으로 학생에게 맞춤형 학습 피드백을 3~5문장으로 작성해 주세요.
- 취약한 문법 개념을 구체적으로 언급
- 학습 방향과 연습 방법 제안
- 격려 메시지 포함
- 한국어로 작성
"""
    try:
        return _call_gemini(prompt).strip()
    except Exception as e:
        logger.error("feedback generation error: %s", e)
        return "피드백 생성 중 오류가 발생했습니다."
