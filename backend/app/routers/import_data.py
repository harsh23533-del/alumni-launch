import csv
import io
import re

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import AlumniProfile

router = APIRouter(prefix="/import", tags=["import"])


@router.post("/csv")
async def import_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Upload a CSV of alumni (columns: email, name, batch, branch, company, designation, linkedin_url, phone).
    Rows are inserted as unclaimed AlumniProfile records (is_claimed=False).
    If an email already exists, it's skipped (won't overwrite claimed profiles).
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file")

    content = await file.read()
    decoded = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(decoded))

    inserted, skipped = 0, 0
    for row in reader:
        email = (row.get("email") or "").strip().lower()
        if not email:
            skipped += 1
            continue

        existing = db.query(AlumniProfile).filter(AlumniProfile.email == email).first()
        if existing:
            skipped += 1
            continue

        profile = AlumniProfile(
            email=email,
            name=row.get("name"),
            batch=row.get("batch"),
            branch=row.get("branch"),
            company=row.get("company"),
            designation=row.get("designation"),
            linkedin_url=row.get("linkedin_url"),
            phone=row.get("phone"),
            is_claimed=False,
            imported=True,
        )
        db.add(profile)
        inserted += 1

    db.commit()
    return {"inserted": inserted, "skipped": skipped}


@router.post("/sql")
async def import_sql(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Upload a .sql file containing INSERT statements for an alumni-like table
    (expects columns similar to: email, name, batch, branch, company, designation, linkedin_url, phone).
    This is a best-effort parser for simple INSERT INTO ... VALUES (...) statements —
    for complex dumps, restore the dump directly with `psql` instead and skip this endpoint.
    """
    if not file.filename.endswith(".sql"):
        raise HTTPException(status_code=400, detail="Please upload a .sql file")

    content = (await file.read()).decode("utf-8", errors="ignore")

    # naive INSERT INTO table (col1, col2, ...) VALUES (...), (...); parser
    insert_pattern = re.compile(
        r"INSERT\s+INTO\s+[`\"]?\w+[`\"]?\s*\(([^)]+)\)\s*VALUES\s*(.+?);",
        re.IGNORECASE | re.DOTALL,
    )
    value_group_pattern = re.compile(r"\(([^()]+)\)")

    inserted, skipped = 0, 0

    for match in insert_pattern.finditer(content):
        columns = [c.strip().strip("`\"") for c in match.group(1).split(",")]
        values_blob = match.group(2)

        for vg in value_group_pattern.finditer(values_blob):
            raw_values = _split_sql_values(vg.group(1))
            if len(raw_values) != len(columns):
                skipped += 1
                continue

            row = dict(zip(columns, raw_values))
            email = (row.get("email") or "").strip().lower()
            if not email:
                skipped += 1
                continue

            existing = db.query(AlumniProfile).filter(AlumniProfile.email == email).first()
            if existing:
                skipped += 1
                continue

            profile = AlumniProfile(
                email=email,
                name=row.get("name"),
                batch=row.get("batch"),
                branch=row.get("branch"),
                company=row.get("company"),
                designation=row.get("designation"),
                linkedin_url=row.get("linkedin_url"),
                phone=row.get("phone"),
                is_claimed=False,
                imported=True,
            )
            db.add(profile)
            inserted += 1

    db.commit()
    return {"inserted": inserted, "skipped": skipped}


def _split_sql_values(values_str: str):
    """Splits a comma-separated SQL VALUES tuple, respecting quoted strings."""
    values = []
    current = ""
    in_quotes = False
    for ch in values_str:
        if ch == "'" and not in_quotes:
            in_quotes = True
            continue
        if ch == "'" and in_quotes:
            in_quotes = False
            continue
        if ch == "," and not in_quotes:
            values.append(current.strip())
            current = ""
            continue
        current += ch
    values.append(current.strip())
    cleaned = [None if v.upper() == "NULL" else v for v in values]
    return cleaned
