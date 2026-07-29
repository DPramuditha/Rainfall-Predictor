"""
FastAPI Microservice Runner Script
Runs the FastAPI Rainfall Predictor ML microservice on http://127.0.0.1:8001
Swagger API documentation: http://127.0.0.1:8001/docs
"""
import os
import uvicorn
from dotenv import load_dotenv

load_dotenv()

if __name__ == '__main__':
    host = os.environ.get("FASTAPI_HOST", "127.0.0.1")
    port = int(os.environ.get("FASTAPI_PORT", "8001"))
    print(f"Starting FastAPI ML Microservice on http://{host}:{port} ...")
    print(f"Interactive Swagger Docs available at http://{host}:{port}/docs")
    uvicorn.run("api.main:app", host=host, port=port, reload=True)
