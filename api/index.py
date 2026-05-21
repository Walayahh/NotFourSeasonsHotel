import os
import sys

# Make repo root importable so `from lib.routes import ...` works on Vercel.
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_REPO_ROOT = os.path.abspath(os.path.join(_THIS_DIR, ".."))
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from lib.routes import agents, campaigns, customers, dashboard, network
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from lib.routes import ask

app = FastAPI(title="Zain Customer 360 API")

# Local dev (Vite at :5173) — Vercel serves both from the same origin in prod.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(customers.router, prefix="/api/customers", tags=["customers"])
app.include_router(network.router,   prefix="/api/network",   tags=["network"])
app.include_router(agents.router,    prefix="/api/agents",    tags=["agents"])
app.include_router(campaigns.router, prefix="/api/campaigns", tags=["campaigns"])
app.include_router(ask.router,       prefix="/api/ask",       tags=["ask"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
