import json
import random
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from FourSeasonsHotel.lib.db import query_one, query_many
from FourSeasonsHotel.lib.routes.customers import SearchFilters, _build_search_query
from FourSeasonsHotel.lib.routes.agents import _openai
from FourSeasonsHotel.lib.agents.prompts import CAMPAIGN_DESIGNER_SYSTEM

router = APIRouter()

# A handful of creative directions the LLM can rotate through to keep drafts
# visibly different across regenerations.
_CREATIVE_ANGLES = [
    "Lead with an emotional appeal — make the customer feel valued.",
    "Lead with a concrete data benefit — quantify exactly what they get.",
    "Lead with urgency — frame as a limited-time exclusive.",
    "Lead with a loyalty-reward narrative — recognize their tenure.",
    "Lead with a problem-solving tone — address their main pain point directly.",
    "Lead with surprise & delight — make the offer feel like an unexpected gift.",
]


# ---------- Past campaigns ----------

@router.get("/list")
def list_campaigns(limit: int = 30):
    """Past campaigns with response/conversion stats."""
    rows = query_many(
        """
        SELECT c.campaign_id, c.campaign_name, c.campaign_type, c.target_segment,
               c.channel, c.start_date, c.end_date, c.offer_description,
               COUNT(ccr.response_id) AS sent,
               SUM(CASE WHEN ccr.response_status IN ('Clicked','Accepted','Converted') THEN 1 ELSE 0 END) AS responded,
               SUM(CASE WHEN ccr.converted_flag = 1 THEN 1 ELSE 0 END) AS converted,
               ROUND(COALESCE(SUM(ccr.revenue_generated_jod), 0), 2) AS revenue_jod
        FROM campaigns c
        LEFT JOIN customer_campaign_responses ccr ON ccr.campaign_id = c.campaign_id
        GROUP BY c.campaign_id
        ORDER BY c.start_date DESC
        LIMIT ?
        """,
        [limit],
    )
    for r in rows:
        sent = r["sent"] or 0
        r["response_rate_pct"] = round(((r["responded"] or 0) / sent) * 100, 1) if sent else 0
        r["conversion_rate_pct"] = round(((r["converted"] or 0) / sent) * 100, 1) if sent else 0
    return {"campaigns": rows}


@router.get("/summary")
def campaign_summary():
    """Top-line stats for the Past Campaigns tab header."""
    totals = query_one(
        """
        SELECT COUNT(DISTINCT campaign_id) AS total_campaigns,
               COUNT(response_id) AS total_sent,
               SUM(CASE WHEN converted_flag = 1 THEN 1 ELSE 0 END) AS total_converted,
               ROUND(SUM(revenue_generated_jod), 0) AS total_revenue_jod
        FROM customer_campaign_responses
        """
    )
    by_channel = query_many(
        """
        SELECT channel,
               COUNT(*) AS sent,
               SUM(converted_flag) AS converted,
               ROUND(SUM(revenue_generated_jod), 0) AS revenue_jod
        FROM customer_campaign_responses
        GROUP BY channel
        ORDER BY sent DESC
        """
    )
    for c in by_channel:
        c["conversion_rate_pct"] = round((c["converted"] or 0) / c["sent"] * 100, 1) if c["sent"] else 0
    return {**(totals or {}), "by_channel": by_channel}


# ---------- Audience preview ----------

class AudienceReq(BaseModel):
    filters: SearchFilters


@router.post("/audience_preview")
def audience_preview(req: AudienceReq):
    """Run the same filter pipeline as Advanced Search and return aggregates for campaign design."""
    f = req.filters
    f.limit = 6  # sample customers only for preview
    f.offset = 0
    data_sql, data_params, count_sql, count_params = _build_search_query(f)
    sample = query_many(data_sql, data_params)
    summary = query_one(count_sql, count_params) or {"n": 0, "total_arpu": 0}

    # Distribution snapshots (without limit) — rebuild count with risk reason + segment groupings
    data_sql_all, data_params_all, _, _ = _build_search_query(
        SearchFilters(**{**f.model_dump(), "limit": 100000, "offset": 0})
    )

    risk_dist = query_many(
        f"SELECT main_risk_reason AS k, COUNT(*) AS n FROM ({data_sql_all}) "
        "GROUP BY main_risk_reason ORDER BY n DESC LIMIT 5",
        data_params_all,
    )
    seg_dist = query_many(
        f"SELECT value_segment AS k, COUNT(*) AS n FROM ({data_sql_all}) "
        "GROUP BY value_segment ORDER BY n DESC",
        data_params_all,
    )
    gov_dist = query_many(
        f"SELECT governorate AS k, COUNT(*) AS n FROM ({data_sql_all}) "
        "GROUP BY governorate ORDER BY n DESC LIMIT 6",
        data_params_all,
    )
    lang_dist = query_many(
        f"SELECT preferred_language AS k, COUNT(*) AS n FROM ({data_sql_all}) "
        "GROUP BY preferred_language",
        data_params_all,
    )

    return {
        "size": summary.get("n", 0),
        "total_arpu_jod": round(summary.get("total_arpu") or 0, 2),
        "sample_customers": sample,
        "risk_reason_distribution": risk_dist,
        "value_segment_distribution": seg_dist,
        "governorate_distribution": gov_dist,
        "language_distribution": lang_dist,
    }


# ---------- AI draft ----------

class DraftReq(BaseModel):
    filters: SearchFilters
    objective: Optional[str] = None  # e.g. "Reduce churn in VIP segment with priority support"


@router.post("/draft")
def draft_campaign(req: DraftReq):
    """Use the LLM to draft a campaign tailored to the audience defined by the filters.

    Each call injects a fresh creative angle + run_id + timestamp so the model produces
    a visibly different draft on every regeneration even when the audience is identical.
    """
    preview = audience_preview(AudienceReq(filters=req.filters))
    if preview["size"] == 0:
        raise HTTPException(status_code=400, detail="Audience is empty — broaden your filters.")

    creative_angle = random.choice(_CREATIVE_ANGLES)
    run_id = uuid.uuid4().hex[:8]

    snapshot = {
        "audience_size": preview["size"],
        "total_monthly_arpu_jod": preview["total_arpu_jod"],
        "top_risk_reasons": preview["risk_reason_distribution"],
        "value_segments": preview["value_segment_distribution"],
        "top_governorates": preview["governorate_distribution"],
        "languages": preview["language_distribution"],
        "objective": req.objective or "Retain at-risk customers and increase loyalty.",
        "creative_direction": creative_angle,
        "run_id": run_id,
        "timestamp": datetime.now().isoformat(timespec="seconds"),
        "instruction": (
            "Generate a NEW, distinct campaign each time. Do NOT reuse generic names like "
            "'VIP Loyalty Reward' — vary the wording, offer mix, and tone using the "
            "creative_direction. The campaign_name must be specific and memorable."
        ),
    }

    client = _openai()
    try:
        resp = client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            temperature=0.85,
            max_tokens=700,
            messages=[
                {"role": "system", "content": CAMPAIGN_DESIGNER_SYSTEM},
                {"role": "user", "content": json.dumps(snapshot, default=str)},
            ],
        )
        draft = json.loads(resp.choices[0].message.content or "{}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM draft failed: {e}")

    # Projection math
    rr = float(draft.get("expected_response_rate_pct") or 12) / 100
    cr = float(draft.get("expected_conversion_rate_pct") or 5) / 100
    audience = preview["size"]
    arpu_total = preview["total_arpu_jod"]
    expected_retained_revenue = round(audience * cr * (arpu_total / audience if audience else 0), 2)

    return {
        "audience": snapshot,
        "draft": draft,
        "creative_angle": creative_angle,
        "run_id": run_id,
        "projection": {
            "audience_size": audience,
            "expected_responses": int(audience * rr),
            "expected_conversions": int(audience * cr),
            "expected_monthly_revenue_retained_jod": expected_retained_revenue,
            "expected_annual_revenue_retained_jod": round(expected_retained_revenue * 12, 2),
        },
    }


# ---------- Simulated launch ----------

class LaunchReq(BaseModel):
    filters: SearchFilters
    draft: dict
    projection: Optional[dict] = None


@router.post("/launch")
def launch_campaign(req: LaunchReq):
    """Simulated launch. Returns a fake campaign_id, sample customer IDs, and a per-channel split."""
    preview_filters = SearchFilters(**{**req.filters.model_dump(), "limit": 50, "offset": 0})
    data_sql, data_params, count_sql, count_params = _build_search_query(preview_filters)
    sample = query_many(data_sql, data_params)
    summary = query_one(count_sql, count_params) or {"n": 0}

    return {
        "status": "queued",
        "campaign_id": f"DRAFT-{int(datetime.now().timestamp())}",
        "launched_at": datetime.now().isoformat(timespec="seconds"),
        "audience_size": summary.get("n", 0),
        "channel": req.draft.get("primary_channel"),
        "first_50_customer_ids": [c["customer_id"] for c in sample],
        "message": "Campaign queued for delivery. Agents will personalize per recipient.",
    }
