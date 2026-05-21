import os
import sqlite3
from functools import lru_cache
from typing import Any

DB_FILENAME = "zain_customer_360_ai_demo.db"


def _resolve_db_path() -> str:
    here = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(here, "..", "data", DB_FILENAME),
        os.path.join(os.getcwd(), "data", DB_FILENAME),
        os.path.join("/var/task", "data", DB_FILENAME),
    ]
    for c in candidates:
        if os.path.exists(c):
            return os.path.abspath(c)
    raise FileNotFoundError(f"Could not find {DB_FILENAME} in any of: {candidates}")


@lru_cache(maxsize=1)
def get_conn() -> sqlite3.Connection:
    path = _resolve_db_path()
    conn = sqlite3.connect(path, check_same_thread=False, isolation_level=None)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA query_only = ON;")
    return conn


def _to_dict(row: sqlite3.Row | None) -> dict | None:
    return dict(row) if row is not None else None


def query_one(sql: str, params: list | tuple = ()) -> dict | None:
    cur = get_conn().execute(sql, params)
    return _to_dict(cur.fetchone())


def query_many(sql: str, params: list | tuple = ()) -> list[dict]:
    cur = get_conn().execute(sql, params)
    return [dict(r) for r in cur.fetchall()]


def query_scalar(sql: str, params: list | tuple = ()) -> Any:
    row = query_one(sql, params)
    if row is None:
        return None
    return next(iter(row.values()))


def get_customer_context(customer_id: int) -> dict:
    """Pull every slice the agents and twin page need for a single customer."""
    profile = query_one("SELECT * FROM customers WHERE customer_id = ?", [customer_id])
    if profile is None:
        return {}

    account = query_one("SELECT * FROM accounts WHERE customer_id = ?", [customer_id])

    churn_score = query_one(
        "SELECT * FROM customer_churn_scores "
        "WHERE customer_id = ? ORDER BY score_month DESC LIMIT 1",
        [customer_id],
    )

    value_segment = query_one(
        "SELECT * FROM customer_value_segments "
        "WHERE customer_id = ? ORDER BY segment_month DESC LIMIT 1",
        [customer_id],
    )

    monthly_summary = query_many(
        "SELECT * FROM customer_monthly_summary "
        "WHERE customer_id = ? ORDER BY summary_month DESC LIMIT 6",
        [customer_id],
    )

    recent_complaints = query_many(
        "SELECT * FROM complaints "
        "WHERE customer_id = ? ORDER BY complaint_date DESC LIMIT 5",
        [customer_id],
    )

    support_history = query_many(
        "SELECT * FROM support_interactions "
        "WHERE customer_id = ? ORDER BY interaction_datetime DESC LIMIT 5",
        [customer_id],
    )

    satisfaction = query_many(
        "SELECT * FROM customer_satisfaction "
        "WHERE customer_id = ? ORDER BY survey_date DESC LIMIT 5",
        [customer_id],
    )

    last_invoice = query_one(
        "SELECT i.*, p.payment_status AS pay_status, p.payment_date "
        "FROM invoices i "
        "JOIN accounts a ON i.account_id = a.account_id "
        "LEFT JOIN payments p ON p.invoice_id = i.invoice_id "
        "WHERE a.customer_id = ? "
        "ORDER BY i.issue_date DESC LIMIT 1",
        [customer_id],
    )

    campaign_history = query_many(
        "SELECT ccr.*, c.campaign_name, c.campaign_type, c.offer_description "
        "FROM customer_campaign_responses ccr "
        "JOIN campaigns c ON ccr.campaign_id = c.campaign_id "
        "WHERE ccr.customer_id = ? "
        "ORDER BY ccr.sent_date DESC LIMIT 5",
        [customer_id],
    )

    subscriptions = query_many(
        "SELECT s.*, p.plan_name, p.plan_category, p.monthly_fee_jod, "
        "       p.data_allowance_gb, p.local_minutes, p.technology "
        "FROM subscriptions s JOIN plans p ON s.plan_id = p.plan_id "
        "WHERE s.customer_id = ?",
        [customer_id],
    )

    # "Recent" tower events on towers this customer's CDRs touched
    # in the last 30 days of available data.
    recent_tower_events = query_many(
        """
        SELECT DISTINCT ne.event_id, ne.tower_id, ne.event_type, ne.severity,
                        ne.event_start_time, ne.event_end_time, ne.affected_customers,
                        t.tower_name, t.city, t.governorate
        FROM network_events ne
        JOIN network_towers t ON t.tower_id = ne.tower_id
        WHERE ne.tower_id IN (
            SELECT DISTINCT cdr.tower_id
            FROM call_detail_records cdr
            JOIN subscriptions s ON cdr.subscription_id = s.subscription_id
            WHERE s.customer_id = ?
        )
        AND ne.event_end_time >= date(
            (SELECT MAX(event_end_time) FROM network_events), '-30 days')
        ORDER BY ne.event_start_time DESC
        LIMIT 5
        """,
        [customer_id],
    )

    # Fallback: events in the customer's home governorate if CDR-based set is empty.
    if not recent_tower_events and profile.get("governorate"):
        recent_tower_events = query_many(
            """
            SELECT ne.event_id, ne.tower_id, ne.event_type, ne.severity,
                   ne.event_start_time, ne.event_end_time, ne.affected_customers,
                   t.tower_name, t.city, t.governorate
            FROM network_events ne
            JOIN network_towers t ON t.tower_id = ne.tower_id
            WHERE t.governorate = ?
              AND ne.event_end_time >= date(
                  (SELECT MAX(event_end_time) FROM network_events), '-30 days')
            ORDER BY ne.event_start_time DESC
            LIMIT 5
            """,
            [profile["governorate"]],
        )

    return {
        "profile": profile,
        "account": account,
        "churn_score": churn_score,
        "value_segment": value_segment,
        "monthly_summary": monthly_summary,
        "recent_complaints": recent_complaints,
        "support_history": support_history,
        "satisfaction": satisfaction,
        "last_invoice": last_invoice,
        "campaign_history": campaign_history,
        "subscriptions": subscriptions,
        "recent_tower_events": recent_tower_events,
    }
