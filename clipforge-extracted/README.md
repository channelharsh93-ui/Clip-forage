# ClipForge — Free AI Viral Clip Generator

ClipForge is a local-first MVP that turns long-form videos into short, editable clips. The first version focuses on the real workflow rather than a marketing landing page:

```text
VIDEO → LOCAL TRANSCRIPT → SCENES + AUDIO SIGNALS → HIGHLIGHTS → CLIPS → CAPTIONS → 9:16 EXPORT
```

It uses FastAPI, SQLite, FFmpeg, OpenCV, and an optional local faster-whisper model. It does not require an OpenAI, Anthropic, paid transcription, paid video, paid GPU, paid storage, or paid social API.

Social integrations are modular and opt-in. Official developer credentials are blank by default, so the app never creates fake connections. Free Mode stays on by default.

## 100% free local AI mode

The default Local AI Engine uses faster-whisper, FFmpeg, OpenCV, SQLite, and deterministic local content generation. Its provider interface is defined in `backend/app/services/content_generator.py` and exposes video analysis, highlight detection, hook, title, description, hashtag, keyword, SEO, category, and score operations. No cloud provider is required.

Privacy Mode is ON by default. It blocks direct URL fetching and official social API requests until the user explicitly turns it off. The processing screen exposes a local system monitor with CPU, RAM, GPU detection, model name, and a Running Locally indicator.

```env
LOCAL_AI=true
ALLOW_CLOUD_AI=false
LOCAL_MODEL=tiny.en
PRIVACY_MODE=true
```

## Subscription model without hidden charges

The project includes a local plan catalog, authenticated usage meter, and provider-abstracted billing engine. Free Mode remains locally usable with up to 10 generated clips per day and 2 processing jobs per day by default. Pro is catalogued at ₹99/month and unlocks full content packs/SEO, platform-specific metadata, official publishing, batch/priority architecture, and premium caption styles. `USER_PLAN=free` is the default. Razorpay is supported behind `PAYMENT_PROVIDER=razorpay`, but it remains disabled until server-side keys, webhook verification, and deployment configuration are deliberately supplied. With no provider configured, no payment is taken and the local interest flow remains available.

Available endpoints:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
POST /api/auth/verify-email
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET /api/auth/profile
PUT /api/auth/profile
GET /api/auth/sessions
GET /api/plans
GET /api/subscription
GET /api/usage
POST /api/subscription/interest
GET /api/user-settings
PUT /api/user-settings
POST /api/billing/checkout
POST /api/billing/verify
POST /api/billing/webhook/razorpay
GET /api/billing/dashboard
GET /api/billing/invoices/{id}/download
```

## Free-forever guardrails

The default configuration is designed to avoid unexpected recurring costs:

```env
FREE_MODE=true
ALLOW_OFFICIAL_APIS=false
MAX_STORAGE_GB=20
RETENTION_DAYS=0
```

Local processing and storage are preferred. Official social APIs require an explicit opt-in and developer credentials. The local storage cap prevents an unattended instance from consuming disk indefinitely, and retention cleanup stays disabled unless explicitly enabled. No paid AI, cloud GPU, paid storage, proxy, scraping, or automation provider is configured.

## Non-intrusive advertising

Free Mode can show small, clearly labeled sponsored cards on the dashboard, results page, content-pack page, and optional sidebar. Ads are loaded asynchronously and collapse when unavailable. They never appear inside the editor, during processing, before downloads, or during publishing. The demo provider is self-contained and does not autoplay sound or redirect automatically.

Configure frequency and future premium-plan behavior with:

```env
ADS_ENABLED=true
MAX_ADS_PER_SESSION=5
MIN_AD_INTERVAL_SECONDS=120
USER_PLAN=free
```

The provider and manager are abstracted in `backend/app/ads.py`; replace the demo provider later without changing placements. Ad metrics are separate from clip/product metrics at `GET /api/ads/metrics`.

## Rights and responsible use

Only upload or import videos you own or have permission to edit and publish. Adding captions, music, effects, logos, cropping, hooks, or other modifications does **not** automatically remove copyright restrictions. ClipForge is not designed to remove copyright, bypass Content ID, or evade platform rules.

Direct video URLs are supported only when they return a permitted video file. Platform pages such as YouTube, TikTok, Instagram, Facebook, and X are intentionally rejected; upload the video file instead.

## Requirements

- Python 3.11+ recommended
- Node.js 18+
- FFmpeg on PATH, or the Python `imageio-ffmpeg` package used by the MVP as a local fallback
- 4 GB+ RAM for small local video processing; more is recommended for Whisper

## Deployment

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for local, private-LAN, Vercel frontend + separate FastAPI API, Nginx, Razorpay webhook, timing, and public-deployment security guidance. The repository includes Vercel SPA rewrite configuration, but uploads and video processing still require the separately running FastAPI backend.

## Run locally

### Backend

```bash
cd backend
python -m venv .venv
# macOS/Linux
source .venv/bin/activate
# Windows PowerShell: .venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

The API is available at `http://localhost:8001/api/health`.

The first transcription can download the configured open-source Whisper model. To run without local captions while testing the rest of the pipeline, install `requirements-minimal.txt`; the app will honestly report that transcription is unavailable rather than inventing a transcript.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

Vite proxies `/api` and `/media` to the backend, so browser code never calls `localhost` directly in a deployed page.

## Configuration

Values are configurable through environment variables and the in-app creator preferences screen:

```env
MAX_VIDEO_DURATION=1800
MAX_FILE_SIZE_MB=1000
# Free daily/project clip cap; /api/plans reports this configured value.
MAX_CLIPS=10
FREE_PLAN_CLIPS=10
FREE_PLAN_VIDEOS=2
WHISPER_MODEL=tiny.en
PROCESSING_WORKERS=2
# STORAGE_ROOT=/absolute/path/to/storage
# DATABASE_PATH=/absolute/path/to/storage/viral_clips.sqlite3
```

## Architecture

```text
backend/app/
  main.py                    FastAPI routes, upload validation, local queue
  config.py                  Environment-configurable limits and paths
  db.py                      SQLite schema and repository helpers
  services/
    ffmpeg.py                FFmpeg invocation, audio extraction, captions, rendering
    transcription.py         Local faster-whisper provider abstraction
    analysis.py              OpenCV scenes, RMS audio, candidate scoring, categories
    pipeline.py              Background video-to-clips orchestration

frontend/src/
  App.tsx                    Dashboard, processing screen, results grid, clip editor
  api.ts                     Relative API client
  types.ts                   Shared frontend types
  index.css                  Premium responsive UI
```

Project files are stored locally under `backend/storage/projects/<project_id>/`:

```text
original.mp4
analysis/audio.wav
analysis/transcript.json
analysis/scenes.json
analysis/highlights.json
clips/<clip_id>.mp4
clips/<clip_id>.srt
clips/<clip_id>.jpg
```

## Highlight scoring

The scoring engine combines several signals instead of assuming that loudness equals virality:

- Speech density and transcript context
- Emotional and high-salience wording
- Questions and emphatic punctuation
- RMS audio intensity and peaks
- Scene changes
- Story completeness and clip length fit
- Duplicate/overlap suppression

Each candidate receives a score, category, explanation, timestamps, and a content-based hook suggestion. The score is a ranking aid, not a guarantee of virality. Clips also receive a local Content Pack with multiple hooks, titles, descriptions, hashtags, keywords, platform-specific versions, and a transparent SEO score. These remain editable and do not promise engagement.

## API overview

- `POST /api/projects` — create a rights-acknowledged project
- `POST /api/projects/{id}/upload` — upload a local video
- `POST /api/projects/{id}/import-url` — import a permitted direct video URL
- `POST /api/projects/{id}/analyze` — queue local processing
- `POST /api/projects/{id}/retry` — clear previous generated clips and retry after an interruption
- `GET /api/projects/{id}/status` — poll genuine pipeline state
- `GET /api/projects/{id}/clips` — list generated clips
- `PUT /api/clips/{id}` — update editor settings
- `POST /api/clips/{id}/render` — render through FFmpeg
- `GET /api/clips/{id}/download` — download an MP4
- `GET /api/projects/{id}/download-all` — download a ZIP of rendered clips
- `DELETE /api/projects/{id}` — remove a project and its local generated files
- `GET /api/social/providers` — inspect configured/connected platform capabilities
- `GET /api/social/{platform}/connect` — start official OAuth when developer credentials exist
- `GET /api/social/{platform}/videos` — list metadata from an authenticated account
- `POST /api/social/{platform}/import` — import only when the official provider returns permitted media
- `GET /api/stats` — project, clip, video, and average processing-time metrics
- `GET /api/queue` — live local processing and render jobs
- `GET /api/system/status` — CPU/RAM/GPU/local-model monitor
- `GET /api/privacy` — local privacy mode status
- `GET /api/templates` — local free/Pro editor presets
- `POST /api/clips/{id}/template` — apply a real editor preset
- `GET /api/billing/status` — inspect optional billing configuration
- `POST /api/billing/checkout` — explicit unavailable response; no payment is taken in the MVP
- `GET /api/cost-status` — show local/free/quotas/disabled paid services
- `GET /api/storage/status` — inspect local disk usage and configured storage cap
- `POST /api/storage/cleanup` — run optional retention cleanup when RETENTION_DAYS is positive
- `GET /api/publishing/queue` — inspect explicit publishing jobs

## Authentication and billing

Authentication is enabled by default with secure HttpOnly session cookies, PBKDF2 password hashing, CSRF headers, email verification/reset tokens, device sessions, optional Google/GitHub OAuth, and per-user project/usage scope. Console email delivery is used only in development unless SMTP is explicitly configured.

The billing provider is selected server-side:

```env
PAYMENT_PROVIDER=razorpay
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=<server-only secret>
RAZORPAY_WEBHOOK_SECRET=<Dashboard webhook secret>
PRO_PRICE_MONTHLY=99
# For recurring Razorpay subscriptions:
RAZORPAY_PLAN_ID_PRO=plan_...
RAZORPAY_USE_SUBSCRIPTIONS=true
```

Razorpay checkout creates an order or subscription on the server. The browser callback is never trusted by itself: the API verifies the Razorpay HMAC signature, checks the provider payment status, records an idempotent billing event, creates a local invoice, and only then activates Pro. Configure the Razorpay webhook URL as `/api/billing/webhook/razorpay` on an HTTPS deployment. `cashfree`, `phonepe`, `stripe`, `paypal`, `paddle`, and `lemonsqueezy` are present as provider interface targets and remain explicitly unavailable until their independent adapters are implemented and configured.

The billing dashboard is available at `/api/billing/dashboard` and in the authenticated workspace. The zero-cost default remains `PAYMENT_PROVIDER=none`; no payment is taken in that mode.

## Social platforms and publishing

The backend exposes an independent `SocialPlatformProvider` for YouTube, Instagram, TikTok, and Facebook. Each provider owns OAuth, metadata listing, media-import capability, and publishing capability. Official credentials are optional and blank by default.

Configure only the official developer apps you intend to use:

```env
SOCIAL_OAUTH_REDIRECT_URI=http://localhost:5173/api/social/oauth/callback
TOKEN_ENCRYPTION_KEY=<Fernet key; OAuth tokens are encrypted at rest>
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
META_APP_ID=
META_APP_SECRET=
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
```

The UI distinguishes:

- Not configured — no official developer credentials are present.
- Ready for OAuth — credentials exist, but the user has not authenticated.
- Connected — OAuth completed successfully and the account is stored encrypted.
- Metadata only — the platform lists videos but does not provide an authorized original-media download method.
- Publish available — the provider exposes an official publishing endpoint for the granted scopes.

The application never asks for social passwords, cookies, pasted tokens, or session data. It never scrapes platform pages or uses unauthorized downloaders. OAuth/API quotas are controlled by the platform; they are not represented as unlimited free usage. See [`docs/SOCIAL_PLATFORM_SETUP.md`](docs/SOCIAL_PLATFORM_SETUP.md) for the official-credential setup notes.

## Testing checklist

Verify locally with:

1. A podcast/interview with clear speech.
2. A comedy or reaction video.
3. An action-heavy video with little speech.
4. Invalid file extensions.
5. A file over the configured size limit.
6. A video without an audio track.
7. Caption synchronization after rendering.
8. 9:16 output dimensions and non-zero MP4 size.
9. Logo, hook, speed, and licensed-audio settings.
10. Cleanup of failed project files.

## Current MVP boundaries

- Smart vertical cropping uses a conservative local OpenCV face detector when a face is visible; otherwise it falls back to a safe center crop. It is not a full multi-speaker tracker.
- `faster-whisper` is an optional local provider and is not a paid API. If it is absent or fails, the app does not fake captions.
- Music and sound effects are only read from local user-provided/library assets. No commercial music is bundled.
- No automatic publishing is implemented. Users download and review clips themselves.
