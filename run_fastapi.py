"""
FastAPI Microservice Runner Script
Runs the FastAPI Rainfall Predictor ML microservice on http://127.0.0.1:8001
Swagger API documentation: http://127.0.0.1:8001/docs
"""
import uvicorn

if __name__ == '__main__':
    print("Starting FastAPI ML Microservice on http://127.0.0.1:8001 ...")
    print("Interactive Swagger Docs available at http://127.0.0.1:8001/docs")
    uvicorn.run("api.main:app", host="127.0.0.1", port=8001, reload=True)
