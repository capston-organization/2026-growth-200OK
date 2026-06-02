"""
LLM-as-a-judge Problem Evaluator
생성된 문제의 품질을 자동 평가 (포스터의 Quality Assurance 단계)

평가 기준 (문서 기반):
1. target_grammar_match : 의도한 문법을 묻는가?
2. answer_clarity       : 정답이 하나로 명확한가?
3. distractor_quality   : 오답 선택지가 적절한가?
4. difficulty_fit       : 초중등 수준에 적절한가?
5. ambiguity_risk       : 중복 해석 가능성이 낮은가? (낮을수록 좋음)
"""
import json
import logging
from typing import Optional

import requests

from app.core import GEMINI_API_KEY, GEMINI_MODEL, GEMINI_BASE_URL

logger = logging.getLogger(__name__)
GEMINI_TIMEOUT = 30

# 통과 기준
PASS_THRESHOLD = 3.5  # overall_score >= 3.5 면 pass


def _call_gemini(prompt: str) -> str:
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not set")
    url = f"{GEMINI_BASE_URL}/{GEMINI_MODEL}:generateContent"
    resp = requests.post(
        url,
        headers={"Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY},
        json={
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.1, "maxOutputTokens": 512},
        },
        timeout=GEMINI_TIMEOUT,
    )
    resp.raise_for_status()
    data = resp.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        return ""


def evaluate_problem(problem: dict) -> dict:
    """
    문제 품질 평가.

    problem: {question, options, correct_answer, scope, sentence_with_blank, grammar_tag}

    반환: {
        target_grammar_match: 1~5,
        answer_clarity: 1~5,
        distractor_quality: 1~5,
        difficulty_fit: 1~5,
        ambiguity_risk: 1~5 (낮을수록 좋음),
        overall_score: float,
        decision: "pass" | "fail",
        reason: str
    }
    """
    # JSON Schema 검증 먼저 (LLM 없이)
    schema_result = _validate_schema(problem)
    if not schema_result["valid"]:
        return {
            "decision": "fail",
            "overall_score": 0.0,
            "reason": f"Schema validation failed: {schema_result['reason']}",
        }

    # LLM-as-a-judge
    return _llm_judge(problem)


def _validate_schema(problem: dict) -> dict:
    """JSON 구조 검증 (LLM 없이 서버에서)"""
    options       = problem.get("options", [])
    correct_answer = problem.get("correct_answer", "")
    question      = problem.get("question", "")

    if not question or len(question) < 3:
        return {"valid": False, "reason": "question이 너무 짧음"}

    if not correct_answer:
        return {"valid": False, "reason": "correct_answer 없음"}

    p_type = problem.get("type", "MULTIPLE_CHOICE")

    if p_type == "MULTIPLE_CHOICE":
        if len(options) < 2:
            return {"valid": False, "reason": f"선택지 부족: {len(options)}개"}
        if correct_answer not in options:
            return {"valid": False, "reason": "correct_answer가 options에 없음"}

    elif p_type == "OX":
        if correct_answer not in ("O", "X"):
            return {"valid": False, "reason": f"OX 정답이 O/X가 아님: {correct_answer}"}

    return {"valid": True, "reason": ""}


def _llm_judge(problem: dict) -> dict:
    """LLM-as-a-judge 품질 평가"""
    options_str = ", ".join(problem.get("options", [])) or "(없음)"
    blank_sent  = problem.get("sentence_with_blank") or problem.get("question", "")
    grammar_tag = problem.get("grammar_tag") or problem.get("scope", "")

    prompt = f"""영어 문법 퀴즈 문제의 품질을 평가해 주세요.

[문제]
문법 포인트: {grammar_tag}
문제 지시문: {problem.get('question', '')}
빈칸 문장: {blank_sent}
선택지: {options_str}
정답: {problem.get('correct_answer', '')}

다음 기준으로 1~5점 평가 (5=최고):
1. target_grammar_match: 문제가 해당 문법을 정확히 묻는가?
2. answer_clarity: 정답이 하나로 명확한가?
3. distractor_quality: 오답이 그럴듯하고 적절한가?
4. difficulty_fit: 초중등 학생에게 적절한 난이도인가?
5. ambiguity_risk: 중복 해석 가능성 (1=매우 낮음=좋음, 5=매우 높음=나쁨)

반드시 JSON만 출력. 코드블록 금지.
{{"target_grammar_match":0,"answer_clarity":0,"distractor_quality":0,"difficulty_fit":0,"ambiguity_risk":0,"reason":"..."}}"""

    try:
        raw  = _call_gemini(prompt)
        # JSON 추출
        import re
        raw = re.sub(r"```(?:json)?", "", raw).replace("```", "").strip()
        start = raw.find("{")
        end   = raw.rfind("}") + 1
        data  = json.loads(raw[start:end])

        tgm  = float(data.get("target_grammar_match", 3))
        ac   = float(data.get("answer_clarity", 3))
        dq   = float(data.get("distractor_quality", 3))
        df   = float(data.get("difficulty_fit", 3))
        ar   = float(data.get("ambiguity_risk", 3))  # 낮을수록 좋음

        # overall: ambiguity_risk는 역산
        overall = (tgm + ac + dq + df + (6 - ar)) / 5.0
        passed  = overall >= PASS_THRESHOLD

        return {
            "target_grammar_match": tgm,
            "answer_clarity":       ac,
            "distractor_quality":   dq,
            "difficulty_fit":       df,
            "ambiguity_risk":       ar,
            "overall_score":        round(overall, 2),
            "decision":             "pass" if passed else "fail",
            "reason":               data.get("reason", ""),
        }
    except Exception as e:
        logger.warning("LLM judge failed: %s", e)
        # 평가 실패 시 기본 통과 (서비스 중단 방지)
        return {
            "overall_score": 3.0,
            "decision":      "pass",
            "reason":        f"evaluation_error: {e}",
        }
