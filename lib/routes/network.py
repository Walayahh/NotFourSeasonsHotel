from fastapi import APIRouter
from FourSeasonsHotel.lib.db import query_many

router = APIRouter()


@router.get("/towers")
def towers():
    """All towers + their latest event severity (for map color coding)."""
    rows = query_many(
        """
        SELECT t.tower_id, t.tower_name, t.city, t.governorate, t.technology,
               t.latitude_approx AS lat, t.longitude_approx AS lon,
               t.status, t.capacity_level,
               (SELECT ne.severity FROM network_events ne
                WHERE ne.tower_id = t.tower_id
                ORDER BY ne.event_start_time DESC LIMIT 1) AS last_severity,
               (SELECT ne.event_type FROM network_events ne
                WHERE ne.tower_id = t.tower_id
                ORDER BY ne.event_start_time DESC LIMIT 1) AS last_event_type,
               (SELECT MAX(ne.event_end_time) FROM network_events ne
                WHERE ne.tower_id = t.tower_id) AS last_event_end,
               (SELECT COUNT(*) FROM network_events ne
                WHERE ne.tower_id = t.tower_id
                  AND ne.event_end_time >= date(
                      (SELECT MAX(event_end_time) FROM network_events),
                      '-14 days')
               ) AS recent_event_count
        FROM network_towers t
        """
    )
    return {"towers": rows}


@router.get("/events")
def events(recent: bool = True, limit: int = 20):
    if recent:
        rows = query_many(
            """
            SELECT ne.*, t.tower_name, t.city, t.governorate
            FROM network_events ne
            JOIN network_towers t ON t.tower_id = ne.tower_id
            WHERE ne.event_end_time >= date(
                (SELECT MAX(event_end_time) FROM network_events), '-14 days')
            ORDER BY ne.severity = 'Critical' DESC,
                     ne.severity = 'High' DESC,
                     ne.event_start_time DESC
            LIMIT ?
            """,
            [limit],
        )
    else:
        rows = query_many(
            """
            SELECT ne.*, t.tower_name, t.city, t.governorate
            FROM network_events ne
            JOIN network_towers t ON t.tower_id = ne.tower_id
            ORDER BY ne.event_start_time DESC
            LIMIT ?
            """,
            [limit],
        )
    return {"events": rows}
