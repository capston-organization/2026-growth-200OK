FROM python:3.11-slim

WORKDIR /app

# 시스템 의존성 (psycopg2 빌드에 필요)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stanza 영어 모델 사전 다운로드 (빌드 시 캐싱)
RUN python -c "import stanza; stanza.download('en', processors='tokenize,pos,lemma,depparse', quiet=True)"

# 소스 복사
COPY . .

# 포트 및 실행
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
