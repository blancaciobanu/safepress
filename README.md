# SafePress

Digital safety platform for journalists, built as a Master's dissertation project.

![React](https://img.shields.io/badge/React-19.2.x-blue)
![Firebase](https://img.shields.io/badge/Firebase-12.9.x-orange)
![Vite](https://img.shields.io/badge/Vite-7.3.x-purple)
![Cloud Functions](https://img.shields.io/badge/Firebase_Functions-Node_20-yellow)

SafePress combines security education, crisis guidance, community support, specialist case handling, and privacy-aware AI assistance for journalists and newsroom-adjacent users.

## Current Status

- `npm run lint` passes for the full repo, including Firebase Functions.
- `npm run build` passes and uses route-level code splitting.
- The app is a React/Vite frontend backed by Firebase Auth, Firestore, Firestore rules, and Firebase Cloud Functions.
- The codebase now has a feature-service layer, but several page components are still intentionally marked as future cleanup targets because they remain large.

## Quick Start

```bash
npm install
npm run dev
```

Visit the Vite URL shown in the terminal, usually `http://localhost:5173`.

Useful commands:

```bash
npm run lint
npm run build
npm run preview
```

## Tech Stack

- **Frontend**: React 19, Vite 7, React Router 7, Tailwind CSS 4, Framer Motion, Lucide React
- **Backend services**: Firebase Authentication, Cloud Firestore, Firebase Cloud Functions v2
- **Functions runtime**: Node 20, `europe-west1`
- **AI provider**: Anthropic, called only from Cloud Functions via the `ANTHROPIC_API_KEY` secret
- **Security controls**: Firestore security rules, custom admin claim support, email-verification gates, App Check scaffolding

## Core Features

- **Dual-state Home**: public editorial landing page for visitors; signed-in role-aware brief for journalists and specialists.
- **Security Score**: 31-question journalist security assessment across password, device, communication, data, physical, and risk categories.
- **Secure Setup**: 31-task hardening checklist with Firestore-backed progress.
- **Resources**: OS hardening guides, security tools, AI safety, and source-protection guidance.
- **Crisis Mode**: global fullscreen overlay with scenario-specific checklists and emergency organization links.
- **Community Hub**: discussions, Q&A, AMA posts, comments, likes, accepted answers, reporting, profile modals, and role labels.
- **Support Workflow**: journalists submit support requests; verified specialists claim, message, resolve, and receive feedback.
- **Case Messaging**: journalist and specialist case desks with workflow markers: `awaiting_specialist`, `awaiting_reporter`, `monitoring`, `ready_to_file`.
- **Specialist Verification**: dossier submission, admin review, needs-more-info flow, rejection reason, and public profile sync.
- **Admin Dashboard**: specialist review, community reports, and admin-claim tooling.
- **AI Advisor**: authenticated chat guidance routed through `generateAiAdvisorReply`.
- **Threat Model**: authenticated AI-assisted threat report routed through `generateThreatModel`.
- **AI Support Drafting**: verified users can turn rough crisis notes into structured drafts through `draftSupportRequest`.
- **Privacy Guard**: client and server redaction of obvious identifiers before AI submission.

## Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Visitor landing page or signed-in brief |
| `/security-score` | Public | Security assessment |
| `/secure-setup` | Public, persists when signed in | Setup checklist |
| `/resources` | Public | Guides, tools, AI safety, source protection |
| `/community` | Public read | Community posts and AMAs |
| `/community/new` | Verified email to submit | Create community post |
| `/community/:postId` | Public read | Post detail and comments |
| `/simulations` | Public, persists when signed in | Security scenario training |
| `/request-support` | Public view, verified email to submit | Crisis support intake |
| `/my-cases` | Authenticated | Journalist case history |
| `/support-cases/:requestId` | Authenticated requester | Journalist case desk |
| `/specialist-dashboard` | Authenticated specialist | Specialist queue and stats |
| `/specialist-cases/:requestId` | Assigned/approved specialist | Specialist case file |
| `/specialist-verification` | Authenticated specialist | Verification dossier |
| `/ai-advisor` | Authenticated | AI security advisor |
| `/threat-model` | Authenticated | AI threat model report |
| `/settings` | Authenticated | Profile and password settings |
| `/admin` | Admin claim | Verification, reports, internal admin tools |
| `/welcome` | Authenticated | Journalist onboarding |
| `/login`, `/signup` | Public | Authentication |

Redirects:

- `/dashboard` redirects to `/`.
- `/crisis` redirects to `/`.
- `/source-protection` redirects to `/resources?tab=source-protection`.

## Project Structure

```text
safepress/
├── functions/
│   └── index.js                         # Firebase callable functions and AI server logic
├── public/
├── src/
│   ├── components/
│   │   ├── editorial/                   # NewsPage primitives and editorial typography helpers
│   │   ├── layout/                      # Header and MainLayout
│   │   ├── CrisisOverlay.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── ProtectedAdminRoute.jsx
│   │   └── RouteLoader.jsx
│   ├── config/
│   │   ├── externalResources.js
│   │   ├── firebaseCollections.js
│   │   └── security.js
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   └── CrisisContext.jsx
│   ├── features/
│   │   ├── admin/services/
│   │   ├── ai/components/
│   │   ├── ai/services/
│   │   ├── community/components/
│   │   ├── community/hooks/
│   │   ├── community/services/
│   │   ├── home/hooks/
│   │   ├── home/services/
│   │   ├── news/
│   │   ├── notifications/
│   │   ├── resources/
│   │   ├── setup/
│   │   ├── simulations/services/
│   │   ├── support/
│   │   └── users/
│   ├── firebase/config.js
│   ├── pages/
│   ├── utils/
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── firestore.rules
├── firestore.indexes.json
├── firebase.json
├── TECHNICAL_DOCUMENTATION.md
└── PROJECT_ARCHITECTURE_REVIEW.md
```

## Firebase Setup

Create a `.env` file in the project root:

```bash
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_RECAPTCHA_SITE_KEY=optional_app_check_key
```

Install and deploy backend assets:

```bash
firebase functions:secrets:set ANTHROPIC_API_KEY
cd functions && npm install && cd ..
firebase deploy --only firestore:rules,firestore:indexes,functions
```

## Cloud Functions

All callable functions live in `functions/index.js` and run in `europe-west1`.

- `setAdminClaim`: grants or revokes the `admin` custom claim.
- `reviewSpecialistVerification`: approves, rejects, or requests more information for specialist dossiers.
- `submitSpecialistVerificationDossier`: validates and stores specialist verification submissions.
- `draftSupportRequest`: redacts rough crisis notes and returns a structured support draft.
- `generateAiAdvisorReply`: redacts chat messages and returns AI advisor text.
- `generateThreatModel`: redacts sensitive free text and returns a structured threat report.

## Firestore Collections

- `users`: private account profile, auth metadata, quiz scores, setup progress, specialist verification data, admin claim refresh timestamp.
- `public-profiles`: public-safe identity and specialist profile fields used by community/profile surfaces.
- `community-posts`: discussions, Q&A, AMA posts, likes, reporting metadata, accepted answers.
- `community-posts/{postId}/comments`: comments and soft-delete state.
- `community-reports`: user reports for admin review.
- `support-requests`: private crisis request details and resolution state.
- `support-request-queue`: specialist-visible redacted queue metadata, including optional `previewNote`.
- `support-requests/{requestId}/messages`: case thread messages and workflow markers.

## Architecture Notes

- Pages are lazy-loaded from `src/App.jsx`; `RouteLoader.jsx` is the shared Suspense fallback.
- Vite splits large vendor groups into dedicated chunks for Firebase, React, router, motion, and icons.
- Public pages render without waiting for Firebase auth hydration; protected routes still wait for auth state.
- Feature services under `src/features/*/services` own most Firestore and callable interactions.
- Remaining direct page-level Firestore calls exist in a few older surfaces such as Settings, SecurityScore, and SecureSetup.
- Documentation should be updated with code changes. `CLAUDE.md` explicitly requires `TECHNICAL_DOCUMENTATION.md` to stay current.

## Code Health Notes

The codebase is clean enough to build and lint, and the recent extraction work made it more maintainable. It is not fully decomposed yet.

Current follow-up cleanup targets:

- Split the largest page components: `RequestSupport`, `ThreatModel`, `AdminDashboard`, `SpecialistDashboard`, `SpecialistCaseFile`, `CommunityPostDetail`, `Settings`, and `SecureSetup`.
- Reduce remaining `eslint-disable` comments by extracting safer hooks/components where practical.
- Move the remaining page-level Firestore writes into feature services.
- Consider server-owned support claim/resolve operations later if the project needs stronger auditability than Firestore rules alone.
- Add automated tests; the repo currently relies on lint/build plus manual Firebase flow checks.

## Documentation

- `TECHNICAL_DOCUMENTATION.md`: detailed architecture, auth flow, data models, feature notes, and phase history.
- `PROJECT_ARCHITECTURE_REVIEW.md`: concise current architecture review and remaining cleanup priorities.
- `CLAUDE.md`: project rule reminder for documentation updates.

## License

Educational project for a Master's dissertation. Not for commercial use.
