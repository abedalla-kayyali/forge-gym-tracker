"""
FORGE RAG - Natural Language Search CLI
Run: python search.py
Or:  python search.py "what did I bench last week?"
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta

import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

DB_PATH = Path(__file__).parent / "forge_chroma_db"

TYPE_ICONS = {
    "workout": "[WORKOUT]",
    "bodyweight": "[WEIGHT]",
    "meal": "[MEAL]",
    "cardio": "[CARDIO]",
    "bw_workout": "[BW]",
}


def search(query: str, n_results: int = 8, type_filter: str = None):
    if not DB_PATH.exists():
        print("[FORGE RAG] No database found. Run `python ingest.py` first.")
        sys.exit(1)

    client = chromadb.PersistentClient(path=str(DB_PATH))
    ef = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
    collection = client.get_collection("forge_data", embedding_function=ef)

    where = {"type": type_filter} if type_filter else None
    results = collection.query(
        query_texts=[query],
        n_results=n_results,
        where=where,
        include=["documents", "metadatas", "distances"],
    )

    docs = results["documents"][0]
    metas = results["metadatas"][0]
    distances = results["distances"][0]

    if not docs:
        print("No results found.")
        return

    print(f'\nResults for: "{query}"\n{"=" * 60}')
    for doc, meta, dist in zip(docs, metas, distances):
        icon = TYPE_ICONS.get(meta.get("type", ""), "[?]")
        relevance = max(0, 100 - int(dist * 50))
        date = meta.get("date", "")
        print(f"\n{icon}  {date}  (relevance: {relevance}%)")
        print(f"   {doc}")
    print(f'\n{"=" * 60}')


def build_summary(days: int = 7):
    """Summarize recent activity."""
    if not DB_PATH.exists():
        print("[FORGE RAG] No database found. Run `python ingest.py` first.")
        return

    client = chromadb.PersistentClient(path=str(DB_PATH))
    ef = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
    collection = client.get_collection("forge_data", embedding_function=ef)

    cutoff = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    all_items = collection.get(include=["documents", "metadatas"])

    recent = [
        (doc, meta) for doc, meta in zip(all_items["documents"], all_items["metadatas"])
        if meta.get("date", "") >= cutoff
    ]

    if not recent:
        print(f"No entries found in the last {days} days.")
        return

    by_type = {}
    for doc, meta in recent:
        t = meta.get("type", "other")
        by_type.setdefault(t, []).append((doc, meta))

    print(f"\nLast {days} days summary ({len(recent)} entries)\n{'=' * 60}")

    if "workout" in by_type:
        workouts = by_type["workout"]
        muscles = {}
        total_vol = 0
        prs = 0
        for _, m in workouts:
            muscle = m.get("muscle", "unknown")
            muscles[muscle] = muscles.get(muscle, 0) + 1
            total_vol += m.get("volume", 0)
            if m.get("is_pr") == "True":
                prs += 1
        print(f"\n[WORKOUTS] {len(workouts)} sessions")
        print(f"   Muscles trained: {', '.join(f'{k}x{v}' for k, v in sorted(muscles.items(), key=lambda x: -x[1]))}")
        print(f"   Total volume: {total_vol:,.0f}kg")
        if prs:
            print(f"   PRs hit: {prs}")

    if "bodyweight" in by_type:
        entries = by_type["bodyweight"]
        weights = [m.get("weight") for _, m in entries if m.get("weight")]
        if weights:
            print(f"\n[BODYWEIGHT] {weights[-1]}kg (latest)  |  range: {min(weights)}-{max(weights)}kg")

    if "meal" in by_type:
        meals = by_type["meal"]
        total_kcal = sum(m.get("kcal", 0) for _, m in meals)
        total_protein = sum(m.get("protein", 0) for _, m in meals)
        print(f"\n[NUTRITION] {len(meals)} meal entries logged")
        if total_kcal:
            print(f"   Avg daily calories: {total_kcal / days:,.0f} kcal")
        if total_protein:
            print(f"   Avg daily protein: {total_protein / days:.0f}g")

    if "cardio" in by_type:
        cardio = by_type["cardio"]
        total_min = sum(m.get("duration", 0) for _, m in cardio)
        print(f"\n[CARDIO] {len(cardio)} sessions, {total_min:.0f} total minutes")

    print(f'\n{"=" * 60}')


def interactive():
    print("\nFORGE RAG -- Natural Language Search")
    print("Commands: search [query] | summary [days] | filter [type] [query] | quit")
    print("Types: workout, meal, cardio, bodyweight, bw_workout")
    print("─" * 60)

    while True:
        try:
            raw = input("\n> ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nBye!")
            break

        if not raw:
            continue

        if raw.lower() in ("quit", "exit", "q"):
            print("Bye!")
            break

        parts = raw.split(None, 1)
        cmd = parts[0].lower()

        if cmd == "summary":
            days = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 7
            build_summary(days)
        elif cmd == "filter" and len(parts) > 1:
            sub = parts[1].split(None, 1)
            if len(sub) == 2:
                search(sub[1], type_filter=sub[0])
            else:
                print("Usage: filter [type] [query]")
        elif cmd == "search" and len(parts) > 1:
            search(parts[1])
        else:
            # Treat entire input as a search query
            search(raw)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
        search(query)
    else:
        interactive()
