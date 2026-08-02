# Multi-stage Dockerfile for Rainfall Predictor & Analytics Platform

# Stage 1: Build Front-End Tailwind CSS Assets

FROM node:20-alpine AS css-builder
WORKDIR /app

# Copy package specifications and install node dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source assets required for Tailwind CSS compilation
COPY predictor/static/css ./predictor/static/css
COPY predictor/templates ./predictor/templates
COPY predictor/static/js ./predictor/static/js

# Build production compiled stylesheet (output.css)
RUN npm run build:css


# Stage 2: Python Runtime Environment

FROM python:3.11-slim AS runner

# Set Python and container environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive \
    PORT=8000 \
    FASTAPI_PORT=8001 \
    FASTAPI_HOST=0.0.0.0

WORKDIR /app

# Install essential system utilities and PostgreSQL development headers (libpq-dev)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy project source code
COPY . .

# Copy compiled Tailwind CSS from css-builder stage
COPY --from=css-builder /app/predictor/static/css/output.css ./predictor/static/css/output.css

# Make entrypoint script executable (handles LF line endings)
RUN chmod +x /app/docker-entrypoint.sh

# Expose Django Web (8000) and FastAPI Microservice (8001) ports
EXPOSE 8000 8001

# Entrypoint script handles migrations and process startup
ENTRYPOINT ["/app/docker-entrypoint.sh"]

# Default command runs both Django and FastAPI microservice
CMD ["all"]
