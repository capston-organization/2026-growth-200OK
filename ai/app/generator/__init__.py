"""
LLM Generator
rule-based problem_builder가 만든 재료를 받아서
LLM은 해설만 생성 (question은 서버에서 직접 조합)
"""
import json
import logging
import re
import random
from typing import List, Optional

import requests

from app.core import GEMINI_API_KEY, GEMINI_MODEL, GEMINI_BASE_URL

logger = logging.getLogger(__name__)

MAX_SOURCE_CHARS = 8000
GEMINI_TIMEOUT = 60

# 오답 부족 시 fallback 선택지 풀
_FALLBACK_CHOICES = {
    "verb":        ["go", "goes", "went", "going", "gone", "to go", "have gone", "had gone"],
    "auxiliary":   ["can", "could", "will", "would", "should", "must", "may", "might"],
    "preposition": ["in", "on", "at", "by", "for", "with", "to", "from"],
    "article":     ["a", "an", "the", "some"],
    "default":     ["is", "are", "was", "were", "be"],
}


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


def _remove_markdown(text: str) -> str:
    """마크다운 기호 제거 — ___ 빈칸 표시는 보존"""
    BLANK_PLACEHOLDER = "\x00BLANK\x00"
    text = text.replace("___", BLANK_PLACEHOLDER)
    text = re.sub(r"\*{1,3}(.*?)\*{1,3}", r"\1", text, flags=re.DOTALL)
    text = re.sub(r"(?<!\x00)_{2}(.+?)_{2}(?!\x00)", r"\1", text, flags=re.DOTALL)
    text = re.sub(r"(?<!\x00)_([^_]+?)_(?!\x00)", r"\1", text, flags=re.DOTALL)
    text = re.sub(r"^#{1,6}\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\[(.*?)\]\(.*?\)", r"\1", text)
    text = text.replace("*", "")
    text = text.replace(BLANK_PLACEHOLDER, "___")
    return text.strip()


def _make_blank_sentence(sentence: str, answer: str) -> str:
    """대소문자 무시하고 정답을 ___ 로 교체"""
    return re.sub(re.escape(answer), "___", sentence, count=1, flags=re.IGNORECASE)


def _ensure_five_choices(answer: str, wrong_choices: List[str], target_grammar: str) -> List[str]:
    """
    오답이 4개 미만일 때 fallback 풀에서 보충해서 반드시 5개(정답1+오답4) 반환
    """
    wrongs = list(wrong_choices[:4])

    # fallback 풀 선택
    if target_grammar in ("tense_present", "tense_past", "subject_verb_agreement"):
        fallback = _FALLBACK_CHOICES["verb"]
    elif target_grammar == "auxiliary_verb":
        fallback = _FALLBACK_CHOICES["auxiliary"]
    elif target_grammar == "preposition":
        fallback = _FALLBACK_CHOICES["preposition"]
    elif target_grammar == "article":
        fallback = _FALLBACK_CHOICES["article"]
    else:
        fallback = _FALLBACK_CHOICES["default"]

    # 정답·기존 오답과 겹치지 않는 fallback으로 보충
    for w in fallback:
        if len(wrongs) >= 4:
            break
        if w.lower() != answer.lower() and w not in wrongs:
            wrongs.append(w)

    # 그래도 부족하면 숫자로 채우기 (최후 수단)
    idx = 1
    while len(wrongs) < 4:
        placeholder = f"option{idx}"
        if placeholder not in wrongs:
            wrongs.append(placeholder)
        idx += 1

    all_choices = [answer] + wrongs[:4]
    random.shuffle(all_choices)
    return all_choices


# ── 핵심: question은 서버에서 직접 조합, LLM은 해설만 ─────────────────────────

def wrap_problem_with_llm(material: dict) -> Optional[dict]:
    sentence       = material["sentence"]
    answer         = material["answer"]
    wrong_choices  = material["wrong_choices"]
    target_grammar = material["target_grammar"]
    problem_type   = material["problem_type"]

    # ── 문제 유형별 처리 ─────────────────────────────────────────────────────

    if problem_type == "ox":
        is_correct = random.choice([True, False])
        if is_correct:
            question = f"다음 문장의 {_tag_to_scope(target_grammar)}이 올바른가요? {sentence}"
            correct_answer = "O"
        else:
            if wrong_choices:
                wrong_word = random.choice(wrong_choices)
                wrong_sentence = re.sub(
                    re.escape(answer), wrong_word, sentence, count=1, flags=re.IGNORECASE
                )
                question = f"다음 문장의 {_tag_to_scope(target_grammar)}이 올바른가요? {wrong_sentence}"
            else:
                question = f"다음 문장의 {_tag_to_scope(target_grammar)}이 올바른가요? {sentence}"
                is_correct = True
            correct_answer = "X"
        all_choices = []
        sentence_with_blank = sentence

    elif problem_type == "short_answer":
        sentence_with_blank = _make_blank_sentence(sentence, answer)
        question = f"{sentence_with_blank} 빈칸에 알맞은 말을 직접 쓰시오."
        correct_answer = answer
        all_choices = []

    else:
        # MULTIPLE_CHOICE — 반드시 5개 보장
        sentence_with_blank = _make_blank_sentence(sentence, answer)
        question = f"{sentence_with_blank} 빈칸에 알맞은 말을 고르시오."
        correct_answer = answer
        all_choices = _ensure_five_choices(answer, wrong_choices, target_grammar)

    # ── LLM: 해설만 생성 ─────────────────────────────────────────────────────
    prompt = f"""영어 문법 문제의 해설을 작성해 주세요.

[문법 포인트] {_tag_to_scope(target_grammar)}
[원래 문장] {sentence}
[정답] {correct_answer}

[요구사항]
- explanation: 초중등 눈높이 한국어 2~3문장.
- 문장에서 '{answer}' 부분이 왜 {_tag_to_scope(target_grammar)} 문법과 관련있는지 설명.
- 마크다운(**,*,##,__) 절대 사용 금지. 일반 텍스트만.

JSON만 출력. 코드블록 금지.
{{"explanation":"..."}}"""

    try:
        raw = _call_gemini(prompt)
        parsed = json.loads(_extract_json(raw))
        explanation = _remove_markdown(_truncate(parsed.get("explanation", ""), 300))
    except Exception as e:
        logger.warning("LLM wrap failed: %s", e)
        explanation = f"정답은 '{correct_answer}'입니다. {_tag_to_scope(target_grammar)} 문법 포인트입니다."

    type_map = {
        "multiple_choice": "MULTIPLE_CHOICE",
        "short_answer":    "SHORT_ANSWER",
        "ox":              "OX",
    }

    return {
        "question":            question,
        "sentence_with_blank": sentence_with_blank if problem_type != "ox" else None,
        "options":             all_choices,
        "correct_answer":      correct_answer,
        "explanation":         explanation,
        "type":                type_map.get(problem_type, "MULTIPLE_CHOICE"),
        "scope":               _tag_to_scope(target_grammar),
    }


# ── 배치 생성 ─────────────────────────────────────────────────────────────────

def generate_problems(
    source_sentences: List[str],
    problem_count: int,
    problem_types: List[str],
    grammar_tags: Optional[List[str]] = None,
    personalization_context: Optional[str] = None,
) -> List[dict]:
    from app.nlp.stanza_parser import parse_sentence
    from app.nlp.grammar_tagger import extract_grammar_tags
    from app.nlp.problem_builder import build_problem_material

    # 사용자 선택 유형 정규화
    type_map = {
        "multiple_choice": "multiple_choice",
        "MULTIPLE_CHOICE": "multiple_choice",
        "ox":              "ox",
        "OX":              "ox",
        "short_answer":    "short_answer",
        "SHORT_ANSWER":    "short_answer",
    }
    normalized_types = [type_map.get(t, "multiple_choice") for t in problem_types] if problem_types else []

    results = []

    for sentence in source_sentences:
        if len(results) >= problem_count:
            break
        try:
            tokens = parse_sentence(sentence)
            tags   = extract_grammar_tags(tokens)

            if grammar_tags:
                tags = [t for t in tags if t in grammar_tags] or tags

            material = build_problem_material(sentence, tags, tokens)
            if material is None:
                continue

            # 사용자가 선택한 problem_types 반영
            if normalized_types:
                material["problem_type"] = random.choice(normalized_types)

            wrapped = wrap_problem_with_llm(material)
            if wrapped:
                results.append(wrapped)
        except Exception as e:
            logger.warning("Problem generation failed for sentence: %s | %s", sentence[:50], e)

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
    source_block = "\n".join(f"- {s}" for s in source_sentences)
    source_block = _truncate(source_block, MAX_SOURCE_CHARS)
    type_str     = ", ".join(problem_types) if problem_types else "MULTIPLE_CHOICE, OX, SHORT_ANSWER"
    tag_hint     = f"\n[Grammar focus]\n{', '.join(grammar_tags)}" if grammar_tags else ""
    personal     = f"\n[개인화 컨텍스트]\n{personalization_context}" if personalization_context else ""

    prompt = f"""아래 영어 문장들을 학습 자료로 정확히 {count}개의 퀴즈 문제를 만들어 주세요.

유형: {type_str}
- MULTIPLE_CHOICE: 선택지 반드시 정확히 5개. 기호 없이 내용만. 빈칸은 ___(밑줄 3개)로 표시.
- OX: 정답은 "O" 또는 "X"만. 문법 맞는지 판단.
- SHORT_ANSWER: 빈칸에 직접 쓰는 문제. 선택지 없음([]).

[규칙]
- 사용자가 선택한 유형({type_str})만 사용하세요.
- MULTIPLE_CHOICE는 반드시 선택지 5개. 4개나 6개 절대 금지.
- question: 80자 이내. MULTIPLE_CHOICE/SHORT_ANSWER는 반드시 ___ 빈칸 포함.
- explanation: 마크다운 절대 금지. 일반 텍스트만.
- JSON 배열만 출력. 설명 금지.
{tag_hint}{personal}

[학습 자료]
{source_block}"""

    try:
        raw   = _call_gemini(prompt)
        items = json.loads(_extract_json(raw))
        results = []
        for item in items:
            if not isinstance(item, dict): continue
            p_type  = str(item.get("type", "MULTIPLE_CHOICE")).upper()
            options = item.get("options", [])
            options = [str(o).strip() for o in options if str(o).strip()] if isinstance(options, list) else []
            if p_type == "MULTIPLE_CHOICE":
                # 5개 미만이면 fallback으로 보충
                while len(options) < 5:
                    options.append(f"option{len(options)+1}")
                options = options[:5]
            elif p_type in ("OX", "SHORT_ANSWER"):
                options = []
            results.append({
                "question":            _remove_markdown(_truncate(str(item.get("question", "")), 80)),
                "sentence_with_blank": None,
                "options":             options,
                "correct_answer":      _truncate(str(item.get("correct_answer", "")), 50),
                "explanation":         _remove_markdown(_truncate(str(item.get("explanation", "")), 300)),
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
격려 메시지 포함. 마크다운(**,*,##,__) 절대 사용 금지. 일반 텍스트만."""
    try:
        return _remove_markdown(_call_gemini(prompt).strip())
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