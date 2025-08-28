# XCM Data Collection Scripts

Two Python scripts designed to synchronize **Cross-Chain Message (XCM) data from Subscan** into a PostgreSQL database:

- **`messages.py`** - Pulls XCM message data (`public.messages`)
- **`channels.py`** - Pulls HRMP channels and Relay ↔ Parachain statistics (`public.channels`)

The scripts create their own tables if missing and upsert safely.
Recommended deployment: Run them **once per day without parameters** (cron recommended).

---

## Setup

### Package requirements
- Python 3.10 or higher
- PostgreSQL database server
- Required Python packages: `requests`, `psycopg2-binary`, `python-dotenv`

Package Installation:
```bash
pip install requests psycopg2-binary python-dotenv
```

### Configuration

Configure environment variables in `.env` file following the template provided in `.env.example` (located in parent directory).

## Execution Instructions

Execute the scripts using the following commands:

```bash
# Standard Incremental Synchronization (Recommended for daily operations)
python messages.py
python channels.py

# Complete Data Refresh (Caution: Removes existing data and performs full fetch)
python messages.py --full
```
