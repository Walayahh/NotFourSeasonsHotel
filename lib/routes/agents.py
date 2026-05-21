import json
import os
from typing import Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI

from lib.db import get_customer_context, query_many
from lib.agents.prompts import (
    CHURN_RISK_SYSTEM,
    RETENTION_SYSTEM,
    COMMUNICATION_SYSTEM,
)

router = APIRouter()
_client: OpenAI | None = None


def _openai() -> OpenAI:
    global _client

    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")

        if not api_key:
            raise HTTPException(
                status_code=500,
                detail="OPENAI_API_KEY not set"
            )

        _client = OpenAI(api_key=api_key)

    return _client

def _slim_context(ctx: dict) -> dict:
    """Compact projection of the customer context suitable for an LLM prompt."""
    profile = ctx.get("profile") or {}
    churn = ctx.get("churn_score") or {}
    value = ctx.get("value_segment") or {}
    inv = ctx.get("last_invoice") or {}
    months = ctx.get("monthly_summary") or []

    return {
        "profile": {
            "customer_id": profile.get("customer_id"),
            "name": profile.get("full_name"),
            "age_group": profile.get("age_group"),
            "city": profile.get("city"),
            "governorate": profile.get("governorate"),
            "segment": profile.get("customer_segment"),
            "preferred_language": profile.get("preferred_language"),
            "status": profile.get("status"),
            "signup_date": profile.get("signup_date"),
        },
        "churn": {
            "churn_score": churn.get("churn_score"),
            "risk_level": churn.get("risk_level"),
            "main_risk_reason": churn.get("main_risk_reason"),
            "recommended_action": churn.get("recommended_action"),
        },
        "value": {
            "arpu_jod": value.get("arpu_jod"),
            "value_segment": value.get("value_segment"),
            "lifetime_months": value.get("lifetime_months"),
        },
        "last_invoice": {
            "total_jod": inv.get("total_amount_jod"),
            "payment_status": inv.get("payment_status"),
            "days_overdue": inv.get("days_overdue"),
        },
        "monthly_summary": [
            {
                "month": m.get("summary_month"),
                "revenue_jod": m.get("total_revenue_jod"),
                "data_gb": m.get("data_used_gb"),
                "voice_minutes": m.get("voice_minutes"),
                "complaints": m.get("complaints_count"),
                "support_interactions": m.get("support_interactions_count"),
                "payment_delay_days": m.get("payment_delay_days"),
            }
            for m in months
        ],
        "recent_complaints": [
            {
                "date": c.get("complaint_date"),
                "category": c.get("complaint_category"),
                "severity": c.get("severity"),
                "status": c.get("status"),
            }
            for c in (ctx.get("recent_complaints") or [])
        ],
        "satisfaction": [
            {
                "date": s.get("survey_date"),
                "nps": s.get("nps_score"),
                "csat": s.get("csat_score"),
                "sentiment": s.get("sentiment"),
            }
            for s in (ctx.get("satisfaction") or [])
        ],
        "recent_tower_events": [
            {
                "tower": e.get("tower_name"),
                "city": e.get("city"),
                "type": e.get("event_type"),
                "severity": e.get("severity"),
                "start": e.get("event_start_time"),
                "end": e.get("event_end_time"),
            }
            for e in (ctx.get("recent_tower_events") or [])
        ],
        "subscriptions": [
            {
                "plan": s.get("plan_name"),
                "category": s.get("plan_category"),
                "monthly_fee_jod": s.get("monthly_fee_jod"),
                "contract_end_date": s.get("contract_end_date"),
                "status": s.get("status"),
            }
            for s in (ctx.get("subscriptions") or [])
        ],
    }


def _call_llm(system: str, payload: dict) -> dict:
    client = _openai()
    try:
        resp = client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=600,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": json.dumps(payload, default=str)},
            ],
        )
        raw = resp.choices[0].message.content or "{}"
        return json.loads(raw)
    except json.JSONDecodeError as e:
        return {"error": "invalid_json", "detail": str(e), "raw": raw}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=502, detail=f"LLM call failed: {e}")


# -------- request models --------

class ChurnReq(BaseModel):
    customer_id: int


class RetentionReq(BaseModel):
    customer_id: int
    churn_analysis: dict


class CommReq(BaseModel):
    customer_id: int
    churn_analysis: dict
    retention_recommendation: dict


# -------- endpoints --------

@router.post("/analyze/churn")
def analyze_churn(req: ChurnReq):
    ctx = get_customer_context(req.customer_id)
    if not ctx:
        raise HTTPException(status_code=404, detail="Customer not found")
    slim = _slim_context(ctx)
    result = _call_llm(CHURN_RISK_SYSTEM, slim)
    return {
        "customer_id": req.customer_id,
        "agent": "ChurnRiskAgent",
        "churn_analysis": result,
    }


@router.post("/analyze/retention")
def analyze_retention(req: RetentionReq):
    ctx = get_customer_context(req.customer_id)
    if not ctx:
        raise HTTPException(status_code=404, detail="Customer not found")
    slim = _slim_context(ctx)
    payload = {"customer": slim, "churn_analysis": req.churn_analysis}
    result = _call_llm(RETENTION_SYSTEM, payload)
    return {
        "customer_id": req.customer_id,
        "agent": "RetentionAgent",
        "retention_recommendation": result,
    }


@router.post("/analyze/communication")
def analyze_communication(req: CommReq):
    ctx = get_customer_context(req.customer_id)
    if not ctx:
        raise HTTPException(status_code=404, detail="Customer not found")
    slim = _slim_context(ctx)
    payload = {
        "customer": slim,
        "churn_analysis": req.churn_analysis,
        "retention_recommendation": req.retention_recommendation,
    }
    result = _call_llm(COMMUNICATION_SYSTEM, payload)
    return {
        "customer_id": req.customer_id,
        "agent": "CommunicationAgent",
        "communication_draft": result,
    }


@router.get("/activity_seed")
def activity_seed(limit: int = 30):
    """Pre-built feed items from DB (no LLM). Powers the Agent Activity Feed."""
    items: list[dict[str, Any]] = []

    # ChurnRiskAgent: top high-risk customers detected
    risky = query_many(
        """
        SELECT c.customer_id, c.full_name, c.city, c.governorate,
               c.customer_segment, ccs.churn_score, ccs.risk_level,
               ccs.main_risk_reason
        FROM customers c
        JOIN customer_churn_scores ccs ON ccs.customer_id = c.customer_id
        WHERE ccs.risk_level = 'High'
          AND ccs.score_month = (SELECT MAX(score_month) FROM customer_churn_scores)
        ORDER BY ccs.churn_score DESC
        LIMIT ?
        """,
        [min(limit, 15)],
    )
    for r in risky:
        items.append({
            "agent": "ChurnRiskAgent",
            "severity": "High",
            "title": f"Detected churn risk for {r['full_name']}",
            "subtitle": f"Score {r['churn_score']:.2f} · {r['main_risk_reason']}",
            "target_type": "customer",
            "target_id": r["customer_id"],
            "target_label": f"{r['full_name']} ({r['city']})",
        })

    # NetworkAgent: severe recent events
    severe_events = query_many(
        """
        SELECT ne.event_id, ne.event_type, ne.severity, ne.affected_customers,
               ne.event_start_time, ne.event_end_time,
               t.tower_name, t.city, t.governorate
        FROM network_events ne
        JOIN network_towers t ON t.tower_id = ne.tower_id
        WHERE ne.event_end_time >= date(
            (SELECT MAX(event_end_time) FROM network_events), '-14 days')
          AND ne.severity IN ('Critical', 'High')
        ORDER BY ne.event_start_time DESC
        LIMIT ?
        """,
        [min(limit, 10)],
    )
    for e in severe_events:
        items.append({
            "agent": "NetworkAgent",
            "severity": e["severity"],
            "title": f"{e['severity']} {e['event_type']} on {e['tower_name']}",
            "subtitle": f"{e['city']} · {e['affected_customers']} customers affected",
            "target_type": "tower",
            "target_id": e["event_id"],
            "target_label": e["tower_name"],
        })

    # CommunicationAgent: complaint spikes by category last 14 days
    spikes = query_many(
        """
        SELECT complaint_category, COUNT(*) AS n
        FROM complaints
        WHERE complaint_date >= date(
            (SELECT MAX(complaint_date) FROM complaints), '-14 days')
        GROUP BY complaint_category
        ORDER BY n DESC
        LIMIT 5
        """
    )
    for s in spikes:
        items.append({
            "agent": "CommunicationAgent",
            "severity": "Medium",
            "title": f"Complaint spike: {s['complaint_category']}",
            "subtitle": f"{s['n']} complaints in last 14 days",
            "target_type": "category",
            "target_id": None,
            "target_label": s["complaint_category"],
        })

    return {"items": items[:limit]}
