"""
NeuroPlay NER — FastAPI Backend (Scaffold — Part 1)
Full implementation in Part 6 (JWT, sync endpoints).
"""
from fastapi import FastAPI

app = FastAPI(
    title="NeuroPlay NER API",
    description="Cognitive gaming and memory assistance — NE India (MDoNER SIH 2026)",
    version="0.1.0",
)


@app.get("/health")
def health():
    return {"status": "ok", "version": "0.1.0"}
