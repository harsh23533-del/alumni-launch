# AlumniLaunch — Batch 2 Feature Progress

Working branch: `feature/batch-2`
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

## Not started yet
- [ ] Admin: media-upload space for video/image/poster collections
- [ ] Dedicated resume-upload corner for job/internship applications
- [ ] Ideas: request-to-join flow (student → idea owner → accept → group), group only contains
      accepted members
- [ ] Private 1:1 messaging between idea owner and an interested student
- [ ] Show logged-in user's profile summary wherever the AlumniLaunch logo/brand appears
- [ ] Lock role selection after login — can't switch student/alumni without logout first
- [ ] Forgot password flow (email entry → verify in DB → reset)
- [ ] Eye icon to show/hide password on password fields (login, signup, change-password)
- [ ] Admin chat messages should display as "Admin – AlumniLaunch" instead of admin's own name
- [ ] Guests (not signed up): full homepage access + can view/send chat as "Unknown 1", "Unknown 2"...

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
