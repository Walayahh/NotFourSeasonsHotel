from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from FourSeasonsHotel.lib.db import query_one, query_many, query_scalar, get_customer_context
from FourSeasonsHotel.lib.dates import latest_score_month

router = APIRouter()


# ---------- Advanced Search ----------

class SearchFilters(BaseModel):
    text: Optional[str] = None
    governorates: Optional[list[str]] = None
    cities: Optional[list[str]] = None
    customer_segments: Optional[list[str]] = None
    customer_types: Optional[list[str]] = None
    age_groups: Optional[list[str]] = None
    genders: Optional[list[str]] = None
    languages: Optional[list[str]] = None
    statuses: Optional[list[str]] = None
    risk_levels: Optional[list[str]] = None
    value_segments: Optional[list[str]] = None
    main_risk_reasons: Optional[list[str]] = None
    plan_categories: Optional[list[str]] = None
    plan_technologies: Optional[list[str]] = None
    churn_min: Optional[float] = None
    churn_max: Optional[float] = None
    arpu_min: Optional[float] = None
    arpu_max: Optional[float] = None
    has_open_complaints: Optional[bool] = None
    signup_after: Optional[str] = None
    signup_before: Optional[str] = None
    sort: Optional[str] = "churn_desc"
    limit: int = 50
    offset: int = 0


def _in_clause(field: str, values: list[str], params: list) -> str:
    placeholders = ",".join("?" for _ in values)
    params.extend(values)
    return f"{field} IN ({placeholders})"


@router.get("/filter_facets")
def filter_facets():
    """Returns dropdown options + counts for the Advanced Search filter panel."""
    def distinct(sql: str) -> list[str]:
        return [r[next(iter(r))] for r in query_many(sql) if r[next(iter(r))]]

    return {
        "governorates": distinct("SELECT DISTINCT governorate AS v FROM customers ORDER BY v"),
        "cities": distinct("SELECT DISTINCT city AS v FROM customers ORDER BY v"),
        "customer_segments": distinct("SELECT DISTINCT customer_segment AS v FROM customers ORDER BY v"),
        "customer_types": distinct("SELECT DISTINCT customer_type AS v FROM customers ORDER BY v"),
        "age_groups": distinct("SELECT DISTINCT age_group AS v FROM customers ORDER BY v"),
        "genders": distinct("SELECT DISTINCT gender AS v FROM customers ORDER BY v"),
        "languages": distinct("SELECT DISTINCT preferred_language AS v FROM customers ORDER BY v"),
        "statuses": distinct("SELECT DISTINCT status AS v FROM customers ORDER BY v"),
        "risk_levels": ["High", "Medium", "Low"],
        "value_segments": distinct("SELECT DISTINCT value_segment AS v FROM customer_value_segments ORDER BY v"),
        "main_risk_reasons": distinct("SELECT DISTINCT main_risk_reason AS v FROM customer_churn_scores ORDER BY v"),
        "plan_categories": distinct("SELECT DISTINCT plan_category AS v FROM plans ORDER BY v"),
        "plan_technologies": distinct("SELECT DISTINCT technology AS v FROM plans ORDER BY v"),
        "ranges": {
            "churn": {"min": 0.0, "max": 1.0},
            "arpu": query_one(
                "SELECT ROUND(MIN(arpu_jod),0) AS min, ROUND(MAX(arpu_jod),0) AS max FROM customer_value_segments"
            ),
        },
        "sort_options": [
            {"key": "churn_desc", "label": "Churn score (high → low)"},
            {"key": "churn_asc", "label": "Churn score (low → high)"},
            {"key": "arpu_desc", "label": "ARPU (high → low)"},
            {"key": "arpu_asc", "label": "ARPU (low → high)"},
            {"key": "signup_desc", "label": "Signup date (newest)"},
            {"key": "signup_asc", "label": "Signup date (oldest)"},
            {"key": "name_asc", "label": "Name (A → Z)"},
        ],
    }


def _build_search_query(f: SearchFilters) -> tuple[str, list, str, list]:
    """Returns (data_sql, data_params, count_sql, count_params)."""
    score_month = latest_score_month()
    where = ["ccs.score_month = ?"]
    params: list = [score_month]

    if f.text:
        like = f"%{f.text}%"
        where.append("(c.full_name LIKE ? OR c.phone_number LIKE ? OR c.email LIKE ? OR CAST(c.customer_id AS TEXT) = ?)")
        params.extend([like, like, like, f.text])

    if f.governorates:
        where.append(_in_clause("c.governorate", f.governorates, params))
    if f.cities:
        where.append(_in_clause("c.city", f.cities, params))
    if f.customer_segments:
        where.append(_in_clause("c.customer_segment", f.customer_segments, params))
    if f.customer_types:
        where.append(_in_clause("c.customer_type", f.customer_types, params))
    if f.age_groups:
        where.append(_in_clause("c.age_group", f.age_groups, params))
    if f.genders:
        where.append(_in_clause("c.gender", f.genders, params))
    if f.languages:
        where.append(_in_clause("c.preferred_language", f.languages, params))
    if f.statuses:
        where.append(_in_clause("c.status", f.statuses, params))
    if f.risk_levels:
        where.append(_in_clause("ccs.risk_level", f.risk_levels, params))
    if f.value_segments:
        where.append(_in_clause("cvs.value_segment", f.value_segments, params))
    if f.main_risk_reasons:
        where.append(_in_clause("ccs.main_risk_reason", f.main_risk_reasons, params))

    if f.churn_min is not None:
        where.append("ccs.churn_score >= ?"); params.append(f.churn_min)
    if f.churn_max is not None:
        where.append("ccs.churn_score <= ?"); params.append(f.churn_max)
    if f.arpu_min is not None:
        where.append("cvs.arpu_jod >= ?"); params.append(f.arpu_min)
    if f.arpu_max is not None:
        where.append("cvs.arpu_jod <= ?"); params.append(f.arpu_max)
    if f.signup_after:
        where.append("c.signup_date >= ?"); params.append(f.signup_after)
    if f.signup_before:
        where.append("c.signup_date <= ?"); params.append(f.signup_before)

    if f.plan_categories or f.plan_technologies:
        plan_where = ["s.customer_id = c.customer_id"]
        sub_params: list = []
        if f.plan_categories:
            plan_where.append(_in_clause("p.plan_category", f.plan_categories, sub_params))
        if f.plan_technologies:
            plan_where.append(_in_clause("p.technology", f.plan_technologies, sub_params))
        where.append(
            "EXISTS (SELECT 1 FROM subscriptions s JOIN plans p ON s.plan_id = p.plan_id "
            f"WHERE {' AND '.join(plan_where)})"
        )
        params.extend(sub_params)

    if f.has_open_complaints:
        where.append(
            "EXISTS (SELECT 1 FROM complaints cx WHERE cx.customer_id = c.customer_id "
            "AND cx.status NOT IN ('Resolved','Closed'))"
        )

    where_sql = " AND ".join(where)

    sort_map = {
        "churn_desc": "ccs.churn_score DESC",
        "churn_asc":  "ccs.churn_score ASC",
        "arpu_desc":  "cvs.arpu_jod IS NULL, cvs.arpu_jod DESC",
        "arpu_asc":   "cvs.arpu_jod ASC",
        "signup_desc": "c.signup_date DESC",
        "signup_asc":  "c.signup_date ASC",
        "name_asc":    "c.full_name ASC",
    }
    order = sort_map.get(f.sort or "churn_desc", "ccs.churn_score DESC")

    base_from = """
        FROM customers c
        JOIN customer_churn_scores ccs ON ccs.customer_id = c.customer_id
        LEFT JOIN customer_value_segments cvs ON cvs.customer_id = c.customer_id
    """

    data_sql = f"""
        SELECT c.customer_id, c.full_name, c.city, c.governorate,
               c.customer_segment, c.preferred_language, c.status,
               c.age_group, c.gender, c.signup_date,
               ccs.churn_score, ccs.risk_level, ccs.main_risk_reason,
               ccs.recommended_action,
               cvs.arpu_jod, cvs.value_segment, cvs.lifetime_months
        {base_from}
        WHERE {where_sql}
        ORDER BY {order}
        LIMIT ? OFFSET ?
    """
    data_params = list(params) + [f.limit, f.offset]

    count_sql = f"SELECT COUNT(*) AS n, COALESCE(SUM(cvs.arpu_jod),0) AS total_arpu {base_from} WHERE {where_sql}"
    count_params = list(params)

    return data_sql, data_params, count_sql, count_params


@router.post("/search")
def search_customers(filters: SearchFilters):
    data_sql, data_params, count_sql, count_params = _build_search_query(filters)
    rows = query_many(data_sql, data_params)
    summary = query_one(count_sql, count_params) or {"n": 0, "total_arpu": 0}
    return {
        "customers": rows,
        "total": summary.get("n", 0),
        "total_arpu_jod": round(summary.get("total_arpu") or 0, 2),
        "limit": filters.limit,
        "offset": filters.offset,
    }


@router.post("/search_aggregates")
def search_aggregates(filters: SearchFilters):
    """Aggregated analytics over the full filtered cohort (no pagination).

    Powers the chart strip on the Advanced Search page so users see distributions
    that update live with their filter selections.
    """
    # Rebuild the query with no limit/offset so aggregates cover the entire cohort
    full = SearchFilters(**{**filters.model_dump(), "limit": 100000, "offset": 0})
    data_sql, data_params, count_sql, count_params = _build_search_query(full)

    summary = query_one(count_sql, count_params) or {"n": 0, "total_arpu": 0}
    total = summary.get("n", 0)

    kpis = query_one(
        f"""
        SELECT
            ROUND(AVG(churn_score), 3) AS avg_churn,
            ROUND(AVG(arpu_jod), 2)    AS avg_arpu,
            SUM(CASE WHEN risk_level = 'High'   THEN 1 ELSE 0 END) AS high_risk_count,
            SUM(CASE WHEN risk_level = 'Medium' THEN 1 ELSE 0 END) AS medium_risk_count,
            SUM(CASE WHEN risk_level = 'Low'    THEN 1 ELSE 0 END) AS low_risk_count,
            ROUND(SUM(CASE WHEN risk_level = 'High' THEN arpu_jod ELSE 0 END), 2) AS revenue_at_risk_jod
        FROM ({data_sql})
        """,
        data_params,
    ) or {}

    risk_distribution = query_many(
        f"""
        SELECT risk_level AS k, COUNT(*) AS n
        FROM ({data_sql})
        GROUP BY risk_level
        """,
        data_params,
    )

    value_segment_distribution = query_many(
        f"""
        SELECT value_segment AS k,
               COUNT(*) AS n,
               ROUND(AVG(arpu_jod), 2) AS avg_arpu
        FROM ({data_sql})
        GROUP BY value_segment
        """,
        data_params,
    )

    governorate_stack = query_many(
        f"""
        SELECT governorate AS k,
               SUM(CASE WHEN risk_level = 'High'   THEN 1 ELSE 0 END) AS high,
               SUM(CASE WHEN risk_level = 'Medium' THEN 1 ELSE 0 END) AS medium,
               SUM(CASE WHEN risk_level = 'Low'    THEN 1 ELSE 0 END) AS low,
               COUNT(*) AS total
        FROM ({data_sql})
        GROUP BY governorate
        ORDER BY total DESC
        LIMIT 10
        """,
        data_params,
    )

    top_risk_reasons = query_many(
        f"""
        SELECT main_risk_reason AS k, COUNT(*) AS n
        FROM ({data_sql})
        WHERE main_risk_reason IS NOT NULL
        GROUP BY main_risk_reason
        ORDER BY n DESC
        LIMIT 6
        """,
        data_params,
    )

    # Churn histogram — bin churn scores into deciles
    churn_histogram = query_many(
        f"""
        SELECT CAST(MIN(churn_score * 10, 9) AS INTEGER) AS bin, COUNT(*) AS n
        FROM ({data_sql})
        WHERE churn_score IS NOT NULL
        GROUP BY bin
        ORDER BY bin
        """,
        data_params,
    )

    # Random sample for the ARPU × Churn scatter (cap at ~300 points so the chart stays snappy)
    scatter_sample = query_many(
        f"""
        SELECT customer_id, full_name, churn_score, arpu_jod, risk_level
        FROM ({data_sql})
        WHERE arpu_jod IS NOT NULL AND churn_score IS NOT NULL
        ORDER BY RANDOM()
        LIMIT 300
        """,
        data_params,
    )

    return {
        "total": total,
        "total_arpu_jod": round(summary.get("total_arpu") or 0, 2),
        "kpis": {
            "avg_churn":          kpis.get("avg_churn") or 0,
            "avg_arpu":           kpis.get("avg_arpu") or 0,
            "high_risk_count":    kpis.get("high_risk_count") or 0,
            "medium_risk_count":  kpis.get("medium_risk_count") or 0,
            "low_risk_count":     kpis.get("low_risk_count") or 0,
            "revenue_at_risk_jod": kpis.get("revenue_at_risk_jod") or 0,
        },
        "risk_distribution":          risk_distribution,
        "value_segment_distribution": value_segment_distribution,
        "governorate_stack":          governorate_stack,
        "top_risk_reasons":           top_risk_reasons,
        "churn_histogram":            churn_histogram,
        "scatter_sample":             scatter_sample,
    }


# ---------- Existing endpoints ----------


@router.get("")
def list_customers(
    search: Optional[str] = None,
    risk: Optional[str] = Query(None, description="High | Medium | Low"),
    limit: int = 50,
):
    score_month = latest_score_month()
    where = ["ccs.score_month = ?"]
    params: list = [score_month]

    if search:
        where.append("(c.full_name LIKE ? OR c.phone_number LIKE ? OR CAST(c.customer_id AS TEXT) = ?)")
        like = f"%{search}%"
        params.extend([like, like, search])

    if risk in ("High", "Medium", "Low"):
        where.append("ccs.risk_level = ?")
        params.append(risk)

    where_clause = " AND ".join(where)
    params.append(limit)

    rows = query_many(
        f"""
        SELECT c.customer_id, c.full_name, c.city, c.governorate,
               c.customer_segment, c.preferred_language, c.status,
               ccs.churn_score, ccs.risk_level, ccs.main_risk_reason,
               cvs.arpu_jod, cvs.value_segment
        FROM customers c
        JOIN customer_churn_scores ccs ON ccs.customer_id = c.customer_id
        LEFT JOIN customer_value_segments cvs ON cvs.customer_id = c.customer_id
        WHERE {where_clause}
        ORDER BY ccs.churn_score DESC
        LIMIT ?
        """,
        params,
    )
    return {"customers": rows}


def _twin_signals(ctx: dict) -> list[dict]:
    """Derive the 4 mini-cards from the customer context."""
    signals: list[dict] = []

    # Network quality — count of recent events on this customer's towers
    net_events = ctx.get("recent_tower_events") or []
    net_severity = "Low"
    if any(e["severity"] in ("High", "Critical") for e in net_events):
        net_severity = "High"
    elif any(e["severity"] == "Medium" for e in net_events):
        net_severity = "Medium"
    signals.append({
        "key": "network_quality",
        "label": "Network Quality",
        "value": f"{len(net_events)} recent events",
        "severity": net_severity,
        "trend": "down" if len(net_events) >= 2 else "stable",
    })

    # Payment health — days_overdue on last invoice
    inv = ctx.get("last_invoice") or {}
    days_overdue = inv.get("days_overdue") or 0
    pay_sev = "Low"
    if days_overdue >= 14:
        pay_sev = "High"
    elif days_overdue >= 5:
        pay_sev = "Medium"
    signals.append({
        "key": "payment_health",
        "label": "Payment Health",
        "value": f"{days_overdue} days overdue" if days_overdue else "On time",
        "severity": pay_sev,
        "trend": "down" if days_overdue >= 5 else "stable",
    })

    # Usage trend — this month data vs 3-month avg
    months = ctx.get("monthly_summary") or []
    usage_sev = "Low"
    usage_trend = "stable"
    usage_label = "No data"
    if len(months) >= 2:
        current = months[0].get("data_used_gb") or 0
        history = [m.get("data_used_gb") or 0 for m in months[1:4]]
        avg_hist = sum(history) / len(history) if history else 0
        delta_pct = ((current - avg_hist) / avg_hist * 100) if avg_hist else 0
        usage_label = f"{current:.1f} GB ({delta_pct:+.0f}% vs 3-mo avg)"
        if delta_pct <= -25:
            usage_sev, usage_trend = "High", "down"
        elif delta_pct <= -10:
            usage_sev, usage_trend = "Medium", "down"
        elif delta_pct >= 10:
            usage_trend = "up"
    signals.append({
        "key": "usage_trend",
        "label": "Usage Trend",
        "value": usage_label,
        "severity": usage_sev,
        "trend": usage_trend,
    })

    # Complaint intensity — open complaints + last category
    comps = ctx.get("recent_complaints") or []
    open_complaints = sum(1 for c in comps if c.get("status") not in ("Resolved", "Closed"))
    last_cat = comps[0].get("complaint_category") if comps else None
    comp_sev = "Low"
    if open_complaints >= 2:
        comp_sev = "High"
    elif open_complaints == 1:
        comp_sev = "Medium"
    signals.append({
        "key": "complaint_intensity",
        "label": "Complaint Intensity",
        "value": f"{open_complaints} open"
                 + (f" · last: {last_cat}" if last_cat else ""),
        "severity": comp_sev,
        "trend": "down" if open_complaints >= 1 else "stable",
    })

    return signals


@router.get("/{customer_id}/profile")
def customer_profile(customer_id: int):
    ctx = get_customer_context(customer_id)
    if not ctx:
        raise HTTPException(status_code=404, detail="Customer not found")

    churn_score = (ctx.get("churn_score") or {}).get("churn_score") or 0
    health_score = round(max(0.0, min(1.0, 1.0 - churn_score)) * 100, 1)

    return {
        **ctx,
        "health_score": health_score,
        "twin_signals": _twin_signals(ctx),
    }


@router.get("/{customer_id}/monthly_trend")
def monthly_trend(customer_id: int):
    rows = query_many(
        "SELECT * FROM customer_monthly_summary "
        "WHERE customer_id = ? ORDER BY summary_month ASC",
        [customer_id],
    )
    return {"months": rows}
