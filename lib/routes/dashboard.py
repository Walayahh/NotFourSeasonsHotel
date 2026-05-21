from fastapi import APIRouter
from lib.db import query_one, query_many, query_scalar
from lib.dates import data_today, latest_score_month, latest_network_event_date

router = APIRouter()


@router.get("/kpis")
def kpis():
    score_month = latest_score_month()

    risk_rows = query_many(
        "SELECT risk_level, COUNT(*) AS n "
        "FROM customer_churn_scores WHERE score_month = ? "
        "GROUP BY risk_level",
        [score_month],
    )
    risk_dist = {r["risk_level"]: r["n"] for r in risk_rows}
    high_risk = risk_dist.get("High", 0)

    revenue_at_risk = query_scalar(
        """
        SELECT COALESCE(SUM(cvs.arpu_jod), 0)
        FROM customer_value_segments cvs
        JOIN customer_churn_scores ccs ON cvs.customer_id = ccs.customer_id
        WHERE ccs.risk_level = 'High' AND ccs.score_month = ?
        """,
        [score_month],
    )

    # "Recent" network events = ended within 14 days of most-recent event in data.
    recent_events = query_scalar(
        """
        SELECT COUNT(*) FROM network_events
        WHERE event_end_time >= date(
            (SELECT MAX(event_end_time) FROM network_events), '-14 days')
        """
    )

    avg_nps = query_scalar(
        "SELECT ROUND(AVG(nps_score), 1) FROM customer_satisfaction "
        "WHERE survey_date >= date(?, '-30 days')",
        [data_today()],
    )

    total_customers = query_scalar("SELECT COUNT(*) FROM customers")

    return {
        "score_month": score_month,
        "data_anchor": data_today(),
        "high_risk_customers": high_risk,
        "revenue_at_risk_jod": round(revenue_at_risk or 0, 2),
        "recent_network_events": recent_events or 0,
        "avg_nps_30d": avg_nps,
        "total_customers": total_customers,
        "risk_distribution": [
            {"risk_level": k, "count": risk_dist.get(k, 0)}
            for k in ("High", "Medium", "Low")
        ],
    }


@router.get("/churn_by_region")
def churn_by_region(limit: int = 8):
    score_month = latest_score_month()
    rows = query_many(
        """
        SELECT c.governorate AS region,
               SUM(CASE WHEN ccs.risk_level = 'High' THEN 1 ELSE 0 END) AS high_risk,
               SUM(CASE WHEN ccs.risk_level = 'Medium' THEN 1 ELSE 0 END) AS medium_risk,
               SUM(CASE WHEN ccs.risk_level = 'Low' THEN 1 ELSE 0 END) AS low_risk,
               ROUND(
                 SUM(CASE WHEN ccs.risk_level = 'High' THEN cvs.arpu_jod ELSE 0 END),
                 2
               ) AS revenue_at_risk_jod
        FROM customers c
        LEFT JOIN customer_churn_scores ccs
            ON ccs.customer_id = c.customer_id AND ccs.score_month = ?
        LEFT JOIN customer_value_segments cvs
            ON cvs.customer_id = c.customer_id
        GROUP BY c.governorate
        ORDER BY revenue_at_risk_jod DESC, high_risk DESC
        LIMIT ?
        """,
        [score_month, limit],
    )
    return {"regions": rows}


@router.get("/top_risky_customers")
def top_risky_customers(limit: int = 50):
    score_month = latest_score_month()
    rows = query_many(
        """
        SELECT c.customer_id, c.full_name, c.city, c.governorate,
               c.customer_segment, c.preferred_language,
               ccs.churn_score, ccs.risk_level, ccs.main_risk_reason,
               ccs.recommended_action,
               cvs.arpu_jod, cvs.value_segment
        FROM customers c
        JOIN customer_churn_scores ccs
          ON ccs.customer_id = c.customer_id AND ccs.score_month = ?
        LEFT JOIN customer_value_segments cvs
          ON cvs.customer_id = c.customer_id
        ORDER BY ccs.churn_score DESC
        LIMIT ?
        """,
        [score_month, limit],
    )
    return {"customers": rows}


@router.get("/complaint_trend")
def complaint_trend(weeks: int = 8):
    anchor = data_today()
    rows = query_many(
        """
        SELECT strftime('%Y-%W', complaint_date) AS week,
               MIN(date(complaint_date)) AS week_start,
               COUNT(*) AS complaints
        FROM complaints
        WHERE complaint_date >= date(?, '-' || ? || ' days')
        GROUP BY week
        ORDER BY week_start ASC
        """,
        [anchor, weeks * 7],
    )
    return {"weeks": rows}
