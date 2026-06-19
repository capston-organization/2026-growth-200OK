# Learning Village (200OK)

---

## 프로젝트 설명 (Project Description)

**Learning Village**는 AI 기반 영어 학습 게임 플랫폼입니다.

사용자가 PDF·텍스트 학습 자료를 업로드하면 **Google Gemini API**(및 선택적 NLP RAG 서버)가 O/X, 5지선다, 단답형 문제를 생성하고, **Phaser** 미니게임으로 학습합니다. Google OAuth 로그인, 학습 분석·오답 노트, 스트릭 기능, 그리고 게이미피케이션 기능 등을 제공합니다.

| 항목 | 내용 |
|------|------|
| **대상 사용자** | 영어를 학습하고 싶은 초/중등 학생 |
| **핵심 기능** | AI 문제 생성, Phaser 게임 플레이, 학습 분석, 복습 게임 |
| **저장소** | `git clone` 후 Gradle Wrapper·npm으로 빌드·실행 가능 |

---

## Source Code 설명

### 저장소 구조

```
2026-growth-200OK/
├── backend/                 # Spring Boot REST API (Java 17)
├── front/WebPage/           # React + Vite 프론트엔드 + Phaser 게임
├── ai/                      # FastAPI 기반 Grammar RAG Engine (선택 실행)
├── docs/GrounRule.MD        # 팀 협업 규칙
└── .github/workflows/       # CI/CD (develop → EC2)
```

### Backend (`backend/`)

Spring Boot 3.3.4 기반 REST API. 패키지는 도메인별로 분리되어 있습니다.

| 패키지 | 역할 |
|--------|------|
| `auth/` | Google OAuth 2.0, JWT 발급·갱신, Redis 기반 Refresh Token·블랙리스트 |
| `user/` | 사용자 프로필, 온보딩, 스트릭 |
| `game/` | 게임 CRUD, PDF/TXT 소스 업로드, Gemini·NLP 문제 생성, 답안 제출 |
| `analysis/` | 학습 개요·상세 분석, 오답 목록, 오답 기반 복습 게임 생성 |
| `global/` | Security, CORS, 전역 예외 처리, 설정(`application.yml`) |

**주요 진입점**

- `BackendApplication.java` — Spring Boot 메인 클래스
- `application.yml` — DB·OAuth·Gemini·NLP 설정 (시크릿은 환경 변수로 주입)

**문제 생성 흐름**

1. 사용자가 게임 생성 후 PDF/TXT 업로드 또는 텍스트 입력 → `GameSourceService`가 텍스트 추출
2. `POST /games/{id}/generate/preview` → Gemini로 학습 목표·내용 미리보기
3. `POST /games/{id}/generate/problems` → 게임 유형에 따라 문제 생성
   - `GRAMMAR`: NLP FastAPI RAG 서버 우선 → 실패 시 Gemini fallback
   - `VOCAB`: Gemini 직접 호출
4. 생성된 문제는 PostgreSQL `problems` 테이블에 저장

### Frontend (`front/WebPage/`)

React 19 + Vite 7 SPA. Phaser 3 미니게임은 `public/Game/`에 HTML/JS로 분리되어 iframe으로 로드됩니다.

| 경로 | 설명 |
|------|------|
| `src/pages/` | Login, Onboarding, Main, GameCreation, GamePlay, Analyze, MyPage 등 |
| `src/config/api.js` | API 베이스 URL (`VITE_API_BASE_URL`) |
| `public/Game/MainGames/` | 메인 게임 셸 (문제 유형별 미니게임 라우팅) |
| `public/Game/MiniGames/` | O/X, 객관식, 단답형 Phaser 미니게임 6종 + 에셋 |
| `src/assets/images/` | UI 로고·아이콘 |

**프론트 라우트**

| 경로 | 페이지 |
|------|--------|
| `/` | Google 로그인 |
| `/auth/callback` | OAuth 콜백 |
| `/onboarding`, `/signup` | 온보딩 |
| `/main` | 메인 (스트릭, 최근 게임) |
| `/create-game` | 게임 생성 마법사 |
| `/play` | Phaser 게임 플레이 |
| `/analyze`, `/wrong-answers` | 학습 분석 |
| `/mypage` | 마이페이지 |

### NLP 서버 (`ai/`)

FastAPI 기반 Grammar RAG Engine입니다. Backend의 `GRAMMAR` 문제 생성 시 우선 호출됩니다.

| 경로 | 설명 |
|------|------|
| `app/main.py` | FastAPI 엔트리포인트 |
| `app/api/` | `parse`, `generate/problems`, `corpus/*` 등 API 라우터 |
| `app/nlp/` | Stanza 파싱, rule tagging, 문제 생성 빌더 |
| `workers/` | Celery 작업 정의 (`corpus build` 비동기 처리) |
| `evaluate_stanza_accuracy.py` | Stanza 정확도 평가 스크립트 |
| `evaluate_rule_precision.py` | 문법 rule Precision/Recall/F1 평가 스크립트 |
| `.env.example` | `DATABASE_URL`, `GEMINI_API_KEY`, `REDIS_URL` 템플릿 |

---

## How to Build

별도 Gradle·Maven 설치 없이 **Gradle Wrapper**(`gradlew`)와 **npm**으로 빌드합니다.

### Backend

```bash
cd backend

# 전체 빌드 (테스트 포함)
./gradlew build          # Windows: gradlew.bat build

# 테스트 제외 빌드 (CI 배포와 동일)
./gradlew build -x test

# 실행 JAR 생성
./gradlew bootJar
# 결과: build/libs/backend-0.0.1-SNAPSHOT.jar
```

**요구 사항:** JDK 17

### Frontend

```bash
cd front/WebPage

npm install
npm run build      # 결과: dist/
npm run preview    # 빌드 결과 로컬 미리보기
npm run lint       # ESLint
```

**요구 사항:** Node.js 18 이상 권장

### AI (`ai/`)

```bash
cd ai

# 로컬 실행용 의존성 설치
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Stanza 모델 다운로드(최초 1회)
python -c "import stanza; stanza.download('en')"
```

선택: Docker 이미지 빌드

```bash
cd ai
docker build -t learning-village-nlp:local .
```

**요구 사항:** Python 3.10+ (Docker 사용 시 Python 로컬 설치 없이 가능)

---

## How to Install

### 1. 저장소 클론

```bash
git clone https://github.com/capston-organization/2026-growth-200OK.git
cd 2026-growth-200OK
```

### 2. 인프라 설치 (PostgreSQL, Redis)

**PostgreSQL**

```sql
CREATE DATABASE capston;
CREATE USER your_db_user WITH PASSWORD 'your_db_password';
GRANT ALL PRIVILEGES ON DATABASE capston TO your_db_user;
```

**Redis** (Refresh Token 저장용)

```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

### 3. 외부 서비스 준비

| 서비스 | 용도 | 발급 |
|--------|------|------|
| Google OAuth | 로그인 | [Google Cloud Console](https://console.cloud.google.com/) |
| Gemini API | 문제·해설 생성 | [Google AI Studio](https://aistudio.google.com/) |
| NLP 서버 (선택) | 영문법 RAG | 본 저장소 `ai/` 디렉터리 FastAPI 서버 |

Google Console **승인된 리디렉션 URI** 예시:

- `http://localhost:5173/auth/callback` (로컬)
- 배포 URL `/auth/callback` (운영)

### 4. Backend 환경 변수 설정 및 실행

`backend/application.yml`은 `jdbc:postgresql://localhost:5432/capston`을 사용합니다.

**Windows (PowerShell)**

```powershell
cd backend
$env:DB_NAME="your_db_user"
$env:DB_PASSWORD="your_db_password"
$env:JWT_SECRET="your-jwt-secret-at-least-256-bits"
$env:GOOGLE_CLIENT_ID="your-google-client-id"
$env:GOOGLE_CLIENT_SECRET="your-google-client-secret"
$env:REDIRECT_URI="http://localhost:5173/auth/callback"
$env:GEMINI_API_KEY="your-gemini-api-key"
$env:NLP_ENABLED="false"

.\gradlew.bat bootRun
```

**macOS / Linux**

```bash
cd backend
export DB_NAME=your_db_user
export DB_PASSWORD=your_db_password
export JWT_SECRET=your-jwt-secret-at-least-256-bits
export GOOGLE_CLIENT_ID=your-google-client-id
export GOOGLE_CLIENT_SECRET=your-google-client-secret
export REDIRECT_URI=http://localhost:5173/auth/callback
export GEMINI_API_KEY=your-gemini-api-key
export NLP_ENABLED=false

./gradlew bootRun
```

→ **http://localhost:8080**

| 변수 | 필수 | 기본값 | 설명 |
|------|:----:|--------|------|
| `DB_NAME` | ✅ | — | PostgreSQL 사용자명 |
| `DB_PASSWORD` | ✅ | — | PostgreSQL 비밀번호 |
| `JWT_SECRET` | ✅ | — | JWT 서명 시크릿 |
| `GOOGLE_CLIENT_ID` | ✅ | — | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | — | Google OAuth Client Secret |
| `REDIRECT_URI` | ✅ | — | OAuth 콜백 URI |
| `GEMINI_API_KEY` | ✅ | — | Gemini API 키 |
| `NLP_ENABLED` | | `true` | `false`면 NLP 생략, Gemini만 사용 |
| `NLP_SERVER_URL` | | `http://localhost:8000` | NLP FastAPI URL |
| `FRONTEND_BASE_URL` | | `http://localhost:5173` | Classroom 공유 URL origin |

Redis는 별도 설정 없이 **localhost:6379**를 사용합니다.

### 5. Frontend 환경 변수 설정 및 실행

```bash
cd front/WebPage
cp .env.example .env    # Windows: copy .env.example .env
```

`.env` (로컬 개발 예시):

```env
VITE_API_BASE_URL=
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GOOGLE_REDIRECT_URI=
```

`VITE_API_BASE_URL`을 비우면 Vite dev server가 API를 `localhost:8080`으로 프록시합니다.

```bash
npm install
npm run dev
```

→ **http://localhost:5173**

### 6. AI(`ai`) 환경 변수 설정 및 실행 (선택)

```bash
cd ai
cp .env.example .env      # Windows: copy .env.example .env
```

`.env` 예시:

```env
DATABASE_URL=postgresql://postgres:비밀번호@localhost:5432/capston
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
DEFAULT_MAX_SENTENCES=5000
REDIS_URL=redis://localhost:6379/0
```

실행:

```bash
cd ai
uvicorn app.main:app --reload --port 8000
```

확인:
- API 문서: `http://localhost:8000/docs`
- 헬스체크: `GET http://localhost:8000/health`
- Backend 연동 상태: `GET http://localhost:8080/nlp/status`

선택(비동기 corpus 작업 사용 시): Celery worker

```bash
cd ai
celery -A workers.celery_app:celery_app worker --loglevel=info
```

---

## NLP 평가 결과 요약 (ai)

상세 실험 절차와 스크립트는 `ai/README.md`를 참고하세요.

- **Stanza Parsing Accuracy (UD English EWT)**  
  POS 97.92%, UAS 92.71%, LAS 94.31%
- **Grammar Rule Precision (10개 rule, UD EWT)**  
  Precision/Recall/F1 전 항목 100%

---

## How to Test

### 1. 자동화 테스트 (Backend)

JUnit 5 + Spring Boot Test + Mockito 기반 테스트가 `backend/src/test/`에 포함되어 있습니다.  
테스트 실행 시 **PostgreSQL·Redis·외부 API 없이** H2 인메모리 DB와 Mock Redis(`TestRedisConfig`)를 사용합니다.

```bash
cd backend
./gradlew test          # Windows: gradlew.bat test
```

**테스트 설정:** `src/test/resources/application-test.yml` (`test` 프로파일)

| 테스트 클래스 | 유형 | 검증 내용 |
|---------------|------|-----------|
| `BackendApplicationTests` | Spring Boot 통합 | 애플리케이션 컨텍스트 로드 |
| `GameServiceTest` | 단위 (Mockito) | 게임 생성, 목록 조회, 좋아요 토글, 예외 처리 |
| `GameControllerIntegrationTest` | API (MockMvc + H2) | `POST /games`, `GET /games`, `POST /games/{id}/like`, `GET /games/likes/me` |

**실행 결과 (로컬 검증):** `./gradlew test` → **10 tests, BUILD SUCCESSFUL**

테스트 리포트: `backend/build/reports/tests/test/index.html`

### 2. 자동화 테스트 (Frontend)

프론트엔드 단위/E2E 테스트 프레임워크(Jest, Vitest, Cypress 등)는 **미구성**입니다.

```bash
cd front/WebPage
npm run lint    # ESLint 정적 분석만 가능
```

### 3. 자동/반자동 테스트 (AI)

```bash
cd ai

# 서버 스모크 테스트
curl http://localhost:8000/health
curl http://localhost:8000/

# corpus 동작 확인(소량 동기)
curl -X POST http://localhost:8000/api/corpus/build/sync \
  -H "Content-Type: application/json" \
  -d '{"dataset_name":"open_subtitles","max_sentences":100}'

# 평가 스크립트(선택)
python evaluate_stanza_accuracy.py
python evaluate_rule_precision.py
```

참고:
- 평가 스크립트는 UD English EWT 및 HuggingFace 데이터 접근이 필요할 수 있습니다.
- `ai/README.md`에 상세 측정 방법과 결과가 정리되어 있습니다.

### 4. 수동 기능 테스트 (E2E)

아래 순서로 전체 흐름을 검증할 수 있습니다.

1. **인프라 확인**
   - PostgreSQL·Redis 실행
   - Backend `bootRun` → `http://localhost:8080/nlp/status` 응답 확인
   - Frontend `npm run dev` → `http://localhost:5173` 접속

2. **로그인**
   - Google 로그인 → 온보딩(이름·학년 등) 완료 → `/main` 진입

3. **게임 생성**
   - `/create-game` → 유형(GRAMMAR/VOCAB) 선택
   - [샘플 텍스트](#description-of-sample-data-if-any) 입력 또는 PDF/TXT 업로드
   - 문제 유형·개수 설정 → AI 문제 생성

4. **게임 플레이**
   - `/play`에서 Phaser 미니게임 실행, 답안 제출

5. **분석**
   - `/analyze`, `/wrong-answers`에서 오답·범위별 통계 확인

6. **API 직접 호출** (토큰 필요 시 로그인 후 `localStorage.accessToken` 사용)

```bash
# NLP 서버 상태 (인증 불필요)
curl http://localhost:8080/nlp/status
```

---

## Description of Sample Data (if any)

저장소에 **DB 시드 SQL·샘플 PDF 파일은 포함되어 있지 않습니다.** 아래 정적 에셋과 README 내 테스트용 텍스트를 사용하세요.

### 포함된 샘플·프로토 데이터

| 종류 | 경로 | 설명 |
|------|------|------|
| **Phaser 게임 에셋** | `front/WebPage/public/Game/**/assets/images/` | 배경·캐릭터·UI PNG |
| **게임 사운드** | `front/WebPage/public/Game/**/assets/sounds/` | BGM·효과음 MP3 |
| **UI 이미지** | `front/WebPage/src/assets/images/` | Learning Village 로고, 게임 아이콘, Google 로고 |
| **환경 변수 템플릿** | `front/WebPage/.env.example` | 프론트 `.env` 작성용 |
| **NLP 환경 변수 템플릿** | `ai/.env.example` | NLP `.env` 작성용 |
| **NLP 평가 스크립트** | `ai/evaluate_*.py` | 파서/룰 정량 평가 스크립트 |

### 미포함 데이터 (런타임 생성)

| 종류 | 생성 방법 |
|------|-----------|
| 사용자·게임·문제 DB 레코드 | Google 로그인 → 게임 생성·플레이 시 JPA가 자동 저장 |
| 학습 소스(PDF/TXT) | 사용자 업로드 또는 텍스트 직접 입력 |
| UD/HuggingFace 평가·코퍼스 데이터 | 평가/코퍼스 빌드 시 외부에서 다운로드 후 사용 |

### 테스트용 학습 텍스트 (복사·붙여넣기)

게임 생성 2단계 **텍스트 직접 입력**에 사용:

```text
The present perfect tense is used to describe actions that happened at an unspecified time in the past.
She has lived in Seoul for five years.
They have never visited Japan.
I have already finished my homework.
```

지원 업로드 형식: **PDF, TXT** (`GameSourceService` — PDF는 Apache PDFBox로 텍스트 추출).

---

## Database or Data Used

### RDBMS: PostgreSQL

| 항목 | 값 |
|------|-----|
| **DB 이름** | `capston` |
| **JDBC URL** | `jdbc:postgresql://localhost:5432/capston` |
| **스키마 관리** | JPA `ddl-auto: update` (앱 기동 시 테이블 자동 생성/갱신) |
| **마이그레이션 SQL** | 없음 (Flyway/Liquibase 미사용) |

### 주요 테이블 (Entity)

| 테이블 | Entity | 설명 |
|--------|--------|------|
| `users` | `User` | Google OAuth 사용자, 프로필, 코인, 캐릭터 상태, Classroom refresh token |
| `games` | `Game` | 게임 메타(제목, 유형, 공개 여부, 좋아요 수, 미리보기 캐시) |
| `game_sources` | `GameSource` | 업로드 파일 메타 + 추출된 학습 텍스트 |
| `game_allowed_problem_types` | (ElementCollection) | 게임별 허용 문제 유형 |
| `problems` | `Problem` | AI 생성 문제(질문, 보기, 정답, scope, 해설) |
| `problem_attempts` | `ProblemAttempt` | 사용자별 답안·정오 기록 |
| `game_likes` | `GameLike` | 게임 좋아요 |
| `user_play_dates` | `UserPlayDate` | 스트릭(연속 학습일) 기록 |

### Cache: Redis

| 용도 | 키 패턴 |
|------|---------|
| Refresh Token 저장 | `refresh:{userId}` |
| Access Token 블랙리스트 | `blacklist:{accessToken}` |

기본 연결: `localhost:6379` (Spring Boot Redis autoconfigure)

### 외부 API·서비스 데이터

| 서비스 | 용도 |
|--------|------|
| **Google Gemini API** | 문제 생성, 학습 미리보기, 해설 생성 |
| **Google OAuth / Classroom API** | 로그인, 수업 연동·게임 공유 |
| **NLP FastAPI 서버** (선택) | 영문법 RAG 기반 문제 생성 (`ai/`에서 로컬 실행 가능) |
| **HuggingFace Datasets** (선택) | NLP corpus 구축용 원천 문장 데이터 |

---

## Description of Used Open Source (if any)

본 프로젝트는 아래 오픈소스 라이브러리·프레임워크를 사용합니다.

### Backend (Java / Gradle)

| 라이브러리 | 버전 | 라이선스 | 용도 |
|------------|------|----------|------|
| [Spring Boot](https://spring.io/projects/spring-boot) | 3.3.4 | Apache 2.0 | 웹 프레임워크 |
| [Spring Security](https://spring.io/projects/spring-security) | (Boot BOM) | Apache 2.0 | 인증·인가 |
| [Spring Data JPA](https://spring.io/projects/spring-data-jpa) | (Boot BOM) | Apache 2.0 | ORM |
| [Spring WebFlux](https://docs.spring.io/spring-framework/reference/web/webflux.html) | (Boot BOM) | Apache 2.0 | NLP·Gemini HTTP 클라이언트 |
| [Spring Data Redis](https://spring.io/projects/spring-data-redis) | (Boot BOM) | Apache 2.0 | Redis 연동 |
| [Spring Session Data Redis](https://spring.io/projects/spring-session) | (Boot BOM) | Apache 2.0 | 세션·토큰 저장 |
| [PostgreSQL JDBC Driver](https://jdbc.postgresql.org/) | (Boot BOM) | BSD-2-Clause | PostgreSQL 연결 |
| [JJWT](https://github.com/jwtk/jjwt) | 0.11.5 | Apache 2.0 | JWT 생성·검증 |
| [Lombok](https://projectlombok.org/) | (Boot BOM) | MIT | 보일러플레이트 코드 감소 |
| [Apache PDFBox](https://pdfbox.apache.org/) | 3.0.3 | Apache 2.0 | PDF 텍스트 추출 |
| [H2 Database](https://www.h2database.com/) | (test) | MPL 2.0 / EPL 1.0 | 테스트용 인메모리 DB (`application-test.yml`) |
| [JUnit 5](https://junit.org/junit5/) | (Boot BOM) | EPL 2.0 | 단위·통합 테스트 |

### Frontend (JavaScript / npm)

| 라이브러리 | 버전 | 라이선스 | 용도 |
|------------|------|----------|------|
| [React](https://react.dev/) | ^19.2.0 | MIT | UI |
| [React DOM](https://react.dev/) | ^19.2.0 | MIT | DOM 렌더링 |
| [React Router](https://reactrouter.com/) | ^7.13.0 | MIT | SPA 라우팅 |
| [Phaser](https://phaser.io/) | ^3.90.0 | MIT | HTML5 게임 엔진 |
| [Vite](https://vitejs.dev/) | ^7.3.1 | MIT | 빌드·개발 서버 |
| [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) | ^5.1.1 | MIT | React Fast Refresh |
| [ESLint](https://eslint.org/) | ^9.39.1 | MIT | 코드 린트 |

### AI / NLP (Python / pip)

| 라이브러리 | 버전 | 라이선스 | 용도 |
|------------|------|----------|------|
| [FastAPI](https://fastapi.tiangolo.com/) | 0.136.1 | MIT | NLP API 서버 |
| [Uvicorn](https://www.uvicorn.org/) | 0.46.0 | BSD-3-Clause | ASGI 서버 |
| [Stanza](https://stanfordnlp.github.io/stanza/) | 1.11.1 | Apache 2.0 | 문장 파싱/품사/의존구문 |
| [PyTorch (CPU)](https://pytorch.org/) | 2.11.0+cpu | BSD-style | Stanza 실행 런타임 |
| [Celery](https://docs.celeryq.dev/) | >=5.3.0 | BSD-3-Clause | 비동기 작업 큐 |
| [Redis-py](https://redis.readthedocs.io/) | >=5.0.0 | MIT | Celery broker/캐시 연동 |
| [psycopg2-binary](https://www.psycopg.org/) | >=2.9.10 | LGPL with exceptions | PostgreSQL 연결 |
| [datasets](https://huggingface.co/docs/datasets/) | >=2.14.0 | Apache 2.0 | 코퍼스 데이터 로딩 |

### 인프라·런타임 (설치 대상)

| 소프트웨어 | 라이선스 | 용도 |
|------------|----------|------|
| [PostgreSQL](https://www.postgresql.org/) | PostgreSQL License | 주 데이터베이스 |
| [Redis](https://redis.io/) | BSD 3-Clause | 토큰 캐시 |
| [OpenJDK](https://openjdk.org/) | GPL v2 + Classpath | Java 17 런타임 |
| [Node.js](https://nodejs.org/) | MIT 등 | 프론트 빌드·실행 |

### 외부 SaaS API (오픈소스 아님)

- **Google Gemini API** — AI 문제·해설 생성
- **Google OAuth 2.0 / Google Classroom API** — 인증·수업 연동

---

## 부록

### REST API 요약

| Prefix | 주요 엔드포인트 |
|--------|------------------|
| `/auth` | `POST /google`, `POST /refresh`, `GET /me`, `POST /logout` |
| `/games` | CRUD, 소스 업로드, 문제 생성, 답안 제출, 좋아요 |
| `/users/me` | 프로필, 코인, 스트릭, 캐릭터, 내 게임 |
| `/analysis/me` | 학습 분석, 오답, 복습 게임 |
| `/classrooms` | Classroom 연동, 게임 공유 |
| `/nlp/status` | NLP 헬스체크 (인증 불필요) |

### 배포

- **Frontend:** Vercel (`front/WebPage/vercel.json`)
- **Backend:** GitHub Actions → EC2 (`.github/workflows/deploy.yml`, `develop` 브랜치)
- **AI (NLP):** GitHub Actions → EC2 (`ai/.github/workflows/deploy-nlp.yml`, `main`/`develop` 브랜치, Docker 우선 배포)

### 트러블슈팅

| 증상 | 확인 |
|------|------|
| Google 로그인 실패 | Client ID·Redirect URI가 Console·`.env`·`REDIRECT_URI`와 동일한지 |
| 401 오류 | Redis 실행, `JWT_SECRET` 설정 |
| 문제 생성 실패 | `GEMINI_API_KEY`, 학습 소스 비어 있지 않은지 |
| NLP 미사용 | `GET /nlp/status` → `nlpHealthy: false` (Gemini fallback 정상) |

### 팀 문서

- [`docs/GrounRule.MD`](docs/GrounRule.MD) — 협업 규칙·코드 컨벤션

### 기타 

1. NLP FastAPI 서버는 선택 구성입니다. 미실행 시 Gemini fallback으로 동작합니다.
2. 학습 PDF/TXT 샘플 파일·DB seed SQL은 **의도적으로 미포함**했습니다. 사용자(교사/학습자)가 목적에 맞는 자체 학습 자료와 DB 상태로 바로 구성할 수 있도록 하기 위함입니다.
3. 자동 설치 스크립트(원클릭)는 없으며, [How to Install](#how-to-install) 절차를 순서대로 수행해야 합니다.
