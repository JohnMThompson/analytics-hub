from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Analytics API",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Try without registry - just manual endpoints
@app.get("/api/health")
async def health():
    return {"status": "ok"}

@app.get("/api/test/no_param")
async def api_test_no_param():
    return {"test": "no_param"}

@app.get("/api/test/with_param")
async def api_test_with_param(days: int = 365):
    return {"days": days}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
