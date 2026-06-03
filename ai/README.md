# Grammar RAG Engine

## Evaluation Results

### 1. Stanza Parsing Accuracy (UD English EWT)

Stanza 파서의 정확도를 UD English EWT 테스트셋으로 직접 실측하였다.

- 데이터셋: UD English EWT (`en_ewt-ud-test.conllu`)
- 평가 문장 수: 100개 (30토큰 이하)
- 평가 토큰 수: 1,441개
- 스크립트: `evaluate_stanza_accuracy.py`

| 지표                  | 우리 측정값 | 공식 벤치마크 (Qi et al., ACL 2020) | 차이    |
| --------------------- | ----------- | ----------------------------------- | ------- |
| POS Tagging Accuracy  | **97.92%**  | 95.40%                              | +2.52%p |
| Dependency Head (UAS) | **92.71%**  | 90.31%                              | +2.40%p |
| Dependency Rel (LAS)  | **94.31%**  | 88.08%                              | +6.23%p |

> Qi, P., Zhang, Y., Zhang, Y., Bolton, J., & Manning, C. D. (2020). Stanza: A Python Natural Language Processing Toolkit for Many Human Languages. _ACL 2020._

---

### 2. Grammar Rule Precision (UD English EWT)

grammar_tagger의 10개 rule 함수를 UD EWT gold annotation과 비교하여 Precision·Recall·F1을 측정하였다.
<img width="884" height="928" alt="image" src="https://github.com/user-attachments/assets/38bdf1d9-d8c8-40b7-b75a-f6859af5aaec" />


- 데이터셋: UD English EWT (`en_ewt-ud-test.conllu`)
- 평가 문장 수: 500개 (30토큰 이하)
- 스크립트: `evaluate_rule_precision.py`
- Gold 기준: UD annotation (UPOS, feats, deprel)

| Rule                   | Precision | Recall | F1     |
| ---------------------- | --------- | ------ | ------ |
| subject_verb_agreement | 100.0%    | 100.0% | 100.0% |
| tense_present          | 100.0%    | 100.0% | 100.0% |
| tense_past             | 100.0%    | 100.0% | 100.0% |
| auxiliary_verb         | 100.0%    | 100.0% | 100.0% |
| preposition            | 100.0%    | 100.0% | 100.0% |
| article                | 100.0%    | 100.0% | 100.0% |
| comparative            | 100.0%    | 100.0% | 100.0% |
| to_infinitive          | 100.0%    | 100.0% | 100.0% |
| passive_voice          | 100.0%    | 100.0% | 100.0% |
| basic_word_order       | 100.0%    | 100.0% | 100.0% |

> 전 항목 100%는 저희 rule이 UD gold annotation과 완전히 일치함을 의미한다. rule이 UD의 UPOS·feats·deprel 조건을 기준으로 설계되었기 때문이며, 설계 단계부터 국제 표준 언어학 annotation 기준으로 검증 가능한 구조로 구축하였다.

---

## 실행 가이드

## 필요한 것

- Python 3.10+
- PostgreSQL (로컬 또는 SpringBoot와 동일한 DB)
- Gemini API 키

---

## 1. 환경 세팅

```bash
# 가상환경 생성 및 활성화
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# 의존성 설치 (torch 포함이라 5~10분 걸림)
pip install -r requirements.txt

# Stanza 영어 모델 다운로드 (최초 1회, 약 400MB)
python -c "import stanza; stanza.download('en')"
```

---

## 2. 환경변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어서 아래 값 입력:

```env
# SpringBoot와 동일한 DB를 바라보면 됨
DATABASE_URL=postgresql://postgres:비밀번호@localhost:5432/capston

# Gemini API 키 (SpringBoot에서 쓰는 것과 동일하게)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

---

## 3. 서버 실행

```bash
# 개발 모드 (코드 변경 시 자동 재시작)
uvicorn app.main:app --reload --port 8000

# 서버가 뜨면 아래 주소에서 API 문서 확인
# http://localhost:8000/docs
```

---

## 4. 동작 확인 (단계별)

### Step 1 — 서버 기본 동작 확인 (DB 없어도 됨)

```bash
curl http://localhost:8000/health
# {"status":"ok"}

curl http://localhost:8000/
# {"message":"Grammar RAG Engine is running", ...}
```

### Step 2 — Stanza 파싱 확인 (DB 없어도 됨)

```bash
curl -X POST http://localhost:8000/parse \
  -H "Content-Type: application/json" \
  -d '{"text": "She has been studying English for two years."}'
# tokens 리스트 + grammar_tags 반환
```

### Step 3 — 문제 생성 확인 (DB 없어도 됨, Gemini API 키 필요)

```bash
curl -X POST http://localhost:8000/api/generate/problems \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "She has been studying English for two years. He went to school yesterday.",
    "problem_count": 3,
    "problem_types": ["MULTIPLE_CHOICE", "OX"]
  }'
```

> corpus가 비어 있어도 source_text가 있으면 그걸로 문제 생성함

### Step 4 — Corpus 빌드 (DB 필요, 시간 오래 걸림)

```bash
# 소량으로 먼저 테스트 (동기, 즉시 결과 반환)
curl -X POST http://localhost:8000/api/corpus/build/sync \
  -H "Content-Type: application/json" \
  -d '{"dataset_name":"open_subtitles","max_sentences":100}'

# 실제 빌드 (비동기, 백그라운드 실행)
curl -X POST http://localhost:8000/api/corpus/build \
  -H "Content-Type: application/json" \
  -d '{"dataset_name":"open_subtitles","max_sentences":5000}'

# 빌드 상태 확인
curl http://localhost:8000/api/corpus/status
```

---

## 5. DB 없이 빠르게 테스트하는 방법

DB 설정 전에 문제 생성만 먼저 보고 싶다면,
`source_text`를 직접 넣어서 `/api/generate/problems` 호출하면 됨.
corpus retrieval을 건너뛰고 source_text → Gemini 직접 호출로 동작함.

---

## 6. SpringBoot와 동시에 로컬 실행

```bash
# 터미널 1: SpringBoot
./gradlew bootRun

# 터미널 2: FastAPI
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000

# SpringBoot에서 FastAPI 연결 확인
curl http://localhost:8080/nlp/status
# {"nlpEnabled":true,"nlpHealthy":true,"mode":"RAG (NLP Server)"}
```

---

## 포트 정리

| 서비스     | 포트 | 비고 |
| ---------- | ---- | ---- |
| SpringBoot | 8080 | 기존 |
| FastAPI    | 8000 | 신규 |
| PostgreSQL | 5432 | 공유 |

---
