# SignSync (Full Stack Root Repository)

SignSync is organized as one root repository that references two independent repositories:

- `frontend` (Angular app): <https://github.com/mithun2003/SignSync-FE.git>
- `backend` (FastAPI app): <https://github.com/mithun2003/SIgnSync-BE.git>

The root repository tracks those two directories as submodules and is configured to follow the `new-model` branch for both FE and BE, so they stay fully separate.

## Repository Structure

```text
SignSync/
├── frontend/   -> separate Git repo (SignSync-FE)
├── backend/    -> separate Git repo (SIgnSync-BE)
├── .gitmodules
├── .gitignore
└── README.md
```

## How updates work

If you commit and push inside `frontend` or `backend`, that update is pushed to that repo only.

To sync FE/BE from their tracked branch (`new-model`) into this root repo:

```bash
cd /path/to/SignSync
git submodule update --remote frontend backend
git add .gitmodules frontend backend
git commit -m "chore: track frontend/backend new-model branches"
git push origin main
```

To pin FE/BE to specific checked-out states after branch updates, keep using the same root commit flow (`git add frontend backend` + `git commit`).

## Run FE + BE together with Docker

From the root repository, you can run frontend (Angular), backend (FastAPI), PostgreSQL, and pgAdmin in one command.

Prerequisites:

- Docker and Docker Compose plugin installed
- `backend/src/.env` exists (backend already uses this file)

Start everything:

```bash
cd /path/to/SignSync
docker compose up --build
```

Services:

- Frontend: <http://localhost:4200>
- Backend API: <http://localhost:8000>
- Backend docs: <http://localhost:8000/docs>
- pgAdmin: <http://localhost:5050>

Bootstrap admin/tier from root (optional):

```bash
docker compose -f docker-compose.yml -f docker-compose.tools.yml run --rm create_superuser
docker compose -f docker-compose.yml -f docker-compose.tools.yml run --rm create_first_tier
```

Stop everything:

```bash
docker compose down
```

## Push-only workflow (no pull)

If remote has unwanted files and you want your local state to overwrite it:

```bash
git push --force-with-lease origin main
```

For nested repos:

```bash
cd frontend && git push --force-with-lease origin <branch>
cd ../backend && git push --force-with-lease origin <branch>
```

`--force-with-lease` is safer than `--force` because it avoids overwriting someone else’s unexpected new push.

## Notes

- FE and BE have their own READMEs and full project details.
- Root-level architecture and methodology notes are in `PROJECT_REPORT_FULL_STACK.md`.
