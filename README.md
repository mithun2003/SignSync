# SignSync (Full Stack Root Repository)

SignSync is organized as one root repository that references two independent repositories:

- `frontend` (Angular app): <https://github.com/mithun2003/SignSync-FE.git>
- `backend` (FastAPI app): <https://github.com/mithun2003/SIgnSync-BE.git>

The root repository tracks those two directories as gitlinks (submodule-style pointers), so FE and BE stay fully separate.

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

To reflect those new FE/BE commits in this root repo, do one extra root commit:

```bash
cd /path/to/SignSync
git add frontend backend
git commit -m "chore: bump frontend/backend pointers"
git push origin main
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
