"""
Rule-based Problem Builder
Stanza 태그 기반으로 정답/오답 후보를 서버가 직접 결정.
LLM은 이 결과를 받아서 문제 지시문과 해설만 생성.
"""
import random
from typing import List, Optional


# ── 태그별 오답 풀 (rule-based) ───────────────────────────────────────────────

_WRONG_CHOICES = {
    "tense_present": {
        "description": "현재시제",
        "transforms": ["past", "progressive", "perfect"],
    },
    "tense_past": {
        "description": "과거시제",
        "transforms": ["present", "progressive", "perfect"],
    },
    "subject_verb_agreement": {
        "description": "수일치",
        "transforms": ["number_flip"],
    },
    "auxiliary_verb": {
        "description": "조동사",
        "pool": ["can", "could", "will", "would", "should", "must", "may", "might"],
    },
    "preposition": {
        "description": "전치사",
        "pool": ["in", "on", "at", "by", "for", "with", "to", "from", "of", "about"],
    },
    "article": {
        "description": "관사",
        "pool": ["a", "an", "the", ""],  # 빈 문자열 = 관사 없음
    },
    "comparative": {
        "description": "비교급",
        "pool": ["more", "most", "less", "least", "very", "much"],
    },
    "to_infinitive": {
        "description": "to부정사",
        "transforms": ["gerund_swap"],
    },
    "passive_voice": {
        "description": "수동태",
        "pool": ["is", "are", "was", "were", "be", "been", "being"],
    },
    "basic_word_order": {
        "description": "문장구조",
        "transforms": ["word_order"],
    },
}

# 시제 변환 맵
_TENSE_FORMS = {
    "goes": {"past": "went", "progressive": "going", "perfect": "gone", "present": "go"},
    "go":   {"past": "went", "progressive": "going", "perfect": "gone", "present": "goes"},
    "is":   {"past": "was",  "progressive": "being", "perfect": "been", "present": "are"},
    "are":  {"past": "were", "progressive": "being", "perfect": "been", "present": "is"},
    "has":  {"past": "had",  "progressive": "having","perfect": "had",  "present": "have"},
    "have": {"past": "had",  "progressive": "having","perfect": "had",  "present": "has"},
    "does": {"past": "did",  "progressive": "doing", "perfect": "done", "present": "do"},
    "do":   {"past": "did",  "progressive": "doing", "perfect": "done", "present": "does"},
    "runs": {"past": "ran",  "progressive": "running","perfect": "run", "present": "run"},
    "run":  {"past": "ran",  "progressive": "running","perfect": "run", "present": "runs"},
    "was":  {"past": "were", "progressive": "being", "perfect": "been", "present": "is"},
    "were": {"past": "was",  "progressive": "being", "perfect": "been", "present": "are"},
}


def build_problem_material(
    sentence: str,
    grammar_tags: List[str],
    tokens: List[dict],
) -> Optional[dict]:
    """
    문장 + grammar_tags + Stanza tokens → rule-based 문제 재료 생성

    반환:
    {
        "sentence": str,
        "target_grammar": str,
        "target_word": str,       # 빈칸이 될 단어
        "answer": str,            # 정답
        "wrong_choices": List[str], # 오답 3개
        "problem_type": str,      # multiple_choice / ox / short_answer
    }
    실패 시 None 반환
    """
    if not grammar_tags or not tokens:
        return None

    # V1 태그 중 탐지된 첫 번째 태그로 문제 생성
    v1_tags = [
        "subject_verb_agreement", "tense_present", "tense_past",
        "auxiliary_verb", "preposition", "article",
        "comparative", "to_infinitive", "passive_voice", "basic_word_order",
    ]
    target_tag = next((t for t in v1_tags if t in grammar_tags), None)
    if not target_tag:
        return None

    # 태그에 맞는 타깃 토큰 추출
    target_token = _find_target_token(target_tag, tokens)
    if not target_token:
        return None

    answer = target_token["text"]
    wrong_choices = _generate_wrong_choices(target_tag, answer, tokens)

    if not wrong_choices:
        return None

    # OX 문제는 article, basic_word_order에 적용
    if target_tag in ("basic_word_order",):
        problem_type = "ox"
    else:
        problem_type = "multiple_choice"

    return {
        "sentence": sentence,
        "target_grammar": target_tag,
        "target_word": answer,
        "answer": answer,
        "wrong_choices": wrong_choices[:3],
        "problem_type": problem_type,
    }


def _find_target_token(tag: str, tokens: List[dict]) -> Optional[dict]:
    """태그에 맞는 토큰 추출"""
    for token in tokens:
        feats = token.get("feats") or ""
        upos = token.get("upos", "")
        deprel = token.get("deprel", "")
        lemma = token.get("lemma", "")
        text = token.get("text", "")

        if tag == "tense_present" and upos == "VERB" and "Tense=Pres" in feats:
            return token
        if tag == "tense_past" and upos == "VERB" and "Tense=Past" in feats:
            return token
        if tag == "subject_verb_agreement" and upos in ("VERB", "AUX") and "Person=3" in feats and "Number=Sing" in feats:
            return token
        if tag == "auxiliary_verb" and upos == "AUX":
            return token
        if tag == "preposition" and upos == "ADP":
            return token
        if tag == "article" and text.lower() in ("a", "an", "the"):
            return token
        if tag == "comparative" and ("Degree=Cmp" in feats or lemma in ("more", "less")):
            return token
        if tag == "to_infinitive" and text.lower() == "to":
            return token
        if tag == "passive_voice" and lemma == "be" and upos == "AUX":
            return token
        if tag == "basic_word_order" and deprel == "root":
            return token
    return None


def _generate_wrong_choices(tag: str, answer: str, tokens: List[dict]) -> List[str]:
    """태그 기반 오답 후보 생성"""
    answer_lower = answer.lower()
    wrongs = []

    if tag in ("tense_present", "tense_past", "subject_verb_agreement"):
        forms = _TENSE_FORMS.get(answer_lower, {})
        wrongs = list(set(forms.values()) - {answer_lower})
        if not wrongs:
            # fallback: 일반적인 동사 변형 오답
            wrongs = _verb_fallback(answer_lower)

    elif tag == "auxiliary_verb":
        pool = [w for w in _WRONG_CHOICES["auxiliary_verb"]["pool"] if w.lower() != answer_lower]
        wrongs = random.sample(pool, min(3, len(pool)))

    elif tag == "preposition":
        pool = [w for w in _WRONG_CHOICES["preposition"]["pool"] if w.lower() != answer_lower]
        wrongs = random.sample(pool, min(3, len(pool)))

    elif tag == "article":
        pool = [w for w in _WRONG_CHOICES["article"]["pool"] if w.lower() != answer_lower]
        wrongs = pool[:3]

    elif tag == "comparative":
        pool = [w for w in _WRONG_CHOICES["comparative"]["pool"] if w.lower() != answer_lower]
        wrongs = random.sample(pool, min(3, len(pool)))

    elif tag == "to_infinitive":
        # to부정사 → 동명사(-ing) vs 원형 혼동
        # 다음 토큰이 동사인지 확인
        wrongs = ["for", "of", "in"]

    elif tag == "passive_voice":
        pool = [w for w in _WRONG_CHOICES["passive_voice"]["pool"] if w.lower() != answer_lower]
        wrongs = random.sample(pool, min(3, len(pool)))

    elif tag == "basic_word_order":
        # OX 문제용 — 어순이 맞는지 틀린지만 판단
        wrongs = []  # OX는 오답 없음

    return [w for w in wrongs if w and w.lower() != answer_lower][:3]


def _verb_fallback(verb: str) -> List[str]:
    """TENSE_FORMS에 없는 동사의 fallback 오답"""
    results = []
    # -s 붙이거나 제거
    if verb.endswith("s") and len(verb) > 2:
        results.append(verb[:-1])
    else:
        results.append(verb + "s")
    # -ing
    if verb.endswith("e"):
        results.append(verb[:-1] + "ing")
    else:
        results.append(verb + "ing")
    # -ed
    if verb.endswith("e"):
        results.append(verb + "d")
    else:
        results.append(verb + "ed")
    return results

