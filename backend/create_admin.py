"""
Create (or reset the password of) the admin account.

There is no public signup for admin — this is intentional, so a random
visitor can never make themselves an admin. Run this script yourself,
once, from the backend directory:

    python create_admin.py --email you@example.com --password "a-strong-password"

or just run it with no flags and it will prompt you interactively
(password entry is hidden, like a normal terminal password prompt):

    python create_admin.py

IMPORTANT: the email you use here MUST exactly match the ADMIN_EMAIL
value in your .env file. Admin access is granted purely by matching
that email (see app/core/security.py -> is_admin_email) — the password
just proves it's really you. If the emails don't match, you'll be able
to log in as a normal user but every /admin/* route will reject you
with 403.
"""

import argparse
import getpass
import sys

from app.core.database import SessionLocal
from app.core.security import ADMIN_EMAIL, hash_password, is_admin_email
from app.models.models import User, UserRole


def main():
    parser = argparse.ArgumentParser(description="Create or reset the admin account.")
    parser.add_argument("--email", help="Admin email (must match ADMIN_EMAIL in .env)")
    parser.add_argument("--password", help="Admin password (prompted securely if omitted)")
    args = parser.parse_args()

    email = args.email or input(f"Admin email [{ADMIN_EMAIL}]: ").strip() or ADMIN_EMAIL
    if not is_admin_email(email):
        print(
            f"\nWARNING: '{email}' does not match ADMIN_EMAIL ('{ADMIN_EMAIL}') in your .env.\n"
            "This account will be created, but /admin/* routes will reject it with 403\n"
            "until you set ADMIN_EMAIL in .env to this same address and restart the backend.\n"
        )
        if input("Continue anyway? [y/N]: ").strip().lower() != "y":
            sys.exit(1)

    password = args.password or getpass.getpass("Admin password: ")
    if len(password) < 8:
        print("Password should be at least 8 characters. Aborting.")
        sys.exit(1)
    if not args.password and password != getpass.getpass("Confirm password: "):
        print("Passwords did not match. Aborting.")
        sys.exit(1)

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.hashed_password = hash_password(password)
            db.commit()
            print(f"\nExisting account found for {email} — password updated.")
        else:
            # role is a required column but is never actually checked for
            # admin access (is_admin_email() is the only gate on /admin/*
            # routes) — 'student' is used here purely as the least-
            # privileged placeholder value the schema allows.
            user = User(email=email, hashed_password=hash_password(password), role=UserRole.student)
            db.add(user)
            db.commit()
            print(f"\nAdmin account created for {email}.")

        print("You can now log in at POST /admin/login (or the admin login page) with this email and password.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
