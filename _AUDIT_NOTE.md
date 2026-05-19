# Audit Note — AIPredictdisease

Source: `/Users/erolakarsu/projects/_AUDIT/reports/batch_06.md` section #30.

## Original Recommendations

### Gaps — AI Counterparts
- `/comorbidity-analyze` (added)
- `/seasonality-predict` (added)

### Gaps — Non-AI Features
- CDC/WHO public-health DB integration
- Case management workflows
- Contact tracing
- Population health analytics
- EHR integration

### Custom Feature Suggestions
1. Agentic disease surveillance
2. Individual risk dashboard
3. Treatment efficacy tracking
4. Outbreak simulation
5. Travel health risk

## Implemented (Mechanical)
- `POST /api/ai/comorbidity-analyze` — added in `backend/src/routes/ai.js`. Pulls patient conditions/demographics (or accepts inline), returns comorbidity clusters, elevated risks, screening priorities, drug-interaction concerns. Logs HIPAA audit + persists to `ai_results`.
- `POST /api/ai/seasonality-predict` — added in `backend/src/routes/ai.js`. Pulls 36-month case history by disease name (or accepts inline), returns seasonal pattern + 12-month forecast + intervention windows.

Both follow the existing ESM `callOpenRouter` + `auditLog` + `ai_results` style.

## Backlog (deferred)

### NEEDS-CREDS / NEW-DEPS
- CDC/WHO/state-health-dept feed integration.
- EHR (FHIR) integration.
- Contact-tracing infrastructure (privacy-preserving).

### NEEDS-PRODUCT-DECISION
- Population health analytics surface (dashboard scope).
- Travel health risk content sourcing (CDC/WHO licensing).

### TOO-RISKY
- Agentic disease surveillance with real-time alerts (alert routing + accountability).
- Outbreak "what-if" simulator (proper SEIR/agent-based model is out of LLM scope).

## Apply pass 3 (frontend)

- **Action:** LEFT-AS-IS — FE already wired (including pass-2 additions).
- **Verification:**
  - `frontend/src/pages/ComorbidityAnalyze.jsx` posts to `/api/ai/comorbidity-analyze`.
  - `frontend/src/pages/SeasonalityPredict.jsx` posts to `/api/ai/seasonality-predict`.
  - Both are imported and routed in `App.jsx` and exposed in `components/Navbar.jsx`.
  - `services/api.js` axios instance attaches `Authorization: Bearer <token>` from `localStorage.getItem('token')` and redirects to `/login` on 401/403.
- No files modified.

## Apply pass 4 (mechanical backlog)

- **Action:** LEFT-AS-IS — no MECHANICAL items remain.
- **Why:** Both prior MECHANICAL gaps (`/comorbidity-analyze`, `/seasonality-predict`) were implemented in apply pass 2. Remaining backlog is all `NEEDS-CREDS` (CDC/WHO/EHR/contact tracing) or `NEEDS-PRODUCT-DECISION` (population analytics scope, travel content licensing) or `TOO-RISKY` (real-time agentic surveillance, SEIR/agent-based outbreak simulation).
- **Files touched:** none.
- **Smoke test:** N/A.
