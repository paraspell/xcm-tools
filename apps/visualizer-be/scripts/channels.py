#!/usr/bin/env python3

import os
import time
import random
import threading
from collections import deque

import requests
import psycopg2
from psycopg2 import sql, extras
from dotenv import load_dotenv

SUBSCAN_BASES = [
    "https://polkadot.api.subscan.io",
    "https://kusama.api.subscan.io",
    "https://westend.api.subscan.io",
    "https://paseo.api.subscan.io",
]


class RateLimiter:
    def __init__(self, max_calls: int, period_seconds: float):
        self.max_calls = max_calls
        self.period = period_seconds
        self._calls = deque()
        self._lock = threading.Lock()

    def acquire(self):
        with self._lock:
            now = time.monotonic()
            # drop timestamps outside of the current window
            while self._calls and (now - self._calls[0]) > self.period:
                self._calls.popleft()

            if len(self._calls) >= self.max_calls:
                sleep_for = self.period - (now - self._calls[0])
                if sleep_for > 0:
                    time.sleep(sleep_for)
                # re-check window after sleeping
                now = time.monotonic()
                while self._calls and (now - self._calls[0]) > self.period:
                    self._calls.popleft()

            self._calls.append(now)


RATE_LIMITER = RateLimiter(max_calls=5, period_seconds=1.0)


def _rate_limited_post(url, headers, payload, timeout):
    max_retries = 4
    backoff_base = 0.5

    for attempt in range(max_retries + 1):
        RATE_LIMITER.acquire()
        try:
            r = requests.post(url, headers=headers, json=payload, timeout=timeout)
        except requests.RequestException as e:
            # network/transient error; retry with backoff
            if attempt < max_retries:
                time.sleep(backoff_base * (2**attempt) + random.uniform(0, 0.1))
                continue
            raise

        # If not rate-limited, break out
        if r.status_code not in (429, 500, 502, 503, 504):
            r.raise_for_status()
            return r

        # Handle retryable statuses
        if attempt < max_retries:
            retry_after = r.headers.get("Retry-After")
            if retry_after:
                try:
                    sleep_for = float(retry_after)
                except ValueError:
                    sleep_for = backoff_base * (2**attempt)
            else:
                sleep_for = backoff_base * (2**attempt)
            time.sleep(sleep_for + random.uniform(0, 0.1))
            continue

        # Exhausted retries
        r.raise_for_status()


def get_xcm_channels(base_url, api_key=None):
    url = f"{base_url}/api/scan/xcm/channels"
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if api_key:
        headers["X-API-Key"] = api_key
    payload = {"row": 100, "page": 0}

    r = _rate_limited_post(url, headers, payload, timeout=30)
    data = r.json()
    if data.get("code", 0) != 0:
        raise RuntimeError(f"Subscan error ({base_url}): {data.get('message')}")
    return (data.get("data") or {}).get("list", []) or []


def map_to_schema(row, ecosystem):
    def pick(*names):
        for n in names:
            if n in row and row[n] is not None:
                return row[n]
        return None

    return {
        "ecosystem": ecosystem,
        "sender": pick("sender", "source_para_id", "source", "from_para_id"),
        "recipient": pick("recipient", "dest_para_id", "destination", "to_para_id"),
        "status": pick("status"),
        "transfer_count": pick("transfer_count"),
        "message_count": pick("message_count"),
        "active_at": pick("active_at"),
        "proposed_max_capacity": pick("proposed_max_capacity", "max_capacity"),
        "proposed_max_message_size": pick(
            "proposed_max_message_size", "max_message_size"
        ),
    }


CREATE_TABLE_SQL = """
CREATE TABLE public.channels (
    id SERIAL PRIMARY KEY,
    ecosystem TEXT NOT NULL,
    sender INTEGER NOT NULL,
    recipient INTEGER NOT NULL,
    status VARCHAR(255),
    transfer_count INTEGER,
    message_count INTEGER,
    active_at BIGINT,
    proposed_max_capacity INTEGER,
    proposed_max_message_size INTEGER,
    UNIQUE (ecosystem, sender, recipient)
);
"""


def recreate_and_load(conn, rows):
    cols = [
        "ecosystem",
        "sender",
        "recipient",
        "status",
        "transfer_count",
        "message_count",
        "active_at",
        "proposed_max_capacity",
        "proposed_max_message_size",
    ]
    values = [[r.get(c) for c in cols] for r in rows]

    try:
        with conn.cursor() as cur:
            cur.execute("BEGIN;")
            cur.execute("DROP TABLE IF EXISTS public.channels;")
            cur.execute(CREATE_TABLE_SQL)
            insert_sql = sql.SQL(
                """
                INSERT INTO public.channels ({cols})
                VALUES %s
                ON CONFLICT (ecosystem, sender, recipient) DO UPDATE SET
                    status = EXCLUDED.status,
                    transfer_count = EXCLUDED.transfer_count,
                    message_count = EXCLUDED.message_count,
                    active_at = EXCLUDED.active_at,
                    proposed_max_capacity = EXCLUDED.proposed_max_capacity,
                    proposed_max_message_size = EXCLUDED.proposed_max_message_size;
            """
            ).format(cols=sql.SQL(", ").join(map(sql.Identifier, cols)))
            extras.execute_values(
                cur, insert_sql.as_string(conn), values, page_size=500
            )
        conn.commit()
    except Exception:
        conn.rollback()
        raise


def _post_json(url, payload, api_key=None, timeout=30):
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if api_key:
        headers["X-API-Key"] = api_key

    r = _rate_limited_post(url, headers, payload, timeout)
    data = r.json()
    if data.get("code", 0) != 0:
        raise RuntimeError(f"Subscan error ({url}): {data.get('message')}")
    return data


def get_parachain_stats(base_url, api_key=None):
    url = f"{base_url}/api/scan/xcm/parachain/stat"

    # DOWN: relay -> para (DMP)
    down_payload = {"direction": "out"}
    down = _post_json(url, down_payload, api_key=api_key)
    down_rows = down.get("data") or []

    # UP: para -> relay (UMP)
    up_payload = {"direction": "in"}
    up = _post_json(url, up_payload, api_key=api_key)
    up_rows = up.get("data") or []

    normalized = []

    # Map DOWN rows
    for r in down_rows:
        para_id = r.get("recipient")
        if para_id is None:
            continue
        normalized.append(
            {
                "ecosystem": base_url.split("//")[1].split(".")[0],
                "sender": 0,
                "recipient": int(para_id),
                "status": "accepted",
                "transfer_count": int(r.get("transfer_total", 0)),
                "message_count": int(r.get("message_total", 0)),
                "active_at": down.get("generated_at"),
                "proposed_max_capacity": 1000,
                "proposed_max_message_size": 102400,
            }
        )

    # Map UP rows
    for r in up_rows:
        para_id = r.get("sender")
        if para_id is None:
            continue
        normalized.append(
            {
                "ecosystem": base_url.split("//")[1].split(".")[0],
                "sender": int(para_id),
                "recipient": 0,
                "status": "accepted",
                "transfer_count": int(r.get("transfer_total", 0)),
                "message_count": int(r.get("message_total", 0)),
                "active_at": up.get("generated_at"),
                "proposed_max_capacity": 1000,
                "proposed_max_message_size": 102400,
            }
        )

    return normalized


def main(min_rows=10):
    load_dotenv()
    db_params = dict(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
        user=os.getenv("DB_USER") or "",
        password=os.getenv("DB_PASS") or "",
        dbname=os.getenv("DB_NAME") or "",
    )

    api_key = os.getenv("SUBSCAN_API_KEY")

    combined = []
    for base_url in SUBSCAN_BASES:
        ecosystem = base_url.split("//")[1].split(".")[0]

        # HRMP channel metadata
        raw_channels = get_xcm_channels(base_url, api_key=api_key)
        mapped_channels = [map_to_schema(r, ecosystem) for r in raw_channels]
        print(f"[{ecosystem}]: fetched {len(mapped_channels)} HRMP channel rows")
        combined.extend(mapped_channels)

        # Relay <-> Parachain stats (UMP/DMP)
        relay_stats = get_parachain_stats(base_url, api_key=api_key)
        print(f"[{ecosystem}]: fetched {len(relay_stats)} relay <-> para stat rows")
        combined.extend(relay_stats)

    if len(combined) < min_rows:
        raise RuntimeError(
            f"Only {len(combined)} rows fetched (<{min_rows}); aborting without touching DB."
        )

    with psycopg2.connect(**db_params) as conn:
        recreate_and_load(conn, combined)

    print(f"Channels table refreshed successfully. Total: {len(combined)}")


if __name__ == "__main__":
    main()
