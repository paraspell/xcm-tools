#!/usr/bin/env python3
import os
import time
import argparse
import random
import threading
from collections import deque

import requests
import psycopg2
from psycopg2 import extras
from dotenv import load_dotenv

SUBSCAN_BASES = [
    "https://polkadot.api.subscan.io",
    "https://kusama.api.subscan.io",
    "https://westend.api.subscan.io",
    "https://paseo.api.subscan.io",
]

DEFAULT_PAGE_SIZE = 100
MAX_BACKOFF_SECONDS = 60


class RateLimiter:
    def __init__(self, max_calls: int, period_seconds: float):
        self.max_calls = max_calls
        self.period = period_seconds
        self._calls = deque()
        self._lock = threading.Lock()

    def acquire(self):
        with self._lock:
            now = time.monotonic()
            # drop timestamps that are outside the window
            while self._calls and (now - self._calls[0]) > self.period:
                self._calls.popleft()

            if len(self._calls) >= self.max_calls:
                sleep_for = self.period - (now - self._calls[0])
                if sleep_for > 0:
                    time.sleep(sleep_for)
                # refresh window after sleeping
                now = time.monotonic()
                while self._calls and (now - self._calls[0]) > self.period:
                    self._calls.popleft()

            self._calls.append(now)


RATE_LIMITER = RateLimiter(max_calls=5, period_seconds=1.0)


# SQL messages
CREATE_MESSAGES_SQL = """
CREATE TABLE IF NOT EXISTS public.messages (
    ecosystem TEXT NOT NULL,
    message_hash VARCHAR NOT NULL,
    origin_event_index VARCHAR,
    from_account_id VARCHAR,
    origin_para_id INTEGER,
    origin_block_timestamp BIGINT,
    relayed_block_timestamp BIGINT,
    block_num BIGINT,
    status VARCHAR,
    relayed_event_index VARCHAR,
    dest_event_index VARCHAR,
    dest_para_id INTEGER,
    to_account_id VARCHAR,
    confirm_block_timestamp BIGINT,
    extrinsic_index VARCHAR,
    relayed_extrinsic_index VARCHAR,
    dest_extrinsic_index VARCHAR,
    child_para_id INTEGER,
    child_dest VARCHAR,
    protocol VARCHAR,
    message_type VARCHAR,
    unique_id VARCHAR,
    xcm_version INTEGER,
    assets JSONB,
    PRIMARY KEY (ecosystem, message_hash)
);
"""

DROP_MESSAGES_SQL = "DROP TABLE IF EXISTS public.messages;"

UPSERT_SQL = """
INSERT INTO public.messages (
    ecosystem, message_hash, origin_event_index, from_account_id, origin_para_id,
    origin_block_timestamp, relayed_block_timestamp, block_num, status,
    relayed_event_index, dest_event_index, dest_para_id, to_account_id,
    confirm_block_timestamp, extrinsic_index, relayed_extrinsic_index, dest_extrinsic_index,
    child_para_id, child_dest, protocol, message_type, unique_id, xcm_version, assets
)
VALUES %s
ON CONFLICT (ecosystem, message_hash) DO UPDATE SET
    origin_event_index = EXCLUDED.origin_event_index,
    from_account_id = EXCLUDED.from_account_id,
    origin_para_id = EXCLUDED.origin_para_id,
    origin_block_timestamp = EXCLUDED.origin_block_timestamp,
    relayed_block_timestamp = EXCLUDED.relayed_block_timestamp,
    block_num = EXCLUDED.block_num,
    status = EXCLUDED.status,
    relayed_event_index = EXCLUDED.relayed_event_index,
    dest_event_index = EXCLUDED.dest_event_index,
    dest_para_id = EXCLUDED.dest_para_id,
    to_account_id = EXCLUDED.to_account_id,
    confirm_block_timestamp = EXCLUDED.confirm_block_timestamp,
    extrinsic_index = EXCLUDED.extrinsic_index,
    relayed_extrinsic_index = EXCLUDED.relayed_extrinsic_index,
    dest_extrinsic_index = EXCLUDED.dest_extrinsic_index,
    child_para_id = EXCLUDED.child_para_id,
    child_dest = EXCLUDED.child_dest,
    protocol = EXCLUDED.protocol,
    message_type = EXCLUDED.message_type,
    unique_id = EXCLUDED.unique_id,
    xcm_version = EXCLUDED.xcm_version,
    assets = EXCLUDED.assets;
"""


# HTTP helpers
def backoff_sleep(attempt):
    base = min(MAX_BACKOFF_SECONDS, 2**attempt)
    time.sleep(base + random.uniform(0, 0.1))


def _rate_limited_post(url, headers, payload, timeout):
    max_retries = 6
    for attempt in range(max_retries + 1):
        RATE_LIMITER.acquire()

        try:
            r = requests.post(url, headers=headers, json=payload, timeout=timeout)
        except requests.RequestException:
            if attempt < max_retries:
                backoff_sleep(attempt)
                continue
            raise

        # Retryable HTTP statuses
        if r.status_code in (429, 500, 502, 503, 504):
            if attempt < max_retries:
                retry_after = r.headers.get("Retry-After")
                if retry_after:
                    try:
                        sleep_for = float(retry_after)
                    except ValueError:
                        sleep_for = min(MAX_BACKOFF_SECONDS, 2**attempt)
                    time.sleep(sleep_for + random.uniform(0, 0.1))
                else:
                    backoff_sleep(attempt)
                continue

        r.raise_for_status()
        return r


def post_json(url, payload, api_key=None, timeout=60):
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if api_key:
        headers["X-API-Key"] = api_key

    r = _rate_limited_post(url, headers, payload, timeout)
    data = r.json()
    if data.get("code", 0) != 0:
        raise RuntimeError(f"Subscan error ({url}): {data.get('message')}")
    return data


# DB helpers
def db_connect():
    load_dotenv()
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
        user=os.getenv("DB_USER") or "",
        password=os.getenv("DB_PASS") or "",
        dbname=os.getenv("DB_NAME") or "",
    )


def ensure_table(conn):
    with conn.cursor() as cur:
        cur.execute(CREATE_MESSAGES_SQL)
    conn.commit()


def drop_and_recreate(conn):
    with conn.cursor() as cur:
        cur.execute(DROP_MESSAGES_SQL)
        cur.execute(CREATE_MESSAGES_SQL)
    conn.commit()


def get_db_count(conn, ecosystem):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT COUNT(*) FROM public.messages WHERE ecosystem=%s;", (ecosystem,)
        )
        return int(cur.fetchone()[0] or 0)


def get_last_id(conn, ecosystem):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT COALESCE(unique_id, message_hash) AS cursor_id
            FROM public.messages
            WHERE ecosystem=%s
            ORDER BY block_num DESC NULLS LAST, origin_block_timestamp DESC NULLS LAST
            LIMIT 1;
            """,
            (ecosystem,),
        )
        row = cur.fetchone()
        return row[0] if row and row[0] else None


# Mapping
def normalize_message(ecosystem, row):
    def g(*keys, default=None):
        for k in keys:
            if k in row and row[k] is not None:
                return row[k]
        return default

    return {
        "ecosystem": ecosystem,
        "message_hash": g("message_hash"),
        "origin_event_index": g("origin_event_index"),
        "from_account_id": g("from_account_id"),
        "origin_para_id": g("origin_para_id"),
        "origin_block_timestamp": g("origin_block_timestamp"),
        "relayed_block_timestamp": g("relayed_block_timestamp"),
        "block_num": g("block_num"),
        "status": g("status"),
        "relayed_event_index": g("relayed_event_index"),
        "dest_event_index": g("dest_event_index"),
        "dest_para_id": g("dest_para_id"),
        "to_account_id": g("to_account_id"),
        "confirm_block_timestamp": g("confirm_block_timestamp"),
        "extrinsic_index": g("extrinsic_index"),
        "relayed_extrinsic_index": g("relayed_extrinsic_index"),
        "dest_extrinsic_index": g("dest_extrinsic_index"),
        "child_para_id": g("child_para_id"),
        "child_dest": g("child_dest"),
        "protocol": g("protocol"),
        "message_type": g("message_type"),
        "unique_id": g("unique_id"),
        "xcm_version": g("xcm_version"),
        "assets": g("assets"),
    }


def cursor_id(row):
    return row.get("unique_id")


# Upsert
def upsert_batch(conn, rows):
    if not rows:
        return 0

    # Dedup inside the batch
    dedup = {}
    for r in rows:
        eco = r.get("ecosystem")
        mh = r.get("message_hash")
        if not eco or not mh:
            continue
        dedup[(eco, mh)] = r

    if not dedup:
        return 0

    prepped = []
    for _, item in dedup.items():
        row = dict(item)
        a = row.get("assets")
        if isinstance(a, (dict, list)):
            row["assets"] = extras.Json(a)
        prepped.append(row)

    cols = [
        "ecosystem",
        "message_hash",
        "origin_event_index",
        "from_account_id",
        "origin_para_id",
        "origin_block_timestamp",
        "relayed_block_timestamp",
        "block_num",
        "status",
        "relayed_event_index",
        "dest_event_index",
        "dest_para_id",
        "to_account_id",
        "confirm_block_timestamp",
        "extrinsic_index",
        "relayed_extrinsic_index",
        "dest_extrinsic_index",
        "child_para_id",
        "child_dest",
        "protocol",
        "message_type",
        "unique_id",
        "xcm_version",
        "assets",
    ]
    values = [[r.get(c) for c in cols] for r in prepped]

    with conn.cursor() as cur:
        extras.execute_values(cur, UPSERT_SQL, values, page_size=500)
    conn.commit()
    return len(prepped)


# Fetchers
def get_total_count(base_url, api_key):
    url = f"{base_url}/api/scan/xcm/list"
    data = post_json(url, {"row": 1, "page": 0}, api_key=api_key)
    datablock = data.get("data") or {}
    return int(datablock.get("count") or 0)


def fetch_pages_cursor_only(base_url, api_key, start_after_id, page_size):
    url = f"{base_url}/api/scan/xcm/list"

    if start_after_id is None:
        data = post_json(url, {"row": page_size, "page": 0}, api_key=api_key)
        rows = (data.get("data") or {}).get("list") or []
        if not rows:
            return
        yield rows
        last = rows[-1]
        after_id = cursor_id(last)
        if not after_id:
            return
    else:
        after_id = start_after_id

    while True:
        data = post_json(url, {"row": page_size, "after_id": after_id}, api_key=api_key)
        rows = (data.get("data") or {}).get("list") or []
        if not rows:
            return
        yield rows
        last = rows[-1]
        new_cursor = cursor_id(last)
        if not new_cursor:
            return
        after_id = new_cursor


# Main
def main():
    parser = argparse.ArgumentParser(
        description="Load XCM messages via cursor-only pagination."
    )
    parser.add_argument(
        "--full",
        action="store_true",
        help="Drop & recreate the table, then backfill all ecosystems from scratch.",
    )
    parser.add_argument(
        "--pagesize",
        type=int,
        default=DEFAULT_PAGE_SIZE,
        help="API page size (1..100).",
    )
    args = parser.parse_args()

    load_dotenv()
    api_key = os.getenv("SUBSCAN_API_KEY")

    with db_connect() as conn:
        if args.full:
            print("Full refresh: dropping and recreating public.messages …")
            drop_and_recreate(conn)
        else:
            ensure_table(conn)

        total_upserted_all = 0

        for base_url in SUBSCAN_BASES:
            ecosystem = base_url.split("//")[1].split(".")[0]
            try:
                expected_total = get_total_count(base_url, api_key)
            except Exception as e:
                print(f"[{ecosystem}] WARN: cannot read expected total: {e}")
                expected_total = 0

            if args.full:
                print(
                    f"[{ecosystem}] full backfill … (expected total: {expected_total})\n"
                )
                start_after_id = None
                stop_at_id = None
            else:
                stop_at_id = get_last_id(conn, ecosystem)
                if stop_at_id:
                    print(
                        f"[{ecosystem}] incremental: will fetch until stop_at_id={stop_at_id}"
                    )
                else:
                    print(f"[{ecosystem}] initial backfill.")
                start_after_id = None

            seen = set()
            batch_rows = []
            BATCH = 500
            upserted = 0
            seen_count = 0
            hit_stop = False

            for page_rows in fetch_pages_cursor_only(
                base_url=base_url,
                api_key=api_key,
                start_after_id=start_after_id,
                page_size=args.pagesize,
            ):
                for raw in page_rows:
                    cur_id = cursor_id(raw)

                    # Stop condition for incremental
                    if not args.full and stop_at_id and cur_id == stop_at_id:
                        hit_stop = True
                        break

                    norm = normalize_message(ecosystem, raw)
                    mh = norm.get("message_hash")
                    if not mh:
                        continue
                    key = (ecosystem, mh)
                    if key in seen:
                        continue
                    seen.add(key)

                    batch_rows.append(norm)
                    seen_count += 1

                    # Progress message
                    if expected_total and (seen_count % 2000 == 0):
                        db_now = get_db_count(conn, ecosystem)
                        print(
                            f"\r[{ecosystem}] progress: ~{db_now + len(batch_rows)}/{expected_total}",
                            end="",
                        )

                    if len(batch_rows) >= BATCH:
                        upserted += upsert_batch(conn, batch_rows)
                        batch_rows = []

                if hit_stop:
                    print(
                        f"\n[{ecosystem}] encountered stop_at_id; incremental sync complete.",
                        end="",
                    )
                    break

                if args.full and expected_total:
                    db_now = get_db_count(conn, ecosystem)
                    if db_now + len(batch_rows) >= expected_total:
                        break

            if batch_rows:
                upserted += upsert_batch(conn, batch_rows)

            total_upserted_all += upserted
            db_total_after = get_db_count(conn, ecosystem)

            print(f"\n[{ecosystem}] upserted {upserted} rows.")
            if expected_total:
                print(
                    f"[{ecosystem}] expected total: {expected_total} | DB has now: {db_total_after}"
                )
                if args.full and db_total_after < expected_total:
                    print(
                        f"[{ecosystem}] WARNING: ({expected_total - db_total_after}) rows fewer than Subscan's reported total."
                    )
            print("---------------------------------------------")

        print(f"\nAll ecosystems done. Total upserted: {total_upserted_all}")


if __name__ == "__main__":
    main()
