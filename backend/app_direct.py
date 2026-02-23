from fastapi import FastAPI

app = FastAPI()

class FakeDB:
    async def get_rate(self):
        return {"rate": 5.5}

db = FakeDB()

@app.get("/api/test/direct")
async def test_direct():
    return await db.get_rate()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
