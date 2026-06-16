# Learning Village (200OK)

AI 기반 영어 학습 게임 플랫폼입니다. 사용자가 PDF·텍스트 학습 자료를 업로드하면 **Gemini API**(및 선택적 NLP RAG 서버)로 문제를 생성하고, **Phaser** 미니게임(O/X, 5지선다, 단답형)으로 학습합니다. Google OAuth 로그인, 학습 분석, Google Classroom 연동, 코인·스트릭 등 게이미피케이션 기능을 제공합니다.

---

## 목차

1. [저장소 구조](#저장소-구조)
2. [기술 스택](#기술-스택)
3. [사전 요구사항](#사전-요구사항)
4. [빠른 시작 (로컬 개발)](#빠른-시작-로컬-개발)
5. [환경 변수](#환경-변수)
6. [빌드 및 실행](#빌드-및-실행)
7. [샘플 데이터 및 테스트 방법](#샘플-데이터-및-테스트-방법)
8. [주요 기능 및 API 개요](#주요-기능-및-api-개요)
9. [배포](#배포)
10. [트러블슈팅](#트러블슈팅)
11. [제한 사항 및 알려진 이슈](#제한-사항-및-알려진-이슈)

---

## 저장소 구조

```
2026-growth-200OK/
├── backend/                    # Spring Boot REST API (Java 17)
│   ├── src/main/java/          # 도메인·서비스·컨트롤러
│   ├── src/main/resources/
│   │   └── application.yml     # DB·OAuth·Gemini·NLP 설정
│   ├── gradlew / gradlew.bat   # Gradle Wrapper (재현 가능한 빌드)
│   └── build.gradle
├── front/WebPage/              # React + Vite 프론트엔드
│   ├── src/                    # 페이지·API 설정
│   ├── public/Game/            # Phaser 미니게임 HTML/JS + 에셋(이미지·사운드)
│   ├── .env.example            # 프론트 환경 변수 예시
│   └── package.json
├── docs/
│   └── GrounRule.MD            # 팀 협업 규칙
├── .github/workflows/
│   └── deploy.yml              # develop 브랜치 → EC2 배포
└── README.md
```

| 경로 | 설명 |
|------|------|
| `backend/` | 게임 CRUD, 문제 생성, 인증, 분석, Classroom API |
| `front/WebPage/src/pages/` | 로그인, 게임 생성, 플레이, 분석, 마이페이지 등 React 페이지 |
| `front/WebPage/public/Game/` | O/X·객관식·단답형 Phaser 게임 및 `assets/images`, `assets/sounds` |
| `front/WebPage/src/assets/images/` | UI 로고·아이콘 이미지 |

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| **Frontend** | React 19, Vite 7, React Router 7, Phaser 3 |
| **Backend** | Spring Boot 3.3.4, Spring Security, Spring Data JPA, WebFlux |
| **Database** | PostgreSQL (`ddl-auto: update` — 스키마 자동 생성) |
| **Cache / Session** | Redis (Refresh Token 저장·블랙리스트) |
| **인증** | Google OAuth 2.0, JWT (Access + Refresh Cookie) |
| **AI** | Google Gemini API (`gemini-2.5-flash`) |
| **NLP (선택)** | 외부 FastAPI RAG 서버 (`http://localhost:8000`) — 미연결 시 Gemini fallback |
| **기타** | Apache PDFBox (PDF 텍스트 추출), Google Classroom API |

---

## 사전 요구사항

로컬에서 전체 기능을 실행하려면 아래가 필요합니다.

| 항목 | 버전·비고 |
|------|-----------|
| **JDK** | 17 |
| **Node.js** | 18 이상 권장 (Vite 7) |
| **PostgreSQL** | 14+ 권장, DB 이름 `capston` |
| **Redis** | 기본 `localhost:6379` (Spring Boot 기본값) |
| **Google Cloud Console** | OAuth 2.0 Client ID / Secret, 승인된 리디렉션 URI 등록 |
| **Gemini API Key** | [Google AI Studio](https://aistudio.google.com/) |
| **NLP 서버 (선택)** | 영문법(GRAMMAR) 게임 RAG 파이프라인용 FastAPI — **본 저장소에 미포함** |

---

## 빠른 시작 (로컬 개발)

### 1. 저장소 클론

```bash
git clone https://github.com/capston-organization/2026-growth-200OK.git
cd 2026-growth-200OK
```

### 2. PostgreSQL 준비

```sql
CREATE DATABASE capston;
CREATE USER your_db_user WITH PASSWORD 'your_db_password';
GRANT ALL PRIVILEGES ON DATABASE capston TO your_db_user;
```

### 3. Redis 실행

```bash
# Docker 사용 예시
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

### 4. 백엔드 환경 변수 설정 후 실행

`backend/` 디렉터리에서 OS 환경 변수 또는 IDE Run Configuration에 아래 값을 설정합니다.

**Windows (PowerShell) 예시:**

```powershell
cd backend
$env:DB_NAME="your_db_user"
$env:DB_PASSWORD="your_db_password"
$env:JWT_SECRET="your-jwt-secret-at-least-256-bits"
$env:GOOGLE_CLIENT_ID="your-google-client-id"
$env:GOOGLE_CLIENT_SECRET="your-google-client-secret"
$env:REDIRECT_URI="http://localhost:5173/auth/callback"
$env:GEMINI_API_KEY="your-gemini-api-key"
$env:NLP_ENABLED="false"   # NLP 서버 없이 Gemini만 사용할 때

.\gradlew.bat bootRun
```

**macOS / Linux:**

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

백엔드 기본 포트: **http://localhost:8080**

### 5. 프론트엔드 설정 및 실행

```bash
cd front/WebPage
cp .env.example .env   # Windows: copy .env.example .env
```

`.env` 파일 예시 (로컬 개발):

```env
# 비워두면 Vite proxy가 localhost:8080으로 API 전달
VITE_API_BASE_URL=

VITE_GOOGLE_CLIENT_ID=your-google-client-id
# 비우면 자동으로 http://localhost:5173/auth/callback 사용
VITE_GOOGLE_REDIRECT_URI=
```

```bash
npm install
npm run dev
```

프론트엔드: **http://localhost:5173**

> Google Cloud Console의 **승인된 리디렉션 URI**에 `http://localhost:5173/auth/callback`을 반드시 등록하세요.

---

## 환경 변수

### Backend (`application.yml` → 환경 변수)

| 변수 | 필수 | 기본값 | 설명 |
|------|:----:|--------|------|
| `DB_NAME` | ✅ | — | PostgreSQL 사용자명 |
| `DB_PASSWORD` | ✅ | — | PostgreSQL 비밀번호 |
| `JWT_SECRET` | ✅ | — | JWT 서명 시크릿 |
| `GOOGLE_CLIENT_ID` | ✅ | — | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | — | Google OAuth Client Secret |
| `REDIRECT_URI` | ✅ | — | OAuth 콜백 URI (프론트와 동일) |
| `GEMINI_API_KEY` | ✅ | — | Gemini API 키 |
| `CLASSROOM_REDIRECT_URI` | | `REDIRECT_URI`와 동일 | Classroom OAuth용 (별도 scope) |
| `FRONTEND_BASE_URL` | | `http://localhost:5173` | Classroom 과제 공유 URL origin |
| `NLP_SERVER_URL` | | `http://localhost:8000` | FastAPI NLP 서버 URL |
| `NLP_ENABLED` | | `true` | `false`면 NLP 호출 생략, Gemini만 사용 |

DB 연결 URL은 `application.yml`에 `jdbc:postgresql://localhost:5432/capston`으로 고정되어 있습니다. 호스트·DB명 변경 시 `application.yml`을 수정하세요.

Redis는 별도 설정 없이 **localhost:6379**를 사용합니다.

### Frontend (`.env`)

| 변수 | 필수 | 설명 |
|------|:----:|------|
| `VITE_API_BASE_URL` | | API 서버 URL. 로컬 개발 시 **비워두면** Vite proxy 사용 |
| `VITE_GOOGLE_CLIENT_ID` | ✅ | Google 로그인 Client ID |
| `VITE_GOOGLE_REDIRECT_URI` | | OAuth 리디렉션 URI (미설정 시 `origin/auth/callback`) |

---

## 빌드 및 실행

### Backend

```bash
cd backend

# 빌드 (테스트 포함)
./gradlew build          # Windows: gradlew.bat build

# 테스트 제외 빌드 (CI와 동일)
./gradlew build -x test

# JAR 실행
./gradlew bootJar
java -jar build/libs/backend-0.0.1-SNAPSHOT.jar
```

Gradle Wrapper(`gradlew`, `gradle/wrapper/`)가 포함되어 있어 **별도 Gradle 설치 없이** 빌드할 수 있습니다.

### Frontend

```bash
cd front/WebPage

npm install
npm run build      # dist/ 생성
npm run preview    # 빌드 결과 미리보기
npm run lint       # ESLint
```

---

## 샘플 데이터 및 테스트 방법

### 포함된 데이터 (저장소 내)

| 종류 | 위치 | 설명 |
|------|------|------|
| **게임 에셋** | `front/WebPage/public/Game/**/assets/` | Phaser 게임용 PNG, MP3 (MainGame + MiniGame 6종) |
| **UI 이미지** | `front/WebPage/src/assets/images/` | 로고, 게임 아이콘, Google 로고 |
| **DB 스키마** | JPA `ddl-auto: update` | 마이그레이션 SQL 없음 — 앱 기동 시 자동 생성 |
| **환경 변수 예시** | `front/WebPage/.env.example` | 프론트 설정 템플릿 |

### 포함되지 않은 데이터

| 종류 | 대안 |
|------|------|
| **학습 자료 (PDF/TXT)** | 게임 생성 시 직접 업로드 또는 텍스트 입력 |
| **DB 시드 데이터** | Google 로그인 후 온보딩·게임 생성으로 데이터 생성 |
| **NLP RAG 코퍼스/모델** | 별도 FastAPI NLP 서버 필요 (미포함) |

### 학습 자료 테스트용 샘플 텍스트

게임 생성 2단계에서 **텍스트 직접 입력**으로 아래 내용을 붙여넣어 테스트할 수 있습니다.

```text
The present perfect tense is used to describe actions that happened at an unspecified time in the past.
She has lived in Seoul for five years.
They have never visited Japan.
I have already finished my homework.
```

또는 임의의 영어 PDF·TXT 파일을 업로드하세요. 지원 형식: **PDF, TXT** (`GameSourceService`).

### NLP 서버 상태 확인

백엔드 기동 후:

```bash
curl http://localhost:8080/nlp/status
```

응답 예시:

```json
{
  "nlpEnabled": true,
  "serverUrl": "http://localhost:8000",
  "nlpHealthy": false,
  "mode": "Fallback (Gemini Direct)"
}
```

NLP 서버가 없어도 **영문법(GRAMMAR) 게임은 Gemini fallback**으로 문제가 생성됩니다.

---

## 주요 기능 및 API 개요

### 사용자 흐름

```
로그인(Google OAuth) → 온보딩 → 메인
  → 게임 생성(유형·자료·설정) → AI 문제 생성 → Phaser 게임 플레이
  → 학습 분석 / 오답 노트 → 복습 게임 생성
  → 마이페이지(코인·스트릭·캐릭터)
```

### 게임 유형

| `GameType` | 문제 생성 방식 |
|------------|----------------|
| `GRAMMAR` | NLP RAG 서버 우선 → 실패 시 Gemini |
| `VOCAB` | Gemini 직접 호출 |

### 문제 유형 (`ProblemType`)

- `MULTIPLE_CHOICE` — 5지선다
- `OX` — O/X
- `SHORT_ANSWER` — 단답형

### REST API 요약

| Prefix | 주요 엔드포인트 |
|--------|------------------|
| `/auth` | `POST /google`, `POST /refresh`, `GET /me`, `POST /logout` |
| `/games` | CRUD, 소스 업로드, `POST /{id}/generate/preview`, `POST /{id}/generate/problems`, 답안 제출, 좋아요 |
| `/users/me` | 프로필, 코인, 스트릭, 캐릭터(간식·놀기·공부), 내 게임 목록 |
| `/analysis/me` | 학습 개요·상세, 오답 목록, 복습 게임 생성 |
| `/classrooms` | Google Classroom 연동, 게임 공유 |
| `/nlp/status` | NLP 서버 헬스체크 (인증 불필요) |

### 프론트 라우트

| 경로 | 페이지 |
|------|--------|
| `/` | 로그인 |
| `/auth/callback` | OAuth 콜백 |
| `/onboarding`, `/signup` | 온보딩·회원가입 |
| `/main` | 메인 (스트릭, 최근 게임) |
| `/create-game` | 게임 생성 마법사 |
| `/play` | Phaser 게임 플레이 |
| `/analyze`, `/wrong-answers` | 학습 분석 |
| `/mypage` | 마이페이지 |

### 백엔드 패키지 구조

```
growth._OK.backend
├── auth/          # Google OAuth, JWT, Token(Redis)
├── user/          # 사용자, 코인, 스트릭, 캐릭터
├── game/          # 게임·문제·소스·Gemini·NLP Client
├── analysis/      # 학습 분석·복습 게임
├── classroom/     # Google Classroom
└── global/        # Security, CORS, Exception, Config
```

---

## 배포

### Frontend (Vercel)

- `front/WebPage/vercel.json` — SPA rewrite 설정
- 환경 변수: `VITE_API_BASE_URL`, `VITE_GOOGLE_CLIENT_ID`, `VITE_GOOGLE_REDIRECT_URI`
- CORS 허용 origin: `https://2026-growth-front-deploy.vercel.app` (`CorsConfig`)

### Backend (GitHub Actions → EC2)

`develop` 브랜치 push 시 `.github/workflows/deploy.yml` 실행:

1. GitHub Secret `APPLICATION_YML`로 `application.yml` 생성
2. `./gradlew build -x test`
3. JAR를 EC2에 SCP 후 `java -jar`로 재기동

운영 API 예시: `https://capston.p-e.kr`

---

## 트러블슈팅

| 증상 | 확인 사항 |
|------|-----------|
| Google 로그인 실패 | Client ID, Redirect URI가 Google Console·`.env`·백엔드 `REDIRECT_URI`와 **완전히 동일**한지 확인 |
| 401 / 인증 오류 | Redis 실행 여부, JWT_SECRET 설정 |
| DB 연결 실패 | PostgreSQL 실행, `capston` DB 존재, `DB_NAME`/`DB_PASSWORD` |
| 문제 생성 실패 | `GEMINI_API_KEY` 유효성, 학습 소스(텍스트) 비어 있지 않은지 |
| 영문법 게임이 Gemini만 사용 | `GET /nlp/status`에서 `nlpHealthy: false` — NLP 서버 미기동 또는 `NLP_ENABLED=false` |
| CORS 오류 | 프론트 origin이 `CorsConfig` 허용 목록에 있는지 확인 |
| 프론트 API 404 | 로컬 개발 시 `VITE_API_BASE_URL`을 비우고 Vite dev server 사용 |

---

## 제한 사항 및 알려진 이슈

1. **NLP FastAPI 서버 미포함** — 영문법 RAG 파이프라인용 별도 저장소/서버가 필요합니다. 없으면 Gemini fallback으로 동작합니다.
2. **자동 설치 스크립트 없음** — PostgreSQL·Redis·환경 변수는 수동 설정이 필요합니다 (본 README의 절차 참고).
3. **Backend `.env.example` 없음** — 환경 변수는 위 [환경 변수](#환경-변수) 표를 참고하세요.
4. **학습 자료 샘플 파일 미포함** — 테스트용 텍스트는 [샘플 데이터](#샘플-데이터-및-테스트-방법) 절의 예시를 사용하세요.
5. **`application.yml`은 git에 포함** — 실제 시크릿은 환경 변수로 주입하며, 운영 배포는 GitHub Secrets 사용.

---

## 팀 문서

협업 규칙 및 코드 컨벤션: [`docs/GrounRule.MD`](docs/GrounRule.MD)

---

## 라이선스

본 프로젝트는 capstone 과제용 저장소입니다. 상세 라이선스는 팀/기관 정책을 따릅니다.
