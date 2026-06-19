# SpringBoot ↔ FastAPI 연동 가이드

## 핵심 엔드포인트

FastAPI NLP 서버 주소: `NLP_SERVER_URL` 환경변수로 주입 (예: `http://localhost:8000`)

### POST `/api/generate/problems` — 문제 생성

**SpringBoot → FastAPI 요청 body:**

```json
{
  "source_text": "사용자가 업로드한 텍스트 (선택)",
  "grammar_tags": ["tense_past", "auxiliary_verb"],
  "problem_count": 5,
  "problem_types": ["MULTIPLE_CHOICE", "OX", "SHORT_ANSWER"],
  "personalization_context": "{\"weakTop3\":[\"과거시제\",\"조동사\"]}"
}
```

**FastAPI 응답:**

```json
{
  "problems": [
    {
      "question": "다음 문장에서 올바른 시제를 고르시오.",
      "options": ["ran", "run", "running", "runs", "runned"],
      "correct_answer": "ran",
      "type": "MULTIPLE_CHOICE",
      "scope": "과거시제"
    }
  ],
  "source_sentences": ["She ran to school yesterday."],
  "grammar_tags_used": ["tense_past"]
}
```

### POST `/api/analysis/weak-tags` — 취약 태그 분석

**요청:**

```json
{
  "wrong_problems": [
    {
      "question": "She ___ a doctor.",
      "correct_answer": "is",
      "user_answer": "are",
      "scope": "수일치"
    }
  ]
}
```

**응답:**

```json
{
  "weak_tags": [
    { "tag": "subject_verb_agreement", "wrong_count": 3, "wrong_rate": 60.0 }
  ],
  "recommended_grammar_tags": ["subject_verb_agreement"],
  "feedback_summary": "수일치 규칙을 중점적으로 복습하세요..."
}
```

## SpringBoot NlpClient.java 추가 위치

`game/client/NlpClient.java` 생성:

```java
@Component
@RequiredArgsConstructor
public class NlpClient {
    private final WebClient.Builder webClientBuilder;

    @Value("${nlp.server.url:http://localhost:8000}")
    private String nlpServerUrl;

    public List<GeneratedProblemDto> generateProblems(
            String sourceText, List<String> grammarTags,
            int count, List<ProblemType> types, String personalizationContext) {
        // POST /api/generate/problems
        Map<String, Object> body = Map.of(
            "source_text", sourceText != null ? sourceText : "",
            "grammar_tags", grammarTags != null ? grammarTags : List.of(),
            "problem_count", count,
            "problem_types", types.stream().map(Enum::name).toList(),
            "personalization_context", personalizationContext != null ? personalizationContext : ""
        );
        // WebClient 호출 후 problems 필드 파싱
        ...
    }
}
```

`application.yml`에 추가:

```yaml
nlp:
  server:
    url: ${NLP_SERVER_URL:http://localhost:8000}
```

## Corpus 최초 빌드 절차

서버 배포 후 최초 1회 실행:

```bash
# open_subtitles 5000문장 빌드 (약 20분 소요)
curl -X POST http://your-nlp-server:8000/api/corpus/build \
  -H "Content-Type: application/json" \
  -d '{"dataset_name":"open_subtitles","max_sentences":5000}'

# 빌드 상태 확인
curl http://your-nlp-server:8000/api/corpus/status
```
