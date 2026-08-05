# AlumniLaunch — Batch 2 Feature Progress

Working branch: `feature/batch-2` (kept in sync with main). Admin media upload done, now 5 items left.
line are now live on main). Continuing remaining items on `feature/batch-2` still, will merge again
when the next chunk is done.
Owner: Harsh (harsh23533-del)

If you are a fresh Claude session picking this up: `git log --oneline feature/batch-2` and read the
"Done" section below before touching anything. Don't re-decide already-decided ambiguities (see Decisions).

## Decisions (already made, don't re-ask)
- Duplicate "Applied" badge: removed the desktop top-right one (Topbar "My applications" link for
  students). The mobile bottom nav "Applied" tab is now the only entry point.
- Guest chat display names ("Unknown 1", "Unknown 2"...): reset every session, not tied to
  browser/cookies.
- Profile page will NOT show a real password (passwords are bcrypt-hashed, one-way — there is no
  plaintext to show). Replaced with a "Change Password" flow instead.

## Done
- [x] Removed duplicate "My applications" link from desktop Topbar (student role)
- [x] Added a Logout tab to MobileBottomNav for all authenticated roles (alumni/student/company/admin) —
      previously mobile UI had no logout at all
- [x] Eye icon to show/hide password — built `frontend/src/components/PasswordInput.jsx` (reusable,
      drop-in replacement for `<input type="password">`), wired into Login, StudentSignup, AlumniSignup,
      CompanySignup, and AdminLogin. Syntax-checked with esbuild (no dev deps installed in this sandbox,
      so a full `vite build` wasn't run — do that before merging).
- [x] Forgot password flow — no email-sending infra, so this is DB-check-then-reset (not a mailed link):
      - Backend: `POST /auth/forgot-password/check` (schemas.CheckAccountEmailRequest/Response) confirms
        the email exists; `POST /auth/forgot-password/reset` (schemas.ResetPasswordRequest/Response) sets
        a new password directly. Both added to `backend/app/routers/auth.py` + `backend/app/schemas/schemas.py`.
      - Frontend: new page `frontend/src/pages/ForgotPassword.jsx`, route `/forgot-password` added in
        `App.jsx`, linked from Login page under the password field.
      - Known limitation (accepted for now): step 2 isn't token-gated — anyone who knows an account's
        email can reach the reset screen and set a new password, since there's no email verification step.
        Fine for a college project; flag before any real-world deploy.

- [x] Lock role selection after login — new `frontend/src/components/GuestOnlyRoute.jsx`, wraps
      `/login`, `/signup`, `/signup/alumni`, `/signup/student`, `/signup/company`, `/admin/login` in
      `App.jsx`. A logged-in user hitting any of these is redirected to their own dashboard
      (alumni → `/alumni/dashboard`, student → `/student/applications`, company → `/jobs/dashboard`,
      admin → `/admin/dashboard`, else `/`) instead of being allowed to re-pick a role. Must log out
      first to reach login/signup again. `/forgot-password` intentionally left unguarded.
      Parse-checked with esbuild (external-module resolution errors from missing node_modules are
      expected and ignored, same as prior sessions — no real syntax errors).
- [x] Admin chat messages show "Admin – AlumniLaunch" instead of the admin's own name/email —
      `backend/app/routers/chat.py` now checks `is_admin_email(user.email)` in both `_display_name`
      and the stored `sender_role` (set to `"admin"`), so it works regardless of which role
      (alumni/student/company) the admin account technically has. Frontend `Chat.jsx` got an `admin`
      entry in `ROLE_COLORS` for the badge. Known limitation: this only affects messages sent from
      now on — old chat history rows already have the admin's real name baked in, no backfill done.

## Not started yet
- [x] Admin: media-upload space for video/image/poster collections (Media tab in admin dashboard)
- [ ] Dedicated resume-upload corner for job/internship applications
- [ ] Ideas: request-to-join flow (student → idea owner → accept → group), group only contains
      accepted members
- [ ] Private 1:1 messaging between idea owner and an interested student
- [ ] Show logged-in user's profile summary wherever the AlumniLaunch logo/brand appears
- [ ] Guests (not signed up): full homepage access + can view/send chat as "Unknown 1", "Unknown 2"...

## Heads-up for next session
- Every token used so far (this session included) has been pasted directly into a Claude chat, which
  means each one is exposed the moment it's used. Revoke the current one from GitHub settings after
  this session ends and generate a fresh one next time — don't reuse it.

## Notes for whoever continues
- Frontend: React + Vite, `frontend/src`. Nav lives in `components/Topbar.jsx` (desktop) and
  `components/MobileBottomNav.jsx` (mobile, only rendered under a mobile breakpoint — check `App.jsx`
  or CSS for the breakpoint before assuming mobile-only behavior).
- Backend: FastAPI, `backend/app`. Routers are split by domain (`ideas.py`, `messages.py`, `chat.py`,
  `applications.py`, etc.) — new features should follow that pattern, not get crammed into `main.py`.
- Auth state: `frontend/src/context/AuthContext.jsx`.
- Push access: repo has a scoped fine-grained PAT in use for this session only (contents: read/write).
  It is not stored anywhere — each session needs the user to supply it again, or you switch to handing
  back patches.
