"""
LLM Generator
rule-based problem_builder가 만든 재료를 받아서
LLM은 문제 지시문·빈칸 문장·해설만 생성 (정답/오답은 절대 창작 안 함)
"""
import json
import logging
import re
from typing import List, Optional

import requests

from app.core import GEMINI_API_KEY, GEMINI_MODEL, GEMINI_BASE_URL

logger = logging.getLogger(__name__)

MAX_SOURCE_CHARS = 8000
GEMINI_TIMEOUT = 60


# ── Gemini 호출 ───────────────────────────────────────────────────────────────

def _call_gemini(prompt: str) -> str:
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not set")
    url = f"{GEMINI_BASE_URL}/{GEMINI_MODEL}:generateContent"
    headers = {"Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY}
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.4, "maxOutputTokens": 4096},
    }
    resp = requests.post(url, headers=headers, json=body, timeout=GEMINI_TIMEOUT)
    resp.raise_for_status()
    data = resp.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        return ""


def _extract_json(raw: str) -> str:
    raw = raw.strip()
    raw = re.sub(r"```(?:json)?", "", raw).replace("```", "").strip()
    start_arr = raw.find("[")
    start_obj = raw.find("{")
    if start_arr < 0 and start_obj < 0:
        return raw
    if start_arr >= 0 and (start_obj < 0 or start_arr <= start_obj):
        start, open_c, close_c = start_arr, "[", "]"
    else:
        start, open_c, close_c = start_obj, "{", "}"
    depth, i = 1, start + 1
    while i < len(raw) and depth > 0:
        if raw[i] == open_c: depth += 1
        elif raw[i] == close_c: depth -= 1
        i += 1
    return raw[start:i] if depth == 0 else raw


def _truncate(text: str, max_len: int) -> str:
    return text[:max_len] if text and len(text) > max_len else (text or "")


# ── 핵심: LLM은 포장만 ────────────────────────────────────────────────────────

def wrap_problem_with_llm(material: dict) -> Optional[dict]:
    """
    rule-based가 만든 재료 → LLM이 자연어 문제 지시문 + 해설만 생성

    material:
        sentence, target_grammar, answer, wrong_choices, problem_type

    반환:
        question, sentence_with_blank, choices (순서 섞인 것), answer, explanation, type, scope
    """
    sentence      = material["sentence"]
    answer        = material["answer"]
    wrong_choices = material["wrong_choices"]
    target_grammar = material["target_grammar"]
    problem_type  = material["problem_type"]

    # 빈칸 문장 생성 (LLM 없이 서버에서 직접)
    sentence_with_blank = sentence.replace(answer, "___", 1)

    # 선택지 섞기 (정답 포함, 서버에서)
    all_choices = [answer] + wrong_choices[:4]
    import random; random.shuffle(all_choices)

    # LLM에게는 지시문 + 해설만 요청
    prompt = f"""다음 영어 문법 문제의 지시문과 해설을 작성해 주세요.

문법 포인트: {target_grammar}
문장: {sentence}
정답: {answer}
오답 선택지: {', '.join(wrong_choices)}

요구사항:
- question: 학생에게 보여줄 문제 지시문 (한국어, 20자 이내, 예: "올바른 동사 형태를 고르시오.")
- explanation: 왜 '{answer}'이 정답인지 초중등 눈높이로 2문장 이내 한국어 설명

반드시 아래 JSON만 출력. 코드블록 금지.
{{"question":"...","explanation":"..."}}"""

    try:
        raw = _call_gemini(prompt)
        parsed = json.loads(_extract_json(raw))
        question    = _truncate(parsed.get("question", "올바른 답을 고르시오."), 40)
        explanation = _truncate(parsed.get("explanation", ""), 200)
    except Exception as e:
        logger.warning("LLM wrap failed: %s", e)
        question    = "올바른 답을 고르시오."
        explanation = f"정답은 '{answer}'입니다."

    return {
        "question":            question,
        "sentence_with_blank": sentence_with_blank,
        "options":             all_choices,
        "correct_answer":      answer,
        "explanation":         explanation,
        "type":                "MULTIPLE_CHOICE" if problem_type == "multiple_choice" else "OX",
        "scope":               _tag_to_scope(target_grammar),
    }


# ── 배치 생성 (source_text 있을 때) ─────────────────────────────────────────

def generate_problems(
    source_sentences: List[str],
    problem_count: int,
    problem_types: List[str],
    grammar_tags: Optional[List[str]] = None,
    personalization_context: Optional[str] = None,
) -> List[dict]:
    """
    corpus retrieval된 문장들 → rule-based 재료 생성 → LLM 포장
    rule-based 실패 문장은 LLM 직접 생성으로 보완
    """
    from app.nlp.stanza_parser import parse_sentence
    from app.nlp.grammar_tagger import extract_grammar_tags
    from app.nlp.problem_builder import build_problem_material

    results = []

    for sentence in source_sentences:
        if len(results) >= problem_count:
            break
        try:
            tokens = parse_sentence(sentence)
            tags   = extract_grammar_tags(tokens)

            # grammar_tags 필터 적용 (취약점 개인화)
            if grammar_tags:
                tags = [t for t in tags if t in grammar_tags] or tags

            material = build_problem_material(sentence, tags, tokens)
            if material is None:
                continue

            wrapped = wrap_problem_with_llm(material)
            if wrapped:
                results.append(wrapped)
        except Exception as e:
            logger.warning("Problem generation failed for sentence: %s | %s", sentence[:50], e)

    # rule-based로 부족한 수량은 LLM 직접 생성으로 보완
    remaining = problem_count - len(results)
    if remaining > 0 and source_sentences:
        logger.info("rule-based %d개 생성 완료, LLM fallback으로 %d개 추가", len(results), remaining)
        llm_problems = _llm_fallback(
            source_sentences, remaining, problem_types,
            grammar_tags, personalization_context
        )
        results.extend(llm_problems)

    return results[:problem_count]


def _llm_fallback(
    source_sentences: List[str],
    count: int,
    problem_types: List[str],
    grammar_tags: Optional[List[str]],
    personalization_context: Optional[str],
) -> List[dict]:
    """rule-based 실패 시 LLM 직접 생성 (기존 방식, 보완용)"""
    source_block = "\n".join(f"- {s}" for s in source_sentences)
    source_block = _truncate(source_block, MAX_SOURCE_CHARS)
    type_str     = ", ".join(problem_types) if problem_types else "MULTIPLE_CHOICE"
    tag_hint     = f"\n[Grammar focus]\n{', '.join(grammar_tags)}" if grammar_tags else ""
    personal     = f"\n[개인화 컨텍스트]\n{personalization_context}" if personalization_context else ""

    prompt = f"""아래 영어 문장들을 학습 자료로 정확히 {count}개의 퀴즈 문제를 만들어 주세요.

유형: {type_str}
- MULTIPLE_CHOICE: 선택지 정확히 5개, 기호 없이 내용만
- OX: 정답은 "O" 또는 "X"
- SHORT_ANSWER: 단답형, 정답 50자 이내

필드: question(한국어 80자↓), options(배열), correct_answer, type, scope(2~12자)
JSON 배열만 출력. 설명 금지.
{tag_hint}{personal}

[학습 자료]
{source_block}"""

    try:
        raw  = _call_gemini(prompt)
        items = json.loads(_extract_json(raw))
        results = []
        for item in items:
            if not isinstance(item, dict): continue
            p_type  = str(item.get("type", "MULTIPLE_CHOICE")).upper()
            options = item.get("options", [])
            options = [str(o).strip() for o in options if str(o).strip()] if isinstance(options, list) else []
            if p_type == "MULTIPLE_CHOICE": options = options[:5]
            elif p_type in ("OX", "SHORT_ANSWER"): options = []
            results.append({
                "question":            _truncate(str(item.get("question", "")), 80),
                "sentence_with_blank": None,
                "options":             options,
                "correct_answer":      _truncate(str(item.get("correct_answer", "")), 50),
                "explanation":         None,
                "type":                p_type,
                "scope":               _truncate(str(item.get("scope", "기타")), 12),
            })
        return results[:count]
    except Exception as e:
        logger.warning("LLM fallback failed: %s", e)
        return []


# ── 취약점 피드백 생성 ────────────────────────────────────────────────────────

def generate_analysis_feedback(weak_tags: List[dict]) -> str:
    if not weak_tags:
        return "아직 분석할 데이터가 부족합니다. 더 많은 게임을 플레이해 주세요!"
    top = weak_tags[:3]
    tag_lines = "\n".join(
        f"- {w['tag']} ({_tag_to_scope(w['tag'])}): 오답률 {w['wrong_rate']:.0f}%"
        for w in top
    )
    prompt = f"""학생의 영어 문법 취약점:
{tag_lines}

위 결과를 바탕으로 초중등 학생에게 맞는 학습 피드백을 3~5문장 한국어로 작성해 주세요.
격려 메시지 포함. 평문만 출력."""
    try:
        return _call_gemini(prompt).strip()
    except Exception as e:
        logger.error("feedback generation error: %s", e)
        return "피드백 생성 중 오류가 발생했습니다."


# ── 헬퍼 ─────────────────────────────────────────────────────────────────────

def _tag_to_scope(tag: str) -> str:
    return {
        "subject_verb_agreement": "수일치",
        "tense_present":          "현재시제",
        "tense_past":             "과거시제",
        "auxiliary_verb":         "조동사",
        "preposition":            "전치사",
        "article":                "관사",
        "comparative":            "비교급",
        "to_infinitive":          "to부정사",
        "passive_voice":          "수동태",
        "basic_word_order":       "문장구조",
    }.get(tag, "기타")
