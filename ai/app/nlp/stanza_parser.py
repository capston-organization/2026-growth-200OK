import stanza

# nlp(text)시 실행됨
nlp = stanza.Pipeline(    
  lang="en",                                          # 영어 분석
  processors = "tokenize, pos, lemma, depparse",     # 단어 분리, 품사 태깅, 원형 복원, 의존구문 분석(문장구조)
  use_gpu = False
)

# 문장 하나 받아 분석하는 함수
def parse_sentence(text: str):
  doc = nlp(text)                 # 입력 문장을 분석하여 구조화된 객체를 생성함

  result = []
  for sentence in doc.sentences:  # 문장 단위 반복
    for word in sentence.words:
      result.append({
        "id": word.id,            # 단어 위치
        "text": word.text,        # 실제 단어
        "lemma": word.lemma,      # 원형           예)went → go
        "upos": word.upos,        # universal 품사 예)VERB, NOUN
        "xpos": word.xpos,        # 상세 품사       예) NN, VBD
        "head": word.head,        # 이 단어가 의존하는 부모 단어 id
        "deprel": word.deprel,    # 관계
        "feats": word.feats,      # 문법 정보
      })
  return result                   # 단어 단위 문법 정보 리스트