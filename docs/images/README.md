# ARCDIS — Screenshots

This directory contains screenshots of the ARCDIS dashboard for use in the project README and documentation.

## Screenshots Required

The following screenshots should be captured from a running ARCDIS instance and saved here:

| Filename | Page | Notes |
|---|---|---|
| `arcdis-dashboard.png` | `/dashboard` | Main overview with stats cards, attack chart, recent attacks list |
| `arcdis-agents.png` | `/dashboard/agents` | Agents list showing online/degraded/offline status badges |
| `arcdis-agent-details.png` | `/dashboard/agent/:id` | Per-agent detail view with attack history |
| `arcdis-attacks.png` | `/dashboard/attacks` | Attacks timeline with severity filter controls |
| `arcdis-login.png` | `/login` | Login page |

## How to Capture Screenshots

1. Start MongoDB, the backend, and the frontend:
   ```bash
   # Terminal 1 — backend
   cd backend && source venv/bin/activate
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

   # Terminal 2 — frontend
   cd client && npm run dev
   ```

2. Register an account and log in at `http://localhost:5173`.

3. If you have a running agent, start it and wait for detection events to populate the dashboard. If not, the dashboard will show empty states.

4. Capture screenshots of each page listed above.

5. Save them in this directory using the filenames from the table.

6. Update the README.md screenshot embeds:
   ```markdown
   ![ARCDIS Dashboard](docs/images/arcdis-dashboard.png)
   ![ARCDIS Agents](docs/images/arcdis-agents.png)
   ![ARCDIS Attack Events](docs/images/arcdis-attacks.png)
   ```

## Note

Screenshots are not automatically generated. This directory is tracked in git but the image files themselves are not present until captured manually. The `.gitignore` does not exclude `.png` files, so screenshots committed here will be included in the repository.
