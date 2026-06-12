FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    OCR_LANG=fr \
    PORT=8866

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgl1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir setuptools && pip install --no-cache-dir -r requirements.txt

COPY app.py .

# Pré-télécharge les modèles PaddleOCR (français)
RUN python -c "from paddleocr import PaddleOCR; PaddleOCR(use_angle_cls=True, lang='fr', use_gpu=False, show_log=False)" \
    && echo "PaddleOCR models cached"

EXPOSE 8866

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD curl -f http://localhost:8866/health || exit 1

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8866", "--workers", "1"]
