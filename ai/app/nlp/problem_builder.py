"""
Rule-based Problem Builder
Stanza 태그 기반으로 정답/오답 후보를 서버가 직접 결정.
LLM은 이 결과를 받아서 해설만 생성.
"""
import random
from typing import List, Optional


# ── 태그별 오답 풀 (rule-based) ───────────────────────────────────────────────

_WRONG_CHOICES = {
    "auxiliary_verb": {
        "pool": ["can", "could", "will", "would", "should", "must", "may", "might"],
    },
    "preposition": {
        "pool": ["in", "on", "at", "by", "for", "with", "to", "from", "of", "about"],
    },
    "article": {
        "pool": ["a", "an", "the", ""],
    },
    "comparative": {
        "pool": ["more", "most", "less", "least", "very", "much"],
    },
    "to_infinitive": {
        "pool": ["for", "of", "in", "at"],
    },
    "passive_voice": {
        "pool": ["is", "are", "was", "were", "be", "been", "being"],
    },
}

# 3인칭 단수 현재형 예외
_THIRD_PERSON_SINGULAR = {
    "go": "goes", "do": "does", "have": "has", "be": "is",
}

# 태그별 문제 유형 가중치
# (multiple_choice, short_answer, ox) 비율
_TYPE_WEIGHTS = {
    "subject_verb_agreement": ["multiple_choice", "multiple_choice", "short_answer"],
    "tense_present":          ["multiple_choice", "multiple_choice", "short_answer"],
    "tense_past":             ["multiple_choice", "multiple_choice", "short_answer"],
    "auxiliary_verb":         ["multiple_choice", "short_answer", "ox"],
    "preposition":            ["multiple_choice", "short_answer", "ox"],
    "article":                ["multiple_choice", "short_answer", "ox"],
    "comparative":            ["multiple_choice", "short_answer", "ox"],
    "to_infinitive":          ["multiple_choice", "short_answer", "ox"],
    "passive_voice":          ["multiple_choice", "multiple_choice", "ox"],
    "basic_word_order":       ["ox", "ox", "multiple_choice"],
}


def build_problem_material(
    sentence: str,
    grammar_tags: List[str],
    tokens: List[dict],
) -> Optional[dict]:
    """
    문장 + grammar_tags + Stanza tokens → rule-based 문제 재료 생성
    """
    if not grammar_tags or not tokens:
        return None

    v1_tags = [
        "subject_verb_agreement", "tense_present", "tense_past",
        "auxiliary_verb", "preposition", "article",
        "comparative", "to_infinitive", "passive_voice", "basic_word_order",
    ]
    target_tag = next((t for t in v1_tags if t in grammar_tags), None)
    if not target_tag:
        return None

    target_token = _find_target_token(target_tag, tokens)
    if not target_token:
        return None

    answer = target_token["text"]

    # 문제 유형 결정 (태그별 가중치 기반 랜덤)
    weights = _TYPE_WEIGHTS.get(target_tag, ["multiple_choice", "short_answer", "ox"])
    problem_type = random.choice(weights)

    # OX 문제는 오답 불필요
    if problem_type == "ox":
        wrong_choices = []
    else:
        wrong_choices = _generate_wrong_choices(target_tag, answer, tokens)
        if not wrong_choices:
            # 오답 생성 실패 시 multiple_choice → short_answer로 downgrade
            if problem_type == "multiple_choice":
                problem_type = "short_answer"
            wrong_choices = []

    return {
        "sentence":       sentence,
        "target_grammar": target_tag,
        "target_word":    answer,
        "answer":         answer,
        "wrong_choices":  wrong_choices[:4],
        "problem_type":   problem_type,
    }


def _find_target_token(tag: str, tokens: List[dict]) -> Optional[dict]:
    """태그에 맞는 토큰 추출"""
    for token in tokens:
        feats  = token.get("feats") or ""
        upos   = token.get("upos", "")
        deprel = token.get("deprel", "")
        lemma  = token.get("lemma", "")
        text   = token.get("text", "")

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
    """태그 기반 오답 후보 생성 — 4개 반환"""
    answer_lower = answer.lower()
    wrongs = []

    if tag in ("tense_present", "tense_past", "subject_verb_agreement"):
        lemma = next(
            (t["lemma"] for t in tokens if t["text"].lower() == answer_lower),
            answer_lower,
        )
        return _conjugate_verb(lemma, answer_lower)

    elif tag in ("auxiliary_verb", "preposition", "article", "comparative",
                 "to_infinitive", "passive_voice"):
        pool = [w for w in _WRONG_CHOICES[tag]["pool"] if w.lower() != answer_lower]
        wrongs = random.sample(pool, min(4, len(pool)))

    return [w for w in wrongs if w and w.lower() != answer_lower][:4]


def _conjugate_verb(lemma: str, exclude: str) -> List[str]:
    """lemma(동사 원형)로 변형 생성 후 정답 제외 — 4개 반환"""
    forms = set()

    if lemma in _THIRD_PERSON_SINGULAR:
        forms.add(_THIRD_PERSON_SINGULAR[lemma])
    elif lemma.endswith(("s", "x", "z", "ch", "sh")):
        forms.add(lemma + "es")
    elif lemma.endswith("y") and len(lemma) > 1 and lemma[-2] not in "aeiou":
        forms.add(lemma[:-1] + "ies")
    else:
        forms.add(lemma + "s")

    forms.add(lemma)

    irregular = {
        "go":    ("went",    "gone"),
        "be":    ("was",     "been"),
        "have":  ("had",     "had"),
        "do":    ("did",     "done"),
        "make":  ("made",    "made"),
        "take":  ("took",    "taken"),
        "come":  ("came",    "come"),
        "see":   ("saw",     "seen"),
        "get":   ("got",     "gotten"),
        "give":  ("gave",    "given"),
        "know":  ("knew",    "known"),
        "think": ("thought", "thought"),
        "say":   ("said",    "said"),
        "run":   ("ran",     "run"),
        "eat":   ("ate",     "eaten"),
        "write": ("wrote",   "written"),
        "speak": ("spoke",   "spoken"),
        "bring": ("brought", "brought"),
        "buy":   ("bought",  "bought"),
        "teach": ("taught",  "taught"),
        "find":  ("found",   "found"),
        "leave": ("left",    "left"),
        "feel":  ("felt",    "felt"),
        "keep":  ("kept",    "kept"),
        "meet":  ("met",     "met"),
        "send":  ("sent",    "sent"),
        "tell":  ("told",    "told"),
        "hear":  ("heard",   "heard"),
        "stand": ("stood",   "stood"),
        "lose":  ("lost",    "lost"),
        "put":   ("put",     "put"),
    }

    if lemma in irregular:
        past, pp = irregular[lemma]
        forms.add(past)
        forms.add(pp)
    else:
        if lemma.endswith("e"):
            forms.add(lemma + "d")
        elif lemma.endswith("y") and len(lemma) > 1 and lemma[-2] not in "aeiou":
            forms.add(lemma[:-1] + "ied")
        else:
            forms.add(lemma + "ed")

    if lemma.endswith("e") and not lemma.endswith("ee"):
        forms.add(lemma[:-1] + "ing")
    else:
        forms.add(lemma + "ing")

    wrongs = [f for f in forms if f != exclude]
    return wrongs[:4]