def has_subject_verb_agreement(tokens):
    has_subject = False
    has_third_singular_verb = False

    for token in tokens:
        if token["deprel"] == "nsubj":
            has_subject = True

        feats = token.get("feats") or ""

        if (
            token["upos"] in ["VERB", "AUX"]
            and "Person=3" in feats
            and "Number=Sing" in feats
        ):
            has_third_singular_verb = True

    return has_subject and has_third_singular_verb


def has_tense_present(tokens):
    for token in tokens:
        feats = token.get("feats") or ""

        if (
            token["upos"] == "VERB"
            and "Tense=Pres" in feats
        ):
            return True

    return False


def has_tense_past(tokens):
    for token in tokens:
        feats = token.get("feats") or ""

        if (
            token["upos"] == "VERB"
            and "Tense=Past" in feats
        ):
            return True

    return False


def has_auxiliary_verb(tokens):
    for token in tokens:
        if (
            token["upos"] == "AUX"
            or token["deprel"] == "aux"
        ):
            return True

    return False


def has_preposition(tokens):
    for token in tokens:
        if (
            token["upos"] == "ADP"
            or token["deprel"] == "case"
        ):
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
        current = tokens[i]
        nxt = tokens[i + 1]

        if (
            current["text"].lower() == "to"
            and nxt["upos"] == "VERB"
        ):
            return True

    return False


def has_passive_voice(tokens):
    has_aux_be = False
    has_past_participle = False

    for token in tokens:
        feats = token.get("feats") or ""

        if (
            token["lemma"] == "be"
            and token["upos"] == "AUX"
        ):
            has_aux_be = True

        if (
            token["upos"] == "VERB"
            and "VerbForm=Part" in feats
        ):
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


def extract_grammar_tags(tokens):
    tags = []

    if has_subject_verb_agreement(tokens):
        tags.append("subject_verb_agreement")

    if has_tense_present(tokens):
        tags.append("tense_present")

    if has_tense_past(tokens):
        tags.append("tense_past")

    if has_auxiliary_verb(tokens):
        tags.append("auxiliary_verb")

    if has_preposition(tokens):
        tags.append("preposition")

    if has_article(tokens):
        tags.append("article")

    if has_comparative(tokens):
        tags.append("comparative")

    if has_to_infinitive(tokens):
        tags.append("to_infinitive")

    if has_passive_voice(tokens):
        tags.append("passive_voice")

    if has_basic_word_order(tokens):
        tags.append("basic_word_order")

    return tags