# BlightVision – Potato Leaf Blight Disease Classification

BlightVision classifies potato leaf photos as **Early Blight** or **Late Blight** with a **scikit-learn Random
Forest** served by a Python FastAPI backend. Signed-in users can save results to a private Supabase history and
review them in an analytics dashboard; a Model Evaluation page shows the model's real test-set metrics.

| Area | Technology |
| --- | --- |
| Frontend | React 18, Vite, TypeScript |
| Styling / UI | Tailwind CSS, custom components, Lucide icons, Framer Motion |
| AI | Python 3, FastAPI, scikit-learn `RandomForestClassifier`, OpenCV, scikit-image, NumPy, Pillow, Pandas, Joblib (in `backend/`) |
| Data backend | Supabase Auth, PostgreSQL (Row Level Security), Storage |
| Charts / forms / toasts | Recharts, React Hook Form + Zod, Sonner |

---

## 1. Quick start

Requires Node.js 18+ and Python 3.11 – 3.13. **Full Windows / VS Code instructions for the model (virtual
environment, dataset, training, starting the API, retraining) are in [`backend/README.md`](backend/README.md).**

```powershell
# Terminal 1 – backend
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python train_model.py                          # trains on backend/dataset/, writes backend/models/
python -m uvicorn main:app --reload --port 8000

# Terminal 2 – frontend (project root)
npm install
npm run dev
```

Open <http://localhost:5173>. `.env` must contain `VITE_API_BASE_URL=http://localhost:8000` (see `.env.example`).
The landing page, detection, results, model evaluation, disease library, and about pages work without an account.
If the backend is not running or the model is untrained, the app says so instead of showing a result. Accounts, saved scans, history, analytics, and settings need Supabase (next section) — until it is
configured the app shows a "Supabase is not connected yet" notice instead of failing.

## 2. Connect Supabase

1. **Create a project** at <https://supabase.com> (the free tier is enough).
2. **Create the database objects.** Open *SQL Editor → New query*, paste the whole of
   [`supabase/migrations/20261011000000_blightvision_schema.sql`](supabase/migrations/20261011000000_blightvision_schema.sql),
   and click *Run*, then do the same with
   [`supabase/migrations/20261015000000_scan_history_model_version.sql`](supabase/migrations/20261015000000_scan_history_model_version.sql)
   (adds the nullable `model_name` / `model_version` columns; existing rows and policies are untouched). This creates:
   - `profiles` and `scan_history` tables with foreign keys, check constraints, and indexes
   - a trigger that creates a profile row when a user signs up
   - Row Level Security policies so users can only read, create, and delete **their own** rows
   - the private `potato-leaf-scans` storage bucket (10 MB limit; JPEG/PNG/WEBP only) with per-user folder policies

   (With the Supabase CLI you can instead run `supabase link` and `supabase db push`.)
3. **Add your keys.** Copy `.env.example` to `.env` and fill in the values from *Project Settings → API*:

   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
   ```

   Use only the **publishable / anon** key. Never put the `service_role` or any secret key in this file —
   everything prefixed with `VITE_` is shipped to the browser.
4. **Set the auth URLs.** In *Authentication → URL Configuration*:
   - Site URL: `http://localhost:5173` (your real domain in production)
   - Redirect URLs: add `http://localhost:5173/**` (and `https://your-domain/**` in production)

   These are needed for the email-confirmation and password-reset links.
5. **Restart** `npm run dev` so Vite picks up the new `.env`.

**Email confirmation:** new Supabase projects require users to confirm their email before signing in, and the
built-in email service is rate-limited to a few messages per hour. For local testing you can turn off
*Authentication → Sign In / Providers → Email → Confirm email*; for production, configure your own SMTP provider.

## 3. The Random Forest model

The classifier lives in [`backend/`](backend/README.md):

1. `train_model.py` loads `backend/dataset/Early_Blight` and `backend/dataset/Late_Blight`, extracts colour
   histogram, HOG, LBP and GLCM features, makes a stratified, duplicate-aware 80 / 20 split (`random_state=42`),
   tunes the forest with cross-validation on the training split only, evaluates once on the test split, and saves
   `models/random_forest.joblib`, `models/evaluation.json` and `models/model_info.json`.
2. `main.py` (FastAPI) loads the saved model once and serves `POST /api/predict`, `GET /api/model/evaluation`,
   `GET /api/model/info` and `GET /api/health`. The model is never retrained per request.
3. The frontend calls the API from [`src/services/api.ts`](src/services/api.ts) /
   [`src/services/model.ts`](src/services/model.ts) and displays the `predict_proba()` outputs unchanged
   (formatted to two decimals); they are stored as 0–1 values together with the model version.

Retrain any time the dataset changes: `python train_model.py` — the running API picks up the new model
automatically.

### What the model can and cannot do

- It has only two classes. There is **no "healthy" class and no "not a potato leaf" class**, so every image gets
  one of the two labels. The app says this wherever results are shown.
- **Photo style matters.** The model is trained on 1,000 + 1,000 smartphone field photos from potato farms
  (Zenodo DOI 10.5281/zenodo.8286529, CC BY 4.0) and uses a frozen pretrained EfficientNet-B0 plus hand-crafted
  features as Random Forest input. Photos that look very different from these may get lower confidence.
- Scans saved before the switch to Random Forest have no `model_version`; History and Scan Details label them as
  **Legacy model (Teachable Machine)** rather than as Random Forest results.

## 4. Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Type-check, then build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | TypeScript check only |
| `npm run verify:model` | With the backend and dev server running, opens the app in your installed Edge/Chrome, analyzes sample images, and confirms the percentages on screen equal the backend's `predict_proba()` output. Pass your own images: `npm run verify:model -- http://localhost:5173 path/to/leaf.jpg` |
| `python train_model.py` (in `backend/`) | Train / retrain and evaluate the Random Forest |
| `python -m uvicorn main:app --reload --port 8000` (in `backend/`) | Start the FastAPI backend |

## 5. Project structure

```
backend/                 Python Random Forest + FastAPI (see backend/README.md)
  dataset/               Early_Blight/ and Late_Blight/ training images
  models/                Trained model, evaluation.json, model_info.json
public/
  images/                Photographs used on the landing and disease pages
src/
  components/
    ui/                  Button, Input, Card, Modal, Badge, Skeleton, EmptyState
    layout/              Sidebar, Topbar, Breadcrumbs, UserMenu, PublicNavbar, Footer
    detection/           UploadZone, CameraCapture, AnalyzingOverlay, ProbabilityBar, ResultReport
    analytics/           StatCard, DistributionChart, TrendChart, MonthlyChart, RecentActivity
    evaluation/          ConfusionMatrix, DatasetChart (Model Evaluation page)
    common/              Logo, ProtectedRoute, ConfirmDialog, Notice, DiseaseBadge, …
  contexts/              Auth, Model, Scans, Detection, Theme providers
  hooks/                 useSignedUrls
  layouts/               AppLayout (sidebar shell), AuthLayout
  lib/                   Supabase client, constants, validation schemas, disease content
  pages/                 Landing, Login, Register, Forgot/Reset password, Detection, Results,
                         History, ScanDetail, Analytics, ModelEvaluation, Diseases, About, Settings, NotFound
  services/              api.ts (FastAPI client), model.ts (inference), scans.ts (database + storage), profile.ts
  styles/                Tailwind entry and theme tokens (light + dark)
  types/                 Shared and database types
  utils/                 Formatting, analytics maths, CSV export, image helpers, PNG report
supabase/migrations/     SQL schema, RLS, and storage policies
scripts/verify-model.mjs Browser smoke test for the model workflow
```

## 6. How the main flows work

- **Detection** – choose, drop, or capture an image (JPG/PNG/WEBP, ≤ 10 MB). Nothing is analyzed until you click
  *Analyze Image*; the button stays disabled until the backend reports a trained model. The image is sent to
  `POST /api/predict` and classified in memory on the server (it is not stored there).
- **Model Evaluation** – loads `/api/model/evaluation` and `/api/model/info` and shows the real test-set metrics,
  confusion matrix, classification report, dataset distribution, and hyperparameters. It is separate from
  Analytics, which counts your saved scans and says nothing about model accuracy.
- **Saving** – requires sign-in. The image is uploaded to `potato-leaf-scans/<user id>/<uuid>.<ext>`, then a
  `scan_history` row is inserted. If the insert fails, the uploaded image is removed again.
- **Deleting** – the stored image is removed first, then the row, so a failure never leaves an image without a
  record. *Clear History* does the same for every scan.
- **Analytics** – every number and chart is computed in the browser from your `scan_history` rows. With no saved
  scans the dashboard shows an empty state rather than sample data.
- **Visitors** can use the landing page, detection, results, the disease library, and the about page. History,
  analytics, and settings require an account.

## 7. Deployment

`npm run build` produces a static site in `dist/`. Host it anywhere that serves static files (Vercel, Netlify,
Cloudflare Pages, …) with:

- the two `VITE_SUPABASE_*` environment variables and `VITE_API_BASE_URL` set at build time
- a single-page-app fallback that serves `index.html` for unknown paths (needed for routes like `/history`)
- HTTPS — browsers only allow camera capture on secure origins (or `localhost`)

Remember to add the production URL to Supabase's Site URL and Redirect URLs.

## 8. Notes and limitations

- Deleting a user from the Supabase dashboard cascades to their `profiles` and `scan_history` rows, but Storage
  objects are not removed automatically — delete the user's folder in the `potato-leaf-scans` bucket as well.
- History and analytics load all of a user's scans into the browser, which suits personal histories (thousands of
  scans) rather than very large datasets.
- The static frontend can still be hosted on Vercel, but the Python backend must run somewhere too (any host that
  runs `uvicorn`, e.g. Render, Railway, a VM). Set `VITE_API_BASE_URL` to its URL at build time and add the
  frontend's origin to the backend's `CORS_ORIGINS`.

## 9. Responsible use

BlightVision reports a machine-learning model's prediction, **not a confirmed plant disease diagnosis**. Consult a
qualified agronomist, plant pathologist, or your local extension service before making crop management decisions.

## 10. Image credits

Photographs from Wikimedia Commons, used under their respective licences:

| File | Author | Licence |
| --- | --- | --- |
| `potato-leaves.jpg` | Forest & Kim Starr | CC BY 3.0 |
| `early-blight.jpg` (*Alternaria solani*) | Linnea Stridh | CC BY-SA 4.0 |
| `late-blight.jpg` | Björn Andersson (SLU) | CC BY-SA 4.0 |
| `potato-field.jpg` | Armineaghayan | CC BY-SA 4.0 |
