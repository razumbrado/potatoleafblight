# BlightVision – Potato Leaf Blight Disease Classification

BlightVision classifies potato leaf photos as **Early Blight** or **Late Blight** using your own Google Teachable
Machine image model, running in the browser with TensorFlow.js. Signed-in users can save results to a private
Supabase history and review them in an analytics dashboard.

| Area | Technology |
| --- | --- |
| Frontend | React 18, Vite, TypeScript |
| Styling / UI | Tailwind CSS, custom components, Lucide icons, Framer Motion |
| AI | TensorFlow.js + `@teachablemachine/image` (model in `public/model/`) |
| Backend | Supabase Auth, PostgreSQL (Row Level Security), Storage |
| Charts / forms / toasts | Recharts, React Hook Form + Zod, Sonner |

---

## 1. Quick start

Requires Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. The landing page, detection, results, disease library, and about pages work
immediately. Accounts, saved scans, history, analytics, and settings need Supabase (next section) — until it is
configured the app shows a "Supabase is not connected yet" notice instead of failing.

## 2. Connect Supabase

1. **Create a project** at <https://supabase.com> (the free tier is enough).
2. **Create the database objects.** Open *SQL Editor → New query*, paste the whole of
   [`supabase/migrations/20261011000000_blightvision_schema.sql`](supabase/migrations/20261011000000_blightvision_schema.sql),
   and click *Run*. This creates:
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

## 3. Your Teachable Machine model

The exported model lives in `public/model/`:

```
public/model/model.json
public/model/metadata.json
public/model/weights.bin
```

It is loaded with `tmImage.load(modelURL, metadataURL)` and run with `model.predict(imageElement)` in
[`src/services/model.ts`](src/services/model.ts). The app displays the model's outputs unchanged (formatted to two
decimals) and stores them as 0–1 values. To use a retrained model, replace the three files — the class labels must
still be exactly `Early Blight` and `Late Blight`.

### What the model can and cannot do

- It has only two classes. There is **no "healthy" class and no "not a potato leaf" class**, so every image gets
  one of the two labels. The app says this wherever results are shown.
- **Photo style matters a great deal.** When this build was tested, the model classified single leaves photographed
  on a plain grey background (PlantVillage-style) correctly in 7 of 8 samples, but labelled every in-field photo —
  including late blight and healthy plants — as Early Blight at ~100 % confidence. The official Teachable Machine
  snippet gives the same numbers, so this is the model's behaviour, not the app's. For field use, retrain with
  photos taken the way your users will take them (and ideally add "Healthy" and "Not a leaf" classes).

## 4. Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Type-check, then build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | TypeScript check only |
| `npm run verify:model` | With the dev server running, opens the app in your installed Edge/Chrome, analyzes sample images, and confirms the percentages on screen equal the raw model output. Pass your own images: `npm run verify:model -- http://localhost:5173 path/to/leaf.jpg` |

## 5. Project structure

```
public/
  model/                 Teachable Machine export (model.json, metadata.json, weights.bin)
  images/                Photographs used on the landing and disease pages
src/
  components/
    ui/                  Button, Input, Card, Modal, Badge, Skeleton, EmptyState
    layout/              Sidebar, Topbar, Breadcrumbs, UserMenu, PublicNavbar, Footer
    detection/           UploadZone, CameraCapture, AnalyzingOverlay, ProbabilityBar, ResultReport
    analytics/           StatCard, DistributionChart, TrendChart, MonthlyChart, RecentActivity
    common/              Logo, ProtectedRoute, ConfirmDialog, Notice, DiseaseBadge, …
  contexts/              Auth, Model, Scans, Detection, Theme providers
  hooks/                 useSignedUrls
  layouts/               AppLayout (sidebar shell), AuthLayout
  lib/                   Supabase client, constants, validation schemas, disease content
  pages/                 Landing, Login, Register, Forgot/Reset password, Detection, Results,
                         History, ScanDetail, Analytics, Diseases, About, Settings, NotFound
  services/              model.ts (inference), scans.ts (database + storage), profile.ts
  styles/                Tailwind entry and theme tokens (light + dark)
  types/                 Shared and database types
  utils/                 Formatting, analytics maths, CSV export, image helpers, PNG report
supabase/migrations/     SQL schema, RLS, and storage policies
scripts/verify-model.mjs Browser smoke test for the model workflow
```

## 6. How the main flows work

- **Detection** – choose, drop, or capture an image (JPG/PNG/WEBP, ≤ 10 MB). Nothing is analyzed until you click
  *Analyze Image*; the button stays disabled until the model has finished loading.
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

- the two `VITE_SUPABASE_*` environment variables set at build time
- a single-page-app fallback that serves `index.html` for unknown paths (needed for routes like `/history`)
- HTTPS — browsers only allow camera capture on secure origins (or `localhost`)

Remember to add the production URL to Supabase's Site URL and Redirect URLs.

## 8. Notes and limitations

- Deleting a user from the Supabase dashboard cascades to their `profiles` and `scan_history` rows, but Storage
  objects are not removed automatically — delete the user's folder in the `potato-leaf-scans` bucket as well.
- History and analytics load all of a user's scans into the browser, which suits personal histories (thousands of
  scans) rather than very large datasets.
- `.npmrc` sets `legacy-peer-deps=true` because `@teachablemachine/image` declares a peer dependency on
  TensorFlow.js 1.x; it runs correctly on current TensorFlow.js.

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
