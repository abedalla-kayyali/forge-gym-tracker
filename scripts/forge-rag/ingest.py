"""
FORGE RAG - Ingest
Reads forge_export.json and indexes all gym data into a local ChromaDB.
Run: python ingest.py [path/to/forge_export.json]
"""

import json
import sys
import os
from datetime import datetime
from pathlib import Path

import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

DB_PATH = Path(__file__).parent / "forge_chroma_db"
EXPORT_PATH = Path(__file__).parent.parent.parent / "forge_export.json"

MUSCLE_LABELS = {
    "chest": "Chest", "back": "Back", "shoulders": "Shoulders",
    "biceps": "Biceps", "triceps": "Triceps", "legs": "Legs",
    "glutes": "Glutes", "abs": "Abs", "calves": "Calves",
    "forearms": "Forearms", "traps": "Traps", "lats": "Lats",
    "hamstrings": "Hamstrings", "quads": "Quads",
}


def fmt_date(iso_str):
    try:
        return datetime.fromisoformat(iso_str.replace("Z", "+00:00")).strftime("%B %d, %Y")
    except Exception:
        return iso_str


def fmt_sets(sets):
    parts = []
    for i, s in enumerate(sets, 1):
        if not isinstance(s, dict):
            continue
        reps = s.get("reps", "?")
        weight = s.get("weight", "?")
        unit = s.get("unit", "kg")
        t = s.get("type", "normal")
        rpe = s.get("rpe")
        label = f"Set {i}"
        if t == "warmup":
            label += " (warmup)"
        elif t == "drop":
            label += " (drop set)"
        line = f"{label}: {reps} reps x {weight}{unit}"
        if rpe:
            line += f" @ RPE {rpe}"
        parts.append(line)
    return "; ".join(parts) if parts else "no set data"


def docs_from_workouts(workouts):
    docs, ids, metas = [], [], []
    for w in workouts:
        if not isinstance(w, dict):
            continue
        wid = str(w.get("id", ""))
        date_iso = w.get("date", "")
        date_str = fmt_date(date_iso)
        exercise = w.get("exercise", "unknown exercise")
        muscle = MUSCLE_LABELS.get(w.get("muscle", "").lower(), w.get("muscle", ""))
        angle = w.get("angle", "")
        sets = w.get("sets", [])
        volume = w.get("totalVolume", 0)
        is_pr = w.get("isPR", False)
        effort = w.get("effort", "")
        notes = w.get("notes", "")

        text_parts = [f"On {date_str}, logged {exercise}"]
        if muscle:
            text_parts[0] += f" ({muscle}"
            if angle:
                text_parts[0] += f", {angle}"
            text_parts[0] += ")"
        text_parts.append(fmt_sets(sets))
        if volume:
            text_parts.append(f"Total volume: {volume:,.0f}{sets[0].get('unit','kg') if sets else 'kg'}")
        if is_pr:
            text_parts.append("Personal record (PR) achieved!")
        if effort:
            text_parts.append(f"Effort: {effort}")
        if notes:
            text_parts.append(f"Notes: {notes}")

        doc = ". ".join(text_parts) + "."
        docs.append(doc)
        ids.append(f"workout_{wid or len(docs)}")
        metas.append({
            "type": "workout",
            "date": date_iso[:10] if date_iso else "",
            "muscle": w.get("muscle", ""),
            "exercise": exercise,
            "is_pr": str(is_pr),
            "volume": float(volume) if volume else 0.0,
        })
    return docs, ids, metas


def docs_from_bodyweight(bw_entries):
    docs, ids, metas = [], [], []
    for i, entry in enumerate(bw_entries):
        if not isinstance(entry, dict):
            continue
        date_iso = entry.get("date", "")
        date_str = fmt_date(date_iso)
        weight = entry.get("weight")
        unit = entry.get("unit", "kg")
        bf = entry.get("bodyFat")
        muscle_mass = entry.get("muscleMass")

        if not weight and not bf and not muscle_mass:
            continue

        parts = [f"On {date_str}"]
        if weight:
            parts.append(f"body weight: {weight}{unit}")
        if bf:
            parts.append(f"body fat: {bf}%")
        if muscle_mass:
            parts.append(f"muscle mass: {muscle_mass}kg")

        doc = ", ".join(parts) + "."
        docs.append(doc)
        ids.append(f"bw_{i}_{date_iso[:10].replace('-', '') if date_iso else i}")
        metas.append({
            "type": "bodyweight",
            "date": date_iso[:10] if date_iso else "",
            "weight": float(weight) if weight else 0.0,
            "body_fat": float(bf) if bf else 0.0,
        })
    return docs, ids, metas


def docs_from_meals(meals_log):
    docs, ids, metas = [], [], []
    if not isinstance(meals_log, dict):
        return docs, ids, metas

    for date_key, day_meals in meals_log.items():
        if not isinstance(day_meals, list):
            continue
        for i, meal in enumerate(day_meals):
            if not isinstance(meal, dict):
                continue
            name = meal.get("name") or meal.get("label") or "unknown meal"
            kcal = meal.get("kcal") or meal.get("calories") or 0
            protein = meal.get("p") or meal.get("protein") or 0
            carbs = meal.get("c") or meal.get("carbs") or 0
            fat = meal.get("f") or meal.get("fat") or 0
            qty = meal.get("qty") or meal.get("quantity") or ""

            try:
                date_str = fmt_date(date_key + "T00:00:00")
            except Exception:
                date_str = date_key

            parts = [f"On {date_str}, logged meal: {name}"]
            nutrition = []
            if kcal:
                nutrition.append(f"{kcal} calories")
            if protein:
                nutrition.append(f"{protein}g protein")
            if carbs:
                nutrition.append(f"{carbs}g carbs")
            if fat:
                nutrition.append(f"{fat}g fat")
            if nutrition:
                parts.append(", ".join(nutrition))
            if qty:
                parts.append(f"quantity: {qty}")

            doc = ". ".join(parts) + "."
            docs.append(doc)
            ids.append(f"meal_{date_key.replace('-', '')}_{i}")
            metas.append({
                "type": "meal",
                "date": date_key,
                "meal_name": name,
                "kcal": float(kcal) if kcal else 0.0,
                "protein": float(protein) if protein else 0.0,
            })
    return docs, ids, metas


def docs_from_cardio(cardio_entries):
    docs, ids, metas = [], [], []
    for i, entry in enumerate(cardio_entries):
        if not isinstance(entry, dict):
            continue
        date_iso = entry.get("date", "")
        date_str = fmt_date(date_iso)
        activity = entry.get("type") or entry.get("activity") or entry.get("name") or "cardio"
        duration = entry.get("duration") or entry.get("minutes") or entry.get("time")
        distance = entry.get("distance")
        dist_unit = entry.get("distanceUnit") or "km"
        calories = entry.get("calories") or entry.get("kcal")
        notes = entry.get("notes", "")

        parts = [f"On {date_str}, cardio session: {activity}"]
        if duration:
            parts.append(f"{duration} minutes")
        if distance:
            parts.append(f"{distance}{dist_unit}")
        if calories:
            parts.append(f"{calories} calories burned")
        if notes:
            parts.append(f"Notes: {notes}")

        doc = ". ".join(parts) + "."
        docs.append(doc)
        ids.append(f"cardio_{i}_{date_iso[:10].replace('-', '') if date_iso else i}")
        metas.append({
            "type": "cardio",
            "date": date_iso[:10] if date_iso else "",
            "activity": activity,
            "duration": float(duration) if duration else 0.0,
        })
    return docs, ids, metas


def docs_from_bw_workouts(bw_workouts):
    docs, ids, metas = [], [], []
    for i, w in enumerate(bw_workouts):
        if not isinstance(w, dict):
            continue
        date_iso = w.get("date", "")
        date_str = fmt_date(date_iso)
        exercise = w.get("exercise") or w.get("name") or "bodyweight exercise"
        muscle = MUSCLE_LABELS.get(w.get("muscle", "").lower(), w.get("muscle", ""))
        sets = w.get("sets", [])
        notes = w.get("notes", "")

        parts = [f"On {date_str}, bodyweight exercise: {exercise}"]
        if muscle:
            parts[0] += f" ({muscle})"
        if sets:
            set_parts = []
            for j, s in enumerate(sets, 1):
                if isinstance(s, dict):
                    reps = s.get("reps", "?")
                    set_parts.append(f"Set {j}: {reps} reps")
                elif isinstance(s, (int, float)):
                    set_parts.append(f"Set {j}: {s} reps")
            if set_parts:
                parts.append("; ".join(set_parts))
        if notes:
            parts.append(f"Notes: {notes}")

        doc = ". ".join(parts) + "."
        docs.append(doc)
        ids.append(f"bwwk_{i}_{date_iso[:10].replace('-', '') if date_iso else i}")
        metas.append({
            "type": "bw_workout",
            "date": date_iso[:10] if date_iso else "",
            "exercise": exercise,
            "muscle": w.get("muscle", ""),
        })
    return docs, ids, metas


def ingest(export_path: Path):
    print(f"[FORGE RAG] Loading export from {export_path}")
    with open(export_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    print("[FORGE RAG] Initializing ChromaDB...")
    client = chromadb.PersistentClient(path=str(DB_PATH))
    ef = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")

    # Single collection for all FORGE data
    try:
        client.delete_collection("forge_data")
    except Exception:
        pass
    collection = client.create_collection("forge_data", embedding_function=ef)

    all_docs, all_ids, all_metas = [], [], []

    workouts = data.get("forge_workouts") or []
    if workouts:
        d, i, m = docs_from_workouts(workouts)
        all_docs += d; all_ids += i; all_metas += m
        print(f"  [OK] {len(d)} workout entries")

    bw = data.get("forge_bodyweight") or []
    if bw:
        d, i, m = docs_from_bodyweight(bw)
        all_docs += d; all_ids += i; all_metas += m
        print(f"  [OK] {len(d)} bodyweight entries")

    meals = data.get("forge_meals") or {}
    if meals:
        d, i, m = docs_from_meals(meals)
        all_docs += d; all_ids += i; all_metas += m
        print(f"  [OK] {len(d)} meal entries")

    cardio = data.get("forge_cardio") or []
    if cardio:
        d, i, m = docs_from_cardio(cardio)
        all_docs += d; all_ids += i; all_metas += m
        print(f"  [OK] {len(d)} cardio entries")

    bw_workouts = data.get("forge_bw_workouts") or []
    if bw_workouts:
        d, i, m = docs_from_bw_workouts(bw_workouts)
        all_docs += d; all_ids += i; all_metas += m
        print(f"  [OK] {len(d)} bodyweight workout entries")

    if not all_docs:
        print("[FORGE RAG] No data found in export. Check that forge_export.json is populated.")
        return

    # Batch insert (ChromaDB handles up to 5461 at a time)
    BATCH = 500
    print(f"\n[FORGE RAG] Embedding and indexing {len(all_docs)} total entries...")
    for start in range(0, len(all_docs), BATCH):
        end = min(start + BATCH, len(all_docs))
        collection.add(
            documents=all_docs[start:end],
            ids=all_ids[start:end],
            metadatas=all_metas[start:end],
        )
        print(f"  Indexed {end}/{len(all_docs)}")

    print(f"\n[FORGE RAG] Done! {len(all_docs)} entries indexed to {DB_PATH}")
    print("Run `python search.py` to start searching.")


if __name__ == "__main__":
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else EXPORT_PATH
    if not path.exists():
        print(f"[FORGE RAG] Export file not found: {path}")
        print("  1. Open FORGE in your browser")
        print("  2. Open DevTools (F12) → Console")
        print("  3. Paste the contents of export.js and press Enter")
        print("  4. Save the downloaded forge_export.json next to this script")
        sys.exit(1)
    ingest(path)
