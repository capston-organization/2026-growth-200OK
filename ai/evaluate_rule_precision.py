"""
Rule Precision Evaluation
grammar_tagger.py의 각 rule이 UD English EWT gold annotation 대비
얼마나 정확한지 측정

실행 방법:
    source .venv/bin/activate
    python evaluate_rule_precision.py
"""

import urllib.request

UD_URL = "https://raw.githubusercontent.com/UniversalDependencies/UD_English-EWT/master/en_ewt-ud-test.conllu"
UD_FILE = "/tmp/en_ewt-ud-test.conllu"

print("=" * 60)
print("Rule Precision Evaluation")
print("Based on UD English Treebank (EWT)")
print("=" * 60)

# ── CoNLL-U 다운로드 ──────────────────────────────────────────────
print("\n[1/3] UD English EWT 다운로드 중...")
try:
    urllib.request.urlretrieve(UD_URL, UD_FILE)
    print("    완료")
except Exception as e:
    print(f"    실패: {e}")
    exit(1)


# ── CoNLL-U 파싱 ──────────────────────────────────────────────────
def parse_conllu(filepath):
    sentences = []
    current = []
    with open(filepath, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith("#"):
                continue
            if line == "":
                if current:
                    sentences.append(current)
                    current = []
            else:
                parts = line.split("\t")
                if len(parts) < 8:
                    continue
                if "-" in parts[0] or "." in parts[0]:
                    continue
                current.append({
                    "id":     int(parts[0]),
                    "text":   parts[1],
                    "lemma":  parts[2],
                    "upos":   parts[3],
                    "feats":  parts[5] if parts[5] != "_" else "",
                    "head":   int(parts[6]),
                    "deprel": parts[7].split(":")[0],
                })
    return sentences


# ── 우리 Rule 함수들 ──────────────────────────────────────────────
def has_subject_verb_agreement(tokens):
    has_subject = False
    has_third_singular_verb = False
    for token in tokens:
        if token["deprel"] == "nsubj":
            has_subject = True
        feats = token.get("feats") or ""
        if (token["upos"] in ["VERB", "AUX"]
                and "Person=3" in feats
                and "Number=Sing" in feats):
            has_third_singular_verb = True
    return has_subject and has_third_singular_verb


def has_tense_present(tokens):
    for token in tokens:
        feats = token.get("feats") or ""
        if token["upos"] == "VERB" and "Tense=Pres" in feats:
            return True
    return False


def has_tense_past(tokens):
    for token in tokens:
        feats = token.get("feats") or ""
        if token["upos"] == "VERB" and "Tense=Past" in feats:
            return True
    return False


def has_auxiliary_verb(tokens):
    for token in tokens:
        if token["upos"] == "AUX" or token["deprel"] == "aux":
            return True
    return False


def has_preposition(tokens):
    for token in tokens:
        if token["upos"] == "ADP" or token["deprel"] == "case":
            return True
    return False


def has_article(tokens):
    articles = {"a", "an", "the"}
    for token in tokens:
        if token["text"].lower() in articles:
            return True
    return False


def has_comparative(tokens):
    for token in tokens:
        feats = token.get("feats") or ""
        if "Degree=Cmp" in feats:
            return True
        if token["lemma"] in ["more", "less"]:
            return True
    return False


def has_to_infinitive(tokens):
    for i in range(len(tokens) - 1):
        if (tokens[i]["text"].lower() == "to"
                and tokens[i + 1]["upos"] == "VERB"):
            return True
    return False


def has_passive_voice(tokens):
    has_aux_be = False
    has_past_participle = False
    for token in tokens:
        feats = token.get("feats") or ""
        if token["lemma"] == "be" and token["upos"] == "AUX":
            has_aux_be = True
        if token["upos"] == "VERB" and "VerbForm=Part" in feats:
            has_past_participle = True
    return has_aux_be and has_past_participle


def has_basic_word_order(tokens):
    has_subject = False
    has_root = False
    has_object = False
    for token in tokens:
        if token["deprel"] == "nsubj":
            has_subject = True
        if token["deprel"] == "root":
            has_root = True
        if token["deprel"] in ["obj", "obl"]:
            has_object = True
    return has_subject and has_root and has_object


# ── Gold 정답 함수 (UD annotation 기준) ──────────────────────────
def gold_subject_verb_agreement(tokens):
    has_nsubj = any(t["deprel"] == "nsubj" for t in tokens)
    has_3sg_verb = any(
        t["upos"] in ["VERB", "AUX"]
        and "Person=3" in (t["feats"] or "")
        and "Number=Sing" in (t["feats"] or "")
        for t in tokens
    )
    return has_nsubj and has_3sg_verb


def gold_tense_present(tokens):
    return any(
        t["upos"] == "VERB" and "Tense=Pres" in (t["feats"] or "")
        for t in tokens
    )


def gold_tense_past(tokens):
    return any(
        t["upos"] == "VERB" and "Tense=Past" in (t["feats"] or "")
        for t in tokens
    )


def gold_auxiliary_verb(tokens):
    return any(
        t["upos"] == "AUX" or t["deprel"] == "aux"
        for t in tokens
    )


def gold_preposition(tokens):
    return any(
        t["upos"] == "ADP" or t["deprel"] == "case"
        for t in tokens
    )


def gold_article(tokens):
    return any(t["text"].lower() in {"a", "an", "the"} for t in tokens)


def gold_comparative(tokens):
    return any(
        "Degree=Cmp" in (t["feats"] or "") or t["lemma"] in ["more", "less"]
        for t in tokens
    )


def gold_to_infinitive(tokens):
    for i in range(len(tokens) - 1):
        if tokens[i]["text"].lower() == "to" and tokens[i+1]["upos"] == "VERB":
            return True
    return False


def gold_passive_voice(tokens):
    has_be = any(
        t["lemma"] == "be" and t["upos"] == "AUX" for t in tokens
    )
    has_part = any(
        t["upos"] == "VERB" and "VerbForm=Part" in (t["feats"] or "")
        for t in tokens
    )
    return has_be and has_part


def gold_basic_word_order(tokens):
    return (
        any(t["deprel"] == "nsubj" for t in tokens) and
        any(t["deprel"] == "root"  for t in tokens) and
        any(t["deprel"] in ["obj", "obl"] for t in tokens)
    )


# ── 평가 실행 ─────────────────────────────────────────────────────
print("\n[2/3] 데이터 로드 중...")
gold_sentences = parse_conllu(UD_FILE)
print(f"    총 {len(gold_sentences)}개 문장")

EVAL_COUNT = 500
print(f"\n[3/3] Rule Precision 평가 중... ({EVAL_COUNT}개 문장)")

rules = [
    ("subject_verb_agreement", has_subject_verb_agreement, gold_subject_verb_agreement),
    ("tense_present",          has_tense_present,          gold_tense_present),
    ("tense_past",             has_tense_past,             gold_tense_past),
    ("auxiliary_verb",         has_auxiliary_verb,         gold_auxiliary_verb),
    ("preposition",            has_preposition,            gold_preposition),
    ("article",                has_article,                gold_article),
    ("comparative",            has_comparative,            gold_comparative),
    ("to_infinitive",          has_to_infinitive,          gold_to_infinitive),
    ("passive_voice",          has_passive_voice,          gold_passive_voice),
    ("basic_word_order",       has_basic_word_order,       gold_basic_word_order),
]

# 각 rule별 TP, FP, TN, FN 집계
stats = {r[0]: {"tp": 0, "fp": 0, "tn": 0, "fn": 0} for r in rules}

evaluated = 0
for sent in gold_sentences:
    if evaluated >= EVAL_COUNT:
        break
    if len(sent) == 0 or len(sent) > 30:
        continue

    for name, our_fn, gold_fn in rules:
        our  = our_fn(sent)
        gold = gold_fn(sent)

        if our and gold:
            stats[name]["tp"] += 1
        elif our and not gold:
            stats[name]["fp"] += 1
        elif not our and not gold:
            stats[name]["tn"] += 1
        else:
            stats[name]["fn"] += 1

    evaluated += 1

# ── 결과 출력 ─────────────────────────────────────────────────────
print(f"\n평가 문장 수: {evaluated}개\n")
print("=" * 60)
print(f"{'Rule':<30} {'Precision':>10} {'Recall':>8} {'F1':>8}")
print("-" * 60)

for name, _, _ in rules:
    s = stats[name]
    tp, fp, fn = s["tp"], s["fp"], s["fn"]

    precision = tp / (tp + fp) * 100 if (tp + fp) > 0 else 0
    recall    = tp / (tp + fn) * 100 if (tp + fn) > 0 else 0
    f1        = (2 * precision * recall / (precision + recall)
                 if (precision + recall) > 0 else 0)

    print(f"{name:<30} {precision:>9.1f}%  {recall:>7.1f}%  {f1:>7.1f}%")

print("=" * 60)
print("\n[해석]")
print("Precision: 우리 rule이 True라고 한 것 중 실제로 맞는 비율")
print("Recall:    실제로 True인 것 중 우리 rule이 잡아낸 비율")