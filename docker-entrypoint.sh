#!/bin/bash
set -e

# Apply Django database migrations if not explicitly skipped
if [ "$SKIP_MIGRATIONS" != "true" ]; then
    echo "==> Running Django database migrations..."
    python manage.py migrate --noinput || echo "==> Warning: Database migration skipped or database unavailable."
fi

# Determine service execution mode based on passed command arguments
case "$1" in
    "web"|"django")
        echo "==> Starting Django Web Application on port ${PORT:-8000}..."
        exec python manage.py runserver 0.0.0.0:${PORT:-8000}
        ;;
    "fastapi")
        echo "==> Starting FastAPI ML Microservice on ${FASTAPI_HOST:-0.0.0.0}:${FASTAPI_PORT:-8001}..."
        exec uvicorn api.main:app --host ${FASTAPI_HOST:-0.0.0.0} --port ${FASTAPI_PORT:-8001}
        ;;
    "all")
        echo "==> Starting FastAPI ML Microservice on port ${FASTAPI_PORT:-8001} in background..."
        uvicorn api.main:app --host ${FASTAPI_HOST:-0.0.0.0} --port ${FASTAPI_PORT:-8001} &
        FASTAPI_PID=$!

        echo "==> Starting Django Web Platform on port ${PORT:-8000}..."
        python manage.py runserver 0.0.0.0:${PORT:-8000} &
        DJANGO_PID=$!

        # Trap SIGTERM and SIGINT for graceful shutdown of child processes
        trap "kill -TERM $FASTAPI_PID $DJANGO_PID 2>/dev/null" SIGINT SIGTERM

        # Wait for processes
        wait -n $FASTAPI_PID $DJANGO_PID
        ;;
    *)
        exec "$@"
        ;;
esac
