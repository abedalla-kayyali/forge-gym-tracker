# FORGE RAG

Natural language search over your FORGE gym data. Runs fully local, no API keys needed.

## Setup (one-time)

```
pip install chromadb sentence-transformers
```

## Step 1 — Export your data

1. Open FORGE in your browser
2. Open DevTools → Console (F12)
3. Paste the contents of `export.js` and press Enter
4. Save the downloaded `forge_export.json` into this folder (`scripts/forge-rag/`)

## Step 2 — Ingest

```
python ingest.py
```

Or point to a custom path:
```
python ingest.py path/to/forge_export.json
```

## Step 3 — Search

Interactive mode:
```
python search.py
```

Single query:
```
python search.py "what did I bench last week?"
python search.py "my best chest sessions"
python search.py "how much protein did I eat this week"
```

### Commands in interactive mode

| Command | Example |
|---------|---------|
| (any text) | `best squat sessions` |
| `summary [days]` | `summary 14` |
| `filter [type] [query]` | `filter workout chest exercises` |
| `quit` | — |

Types: `workout`, `meal`, `cardio`, `bodyweight`, `bw_workout`

## Re-ingesting

Just run `python ingest.py` again after exporting fresh data. It rebuilds the index from scratch each time.
