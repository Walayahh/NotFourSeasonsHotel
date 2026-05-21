import json
import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from FourSeasonsHotel.lib.db import query_many
from FourSeasonsHotel.lib.routes.agents import _openai
from FourSeasonsHotel.lib.agents.prompts import ASK_ANYTHING_SYSTEM

router = APIRouter()

_FORBIDDEN = re.compile(
    r"\b(insert|update|delete|drop|alter|create|attach|detach|pragma|vacuum|replace)\b",
    re.IGNORECASE,
)
_LIMIT_RE = re.compile(r"\blimit\s+(\d+)\b", re.IGNORECASE)


class AskReq(BaseModel):
    question: str


def _sanitize_sql(sql: str) -> str:
    sql = (sql or "").strip().rstrip(";").strip()
    if not sql:
        raise HTTPException(status_code=400, detail="Empty SQL from model.")
    if ";" in sql:
        raise HTTPException(status_code=400, detail="Only single-statement SQL is allowed.")
    if not re.match(r"^\s*select\b", sql, re.IGNORECASE):
        raise HTTPException(status_code=400, detail="Only SELECT statements are allowed.")
    if _FORBIDDEN.search(sql):
        raise HTTPException(status_code=400, detail="Forbidden keyword in SQL.")
    m = _LIMIT_RE.search(sql)
    if not m:
        sql = f"{sql} LIMIT 200"
    else:
        n = int(m.group(1))
        if n > 200:
            sql = _LIMIT_RE.sub("LIMIT 200", sql, count=1)
    return sql


@router.post("")
def ask_anything(req: AskReq):
    q = (req.question or "").strip()
    if not q:
        raise HTTPException(status_code=400, detail="Empty question.")

    client = _openai()
    try:
        resp = client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=800,
            messages=[
                {"role": "system", "content": ASK_ANYTHING_SYSTEM},
                {"role": "user", "content": q},
            ],
        )
        plan = json.loads(resp.choices[0].message.content or "{}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM call failed: {e}")

    sql = _sanitize_sql(plan.get("sql", ""))
    try:
        rows = query_many(sql)
    except Exception as e:
        return {
            "question": q,
            "narrative": "I couldn't run that query — try rephrasing.",
            "error": str(e),
            "sql": sql,
            "chart": plan.get("chart") or {"type": "table"},
            "columns": [],
            "rows": [],
        }

    columns = list(rows[0].keys()) if rows else []
    return {
        "question": q,
        "narrative": plan.get("narrative") or "",
        "sql": sql,
        "chart": plan.get("chart") or {"type": "table"},
        "columns": columns,
        "rows": rows,
        "row_count": len(rows),
    }


@router.get("/suggestions")
def suggestions():
    """Suggested questions shown as quick-start chips."""
    return {
        "suggestions": [
            "Top 10 customers by churn score in Amman",
            "Revenue at risk by governorate for High-risk customers",
            "Complaint count per category in the last 30 days",
            "Monthly trend of new signups for the last 12 months",
            "Average NPS by value segment",
            "How many High-risk VIP customers do we have?",
            "Top 5 most common risk reasons",
            "Conversion rate per campaign channel",
            "Customers on 5G plans by governorate",
            "Average ARPU by customer segment",
        ]
    }
