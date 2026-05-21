from functools import lru_cache
from lib.db import query_scalar


@lru_cache(maxsize=1)
def data_today() -> str:
    """Latest survey_date in the DB — used as 'today' so recency windows hit data."""
    return query_scalar("SELECT MAX(survey_date) FROM customer_satisfaction")


@lru_cache(maxsize=1)
def latest_score_month() -> str:
    return query_scalar("SELECT MAX(score_month) FROM customer_churn_scores")


@lru_cache(maxsize=1)
def latest_network_event_date() -> str:
    return query_scalar("SELECT MAX(event_end_time) FROM network_events")
