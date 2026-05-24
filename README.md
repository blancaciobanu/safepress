# SafePress

> Digital safety platform for journalists - Master's Dissertation Project

![React](https://img.shields.io/badge/React-19.2.0-blue)
![Firebase](https://img.shields.io/badge/Firebase-10.x-orange)
![Vite](https://img.shields.io/badge/Vite-7.3.1-purple)

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Visit the Vite URL shown in your terminal, usually `http://localhost:5173`.

## Features

- **Security Quiz** — 31-question assessment across 6 categories with risk profiling (0-100% score)
- **Dual-state Home** — Public visitors get editorial orientation with crisis-first hierarchy; signed-in users get a personalised brief with animated progress rings, security rank label, stat cards, and quest-style Up Next — no separate `/dashboard` route
- **Interactive Setup Checklist** — 31 actionable security tasks with progress tracking (synced to Firestore)
- **Smart Resource Filtering** — Risk-based tool recommendations (25+ security tools, personalised by quiz results)
- **OS Security Guides** — Step-by-step hardening for Windows, macOS, Linux, iOS, Android with animated OS UI mockups
- **AI Security Section** — Safe AI usage, deepfake detection, privacy-respecting tools
- **Source Protection** — 5-tab investigative-journalism opsec guide (compartmentalization, first contact, meeting & handoff, after publication, legal protections) — integrated as a tab in Resources
- **AI Advisor** — Authenticated journalists chat with Aegis for tailored security guidance; all AI calls are routed through Firebase Cloud Functions (no client-side API key)
- **Threat Modeling** — AI-powered journalist threat analysis: context intake → adversary mapping → prioritised recommendations; client-side privacy guard scans for PII before submission
- **Security Simulations** — Step-through scenario training (phishing, source exposure, device seizure, doxxing) with per-scenario confidence self-assessment saved to Firestore
- **Crisis Mode Overlay** — Fullscreen overlay triggered by a pill toggle in the header; 4 scenarios (hacked, source exposed, doxxed, phishing) with checklist, progress bar, and per-step "how?" guides; direct-call links to CPJ/RSF/EFF
- **Community Hub** — Discussions, Q&A, and AMA (Ask Me Anything) with likes, comments, category filtering, always-on role labels, sort controls (newest / top / unanswered), accepted-answer on Q&A, self-service delete, profile modal, and user-reporting
- **Support Request Workflow** — Journalists submit crisis requests; verified specialists claim and resolve them; request form shows live count and avatars of available specialists
- **Case Messaging** — Bi-directional in-case chat between journalist and specialist with read-receipt state markers (awaiting specialist / awaiting reporter / monitoring / ready to file)
- **AI Support Drafting** — Verified users can turn rough crisis notes into a structured support request draft; obvious identifiers are redacted before the notes are sent to the model
- **My Cases** — Journalist view of all their support request history at `/my-cases`
- **Specialist Dashboard** — Dedicated dashboard at `/specialist-dashboard` with tabbed request queue, stats (resolved/rating/active), profile sidebar, and feedback reviews
- **Specialist Case File** — Specialist view of an individual case at `/specialist-cases/:id` with full messaging, resolution report, and claim/resolve controls
- **Support Case Desk** — Journalist view of their case at `/support-cases/:id` with messaging thread and post-resolution feedback form
- **Specialist Feedback & Rating** — Journalists rate specialists (1-5 stars + comment) after resolution
- **Verification UX** — Welcome screen for new journalists; specialists are routed to a verification dossier form before accessing the dashboard; pending/rejected banners with admin-written rejection reason and reapply CTA
- **Email Verification Gate** — Email/password accounts must verify before community posting/reporting and confidential support requests unlock
- **Redacted Support Queue** — Specialists browse a metadata-only queue first; full requester details appear only after claim
- **Privacy Guard** — Client-side PII analysis (email, phone, URL, location patterns) with redaction before any AI submission; consent modal with visible redacted preview
- **User Authentication** — Secure login/signup with Firebase (anonymous identity system); dynamic tagline and hardened `accountType` whitelist in signup
- **Specialist Verification** — Admin dashboard for security expert approval, optional rejection reason textarea, and reports tab for reviewing community-reported posts/comments
- **Settings Page** — Profile management & password change
- **Protected Routes** — Auth-gated pages redirect to login; specialist-only routes redirect based on verification status
- **Firestore Security Rules** — Production rules deployed (not test mode); support requests are role-restricted, authors can delete their own posts/comments, and `community-reports` is admin-only for review

## Project Structure

```
safepress/
├── src/
│   ├── components/
│   │   ├── layout/                    # Header, MainLayout
│   │   ├── editorial/
│   │   │   ├── NewsPage.jsx           # Shared editorial design-system primitives
│   │   │   └── RotatingType.jsx       # Rotating typography animation
│   │   ├── CrisisOverlay.jsx          # Fullscreen crisis mode overlay
│   │   ├── PageLoader.jsx             # Full-page loading spinner
│   │   ├── ProtectedRoute.jsx
│   │   ├── ProtectedAdminRoute.jsx
│   │   ├── RouteLoader.jsx            # Shared lazy-route loading state
│   │   └── VerifiedBadge.jsx
│   ├── config/
│   │   ├── externalResources.js       # RSS feed URLs for news aggregation
│   │   ├── firebaseCollections.js     # Centralized Firestore collection name constants
│   │   └── security.js               # Password rules, support types, community categories
│   ├── contexts/
│   │   ├── AuthContext.jsx            # Authentication state & methods
│   │   └── CrisisContext.jsx          # Crisis overlay state (open/active scenario)
│   ├── firebase/
│   │   └── config.js                  # Firebase initialization (uses env vars)
│   ├── features/
│   │   ├── admin/services/            # Reports + specialist verification Firestore logic
│   │   ├── ai/
│   │   │   ├── components/
│   │   │   │   └── PrivacyGuardModal.jsx  # Consent modal shown before AI submission
│   │   │   └── services/
│   │   │       ├── aiService.js       # Firebase callable wrappers + system prompt builder
│   │   │       └── privacyGuard.js    # PII detection + text redaction before AI calls
│   │   ├── community/
│   │   │   ├── components/            # AuthorLine, AuthorProfileModal, modals, UserAvatar
│   │   │   ├── hooks/                 # useCommunityPosts, useFollowedPosts, useNewPost, etc.
│   │   │   └── services/
│   │   │       ├── amaService.js      # AMA post create/list
│   │   │       └── communityService.js  # Posts, comments, reports
│   │   ├── home/
│   │   │   ├── hooks/useHomeData.js   # Field signal + journalist/specialist data loading
│   │   │   └── services/
│   │   │       ├── homeService.js     # Firebase data fetching for Home
│   │   │       └── homePageModel.jsx  # Brief builders (returns JSX nodes)
│   │   ├── news/
│   │   │   ├── NewsSidebar.jsx        # External security news sidebar component
│   │   │   └── useNewsArticles.js     # RSS feed aggregation hook
│   │   ├── notifications/
│   │   │   ├── hooks/useNotifications.js    # Notification count + panel state
│   │   │   └── services/notificationService.js  # Firestore notification queries
│   │   ├── resources/
│   │   │   └── OSMockup.jsx           # Animated OS UI mockup for Resources guides
│   │   ├── setup/data/setupTasks.js   # Static task data, allTasks, TASKS_BY_ID
│   │   ├── simulations/services/
│   │   │   └── simulationService.js   # Simulation progress Firestore reads/writes
│   │   ├── support/services/
│   │   │   └── supportService.js      # Support request workflow + case messaging
│   │   └── users/
│   │       ├── accountRouting.js      # Post-auth path logic (Welcome, specialist verification)
│   │       ├── verification.js        # Specialist verification status constants
│   │       └── services/userService.js  # Private user + public profile helpers
│   ├── utils/
│   │   ├── externalLinks.js           # External link helpers
│   │   ├── logger.js                  # Dev-only error logging (silent in production)
│   │   ├── time.js                    # Time formatting utilities
│   │   └── userUtils.js               # Anonymous identity generation
│   ├── pages/
│   │   ├── Home.jsx                   # Dual-state landing (public editorial / signed-in brief)
│   │   ├── AIAdvisor.jsx              # AI chat advisor (protected, /ai-advisor)
│   │   ├── ThreatModel.jsx            # AI threat model generator (protected, /threat-model)
│   │   ├── Simulations.jsx            # Security scenario training (/simulations)
│   │   ├── MyCases.jsx                # Journalist support request history (/my-cases)
│   │   ├── SupportCaseDesk.jsx        # Journalist case detail + messaging (/support-cases/:id)
│   │   ├── SpecialistCaseFile.jsx     # Specialist case file + messaging (/specialist-cases/:id)
│   │   ├── SpecialistDashboard.jsx    # Specialist dashboard (/specialist-dashboard)
│   │   ├── SpecialistVerification.jsx # Specialist dossier form (/specialist-verification)
│   │   ├── SecurityScore.jsx          # Security quiz (31 questions, 6 categories)
│   │   ├── SecureSetup.jsx            # Interactive 31-task checklist
│   │   ├── Resources.jsx              # OS guides, tools, AI security, source protection (tabs)
│   │   ├── Community.jsx              # Discussions, Q&A, AMA with reporting + moderation
│   │   ├── CommunityPostDetail.jsx    # Individual post + comments (/community/:postId)
│   │   ├── CreatePost.jsx             # New community post (/community/new)
│   │   ├── RequestSupport.jsx         # Crisis support request form
│   │   ├── AdminDashboard.jsx         # Specialist verification + reports (/admin)
│   │   ├── Welcome.jsx                # Post-signup onboarding for new journalists
│   │   ├── Settings.jsx               # User settings (protected)
│   │   ├── Login.jsx                  # Login page
│   │   ├── Signup.jsx                 # Registration (journalist or specialist)
│   │   └── SourceProtection.jsx       # Redirect → /resources?tab=source-protection
│   ├── App.jsx                        # Route definitions
│   ├── main.jsx                       # Entry point
│   └── index.css                      # Global styles + Tailwind v4 @theme
├── .env                               # Firebase credentials (not in git)
├── firestore.rules                    # Firestore security rules (deployed)
├── firestore.indexes.json             # Firestore composite indexes (deployed)
└── TECHNICAL_DOCUMENTATION.md
```

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Framer Motion
- **Backend**: Firebase (Auth + Firestore, used as a backend-as-a-service)
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Design**: Editorial premium Home surface (Fraunces + Geist) layered on top of the existing newsroom-dark product UI

## Pages

| Page | Route | Protected | Description |
|------|-------|-----------|-------------|
| Home | `/` | No | Dual-state landing: editorial orientation for visitors, signed-in brief for journalists/specialists |
| Specialist Dashboard | `/specialist-dashboard` | Yes (specialist) | Tabbed request queue, stats, profile sidebar, feedback reviews |
| Security Quiz | `/security-score` | No | 31-question assessment with risk profiling |
| Secure Setup | `/secure-setup` | No | Interactive checklist (31 tasks, progress tracking) |
| Resources | `/resources` | No | OS guides, security tools, AI safety, source protection (tabs) |
| Community | `/community` | No | Discussions, Q&A, AMA — sort, reporting, accepted-answer, role labels |
| Community Post Detail | `/community/:postId` | No | Individual post with comments |
| Create Post | `/community/new` | Yes (email verified) | New community post form |
| Simulations | `/simulations` | No | Step-through security scenario training with confidence tracking |
| AI Advisor | `/ai-advisor` | Yes | Chat with Aegis for tailored security guidance |
| Threat Model | `/threat-model` | Yes | AI-driven journalist threat analysis with adversary mapping |
| Request Support | `/request-support` | No (view), Yes (submit) | Crisis support request form |
| My Cases | `/my-cases` | Yes | Journalist's support request history |
| Support Case Desk | `/support-cases/:requestId` | Yes | Journalist case detail with bi-directional messaging |
| Specialist Case File | `/specialist-cases/:requestId` | Yes (specialist) | Specialist case file with messaging and resolution tools |
| Specialist Verification | `/specialist-verification` | Yes (specialist) | Specialist dossier submission form |
| Welcome | `/welcome` | Yes | Post-signup onboarding for new journalists |
| Settings | `/settings` | Yes | Profile & password management |
| Admin | `/admin` | Admin Only | Specialist verification + community reports management |
| Login | `/login` | No | User authentication |
| Signup | `/signup` | No | Account creation (journalist or specialist) |

> **Crisis Mode** is not a page — it's a fullscreen overlay triggered by the pill toggle in the header. Available on all pages.
> `/dashboard` and `/crisis` redirect to `/`. The journalist view is now integrated into the signed-in Home state.
> `/source-protection` redirects to `/resources?tab=source-protection`.

## Firebase Setup

1. Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create Firestore Database
4. Create a `.env` file in the project root:
   ```
   VITE_FIREBASE_API_KEY=your_key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```
5. Deploy security rules, indexes, and functions:
   ```bash
   firebase functions:secrets:set ANTHROPIC_API_KEY
   cd functions && npm install && cd ..
   firebase deploy --only firestore:rules,firestore:indexes,functions
   ```

## Architecture Notes

- SafePress is a client-rendered React app with Firebase handling auth and database responsibilities.
- A lightweight feature service layer now exists under `src/features/*/services` so pages do less direct Firestore work.
- The support request page is public to read, but actual request submission now requires both authentication and a verified email.
- Firebase App Check scaffolding is wired in `src/firebase/config.js` and activates when `VITE_RECAPTCHA_SITE_KEY` is configured.
- Firestore rules now prefer verified-email trust, optional custom admin claims, and a redacted specialist queue for support requests.
- Admin role is granted via the `setAdminClaim` Firebase callable (deployed in `europe-west1`); all admin checks (Firestore rules, function caller validation, client UI) rely on the `admin: true` custom claim plus `email_verified`.
- Route-level lazy loading is enabled in `src/App.jsx`, and Vite now splits Firebase / router / motion / icon vendor chunks so first load is much smaller.
- Startup performance is improved by avoiding public-profile writes during auth hydration and deferring notification-count Firestore reads until the browser is idle.
- Public routes no longer block on Firebase auth hydration at the app root; only protected routes wait for auth before rendering gated content.
- Logged-in pages now reuse hydrated auth profile data more aggressively, reducing duplicate Firestore reads on `Dashboard`, `SecureSetup`, and `SpecialistDashboard`.
- Header notifications now batch followed-post lookups and only inspect posts that appear updated since the last seen timestamp.
- Console hardening now includes restricted browser API key website referrers and Firebase Authentication authorized domains for Google sign-in.
- Home now has two presentation states: anonymous visitors get editorial orientation, while signed-in journalists/specialists get a read-only front-page brief assembled from already-authorized data sources without any new writes or rule loosening.

## Data Structure

### Firestore Collections

**`users/{uid}`** — User profiles, scores, setup progress
```json
{
  "email": "user@example.com",
  "username": "SecureReporter_4829",
  "avatarIcon": "🦊",
  "accountType": "journalist",
  "// realName": "specialist accounts only — never written for journalists",
  "createdAt": "2026-02-12T...",
  "securityScores": [
    {
      "score": 75,
      "riskLevel": "medium",
      "completedAt": "2026-02-12T...",
      "categoryScores": {
        "password": { "percentage": 80 },
        "device": { "percentage": 70 }
      }
    }
  ],
  "setupProgress": {
    "completedTasks": ["pass-manager", "device-encryption"],
    "lastUpdated": "2026-02-12T..."
  },
  "verificationStatus": "pending-email-verification"
}
```

**`public-profiles/{uid}`** — Public-safe profile data for community/specialist discovery
```json
{
  "username": "SecureReporter_4829",
  "avatarIcon": "🦊",
  "accountType": "specialist",
  "verificationStatus": "approved",
  "createdAt": "2026-02-12T...",
  "specialistProfile": {
    "bio": "",
    "expertiseAreas": [],
    "certifications": []
  }
}
```

**`community-posts/{postId}`** — Discussions, stories, Q&A
```json
{
  "type": "discussion",
  "title": "best vpn for fieldwork?",
  "content": "...",
  "authorId": "uid",
  "authorName": "SecureReporter_4829",
  "authorIcon": "🦊",
  "authorType": "journalist",
  "authorVerificationStatus": null,
  "category": "communication-security",
  "createdAt": "2026-02-12T...",
  "likes": 3,
  "likedBy": ["uid1", "uid2", "uid3"],
  "commentCount": 2,
  "resolved": false,
  "isAnonymous": false,
  "acceptedCommentId": null
}
```

**`community-posts/{postId}/comments/{commentId}`** — Individual replies/answers
```json
{
  "authorId": "uid",
  "authorName": "SecureReporter_4829",
  "authorIcon": "🦊",
  "authorType": "journalist",
  "authorVerificationStatus": null,
  "content": "try signal for source contact",
  "createdAt": "2026-02-12T...",
  "deleted": false
}
```

**`support-requests/{requestId}`** — Private support request details
```json
{
  "requesterId": "uid",
  "requesterName": "Jane Doe",
  "requesterEmail": "user@example.com",
  "requesterPhone": null,
  "crisisType": "hacked",
  "urgency": "urgent",
  "description": "full confidential details live here",
  "contactMethod": "email",
  "status": "open",
  "claimedBy": null,
  "claimedByName": null,
  "claimedAt": null,
  "resolvedAt": null,
  "createdAt": "2026-02-12T..."
}
```

**`support-request-queue/{requestId}`** — Specialist-visible redacted queue
```json
{
  "requesterId": "uid",
  "crisisType": "hacked",
  "urgency": "urgent",
  "contactMethod": "email",
  "status": "open",
  "claimedBy": null,
  "claimedByName": null,
  "claimedAt": null,
  "resolvedAt": null,
  "createdAt": "2026-02-12T..."
}
```

**`community-reports/{reportId}`** — User reports of posts/comments
```json
{
  "postId": "abc123",
  "commentId": null,
  "reportedBy": "uid",
  "reason": "spam",
  "note": "optional free-text context",
  "status": "open",
  "createdAt": "2026-04-19T..."
}
```

**`support-requests/{requestId}/messages/{messageId}`** — Case messaging thread
```json
{
  "authorId": "uid",
  "authorRole": "journalist",
  "authorName": "SecureReporter_4829",
  "content": "message text",
  "createdAt": "2026-05-10T...",
  "marker": "awaiting_specialist"
}
```

> `marker` governs case workflow state. Values: `awaiting_specialist`, `awaiting_reporter`, `monitoring`, `ready_to_file`. The latest message marker wins.

## Design System

- **Colors**: Crimson (alerts), Midnight Blue (primary), Olive (success), Amber (warnings)
- **Typography**: Red Hat Display (headings) + Inter (body)
- **Style**: Lowercase text, glass morphism, editorial layout
- **Animations**: Framer Motion with `[0.22, 1, 0.36, 1]` easing

## Documentation

See [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md) for complete architecture, authentication flows, data models, component organization, and development guide.

## Testing User Flow

1. **Sign up** — Create account at `/signup` (journalist or specialist)
2. **Take quiz** — Complete 31-question security assessment
3. **View home brief** — See personalized score, rank, Up Next recommendations (signed-in state of `/`)
4. **Secure setup** — Check off security tasks, track progress
5. **Browse resources** — OS guides, tools (filtered by risk level), AI safety, source protection
6. **Community** — Post discussions, ask questions, join AMA sessions with specialists
7. **Try simulations** — Step through security scenarios at `/simulations`
8. **Run threat model** — Submit your context at `/threat-model` for an AI threat analysis
9. **Request support** — Submit crisis request; track it at `/my-cases`
10. **Rate specialist** — After resolution, rate with 1-5 stars from the case desk

## Common Tasks

### Access current user
```javascript
import { useAuth } from './contexts/AuthContext';

const { user, loading } = useAuth();
// user.username, user.avatarIcon, user.accountType, etc.
```

### Save to Firestore
```javascript
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase/config';

await updateDoc(doc(db, 'users', userId), data);
```

### Add a new protected page
```javascript
// App.jsx
<Route
  path="new-page"
  element={
    <ProtectedRoute>
      <NewPage />
    </ProtectedRoute>
  }
/>
```

## Troubleshooting

- **Port in use**: Vite will auto-select another port
- **Firebase errors**: Check console for auth/firestore errors
- **Permission denied**: Ensure Firestore security rules are deployed
- **Blank page**: Check browser console for errors

## License

Educational project - Master's Dissertation
Not for commercial use

---

**Built with**: React + Firebase + Claude Code
**Purpose**: Journalist digital safety education
**Year**: 2026
