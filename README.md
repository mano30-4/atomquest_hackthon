# Goal Tracking Portal

Functional web portal for the AtomQuest Hackathon 1.0 goal-setting brief. The app supports employee goal sheets, manager approvals, quarterly check-ins, admin oversight, reports, and an audit trail using a consistent fake organization dataset.

## Demo Roles

All seeded accounts use the password `Password123!`.

| Role | Email | What to try |
|---|---|---|
| Admin / HR | `admin@atomquest.com` | Manage users, thrust areas, settings, reports, and audit logs |
| Manager | `manager1@atomquest.com` | Review Sales and Customer Success goal sheets, approve or return submissions, view team reports |
| Manager | `manager2@atomquest.com` | Review Engineering and Quality goal sheets |
| Employee | `employee1@atomquest.com` | View approved locked goals and add quarterly check-ins |
| Employee | `employee2@atomquest.com` | See a submitted sheet waiting for manager review |
| Employee | `employee3@atomquest.com` | Edit a returned sheet and resubmit |
| Employee | `employee5@atomquest.com` | Work with a draft goal sheet, add goals, and submit it |

## Role Rules

Employees can create or edit goals only while their goal sheet is `draft` or `returned`. After submission, the sheet is read-only until a manager returns it. After manager approval, goals are locked and employees can update quarterly achievements, not rewrite the approved plan.

Managers can see only their direct reports. They can approve submitted goal sheets or return them with feedback. Manager dashboards and reports use the same seeded users, goal sheets, check-ins, and approval states.

Admins can manage users, thrust areas, system settings, reports, and audit logs. Admin data is fake demo data only; no personal user data is required.

## Included Workflows

- Employee goal creation with max 8 goals, minimum 10 percent per goal, and total 100 percent weightage validation.
- Manager L1 approval workflow with return-for-rework and approval lock.
- Quarterly achievement entry for approved goals.
- Manager check-in comments.
- Admin user and thrust-area management.
- Reports for achievement, completion, status distribution, and thrust-area distribution.
- CSV achievement export and Excel completion export.
- Audit log entries for key seeded and runtime actions.

## Local Run

The easiest local run uses Docker Compose.

```bash
docker compose up --build
```

Open:

- Frontend: `http://localhost:8080`
- Backend health: `http://localhost:5001/health`

To reset the local database, remove the Compose volume and start again:

```bash
docker compose down -v
docker compose up --build
```

## Live Demo

Live app: `https://hackthon-tan.vercel.app`

## Deployment

This project is set up for Vercel. The React frontend is served as a static build, and `/api/*` requests are routed to the Express serverless entry in `api/index.js`.

Required Vercel environment variables:

- `DATABASE_URL`
- `DB_SSL=true`
- `JWT_SECRET`
- `JWT_EXPIRES_IN=7d`
- `CORS_ORIGIN=<hosted frontend URL>`
- `DISABLE_RATE_LIMIT=true`
- `FISCAL_YEAR=2026-27`

Vercel deployment steps:

1. Create a Postgres database, for example Neon Postgres.
2. Set the required environment variables in the hosting project.
3. Deploy this repository from the project root.
4. Share the Vercel production URL for review.

## Architecture

See the deployment diagram, data model, and request flow [architecture-diagram.svg](architecture-diagram.svg).

## Tech Stack

- React 18, Vite, Tailwind CSS, Recharts
- Node.js, Express, Sequelize
- PostgreSQL
- Docker, Nginx

## Repository Notes

The repository intentionally keeps only the project source, runtime setup, hackathon brief, and architecture documentation. Seeded people, departments, goals, check-ins, and reports are fake demo data for evaluation purposes.
