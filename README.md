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

Visit `http://localhost:5174` in your browser.

## Features

- **Security Quiz** — 31-question assessment across 6 categories with risk profiling (0-100% score)
- **Personalized Dashboard** — "hello, username" greeting, score history, smart recommendations, quick links
- **Interactive Setup Checklist** — 31 actionable security tasks with progress tracking (synced to Firestore)
- **Smart Resource Filtering** — Risk-based tool recommendations (25+ security tools, personalized by quiz results)
- **OS Security Guides** — Step-by-step hardening for Windows, macOS, Linux, iOS, Android
- **AI Security Section** — Safe AI usage, deepfake detection, privacy-respecting tools
- **Crisis Mode Overlay** — Fullscreen overlay triggered by a pill toggle in the header; 4 scenarios (hacked, source exposed, doxxed, phishing) with checklist, progress bar, and per-step "how?" guides; direct-call links to CPJ/RSF/EFF
- **Community Hub** — Discussions, anonymous stories, and Q&A with likes, comments, and category filtering
- **Support Request Workflow** — Journalists submit crisis requests, verified specialists claim and resolve them
- **Specialist Dashboard** — Dedicated dashboard at `/specialist-dashboard` with tabbed request queue, stats (resolved/rating/active), profile sidebar, and feedback reviews
- **Specialist Feedback & Rating** — Journalists rate specialists (1-5 stars + comment) after resolution
- **User Authentication** — Secure login/signup with Firebase (anonymous identity system)
- **Specialist Verification** — Admin dashboard for security expert approval
- **Settings Page** — Profile management & password change
- **Protected Routes** — Dashboard & Settings require login
- **Firestore Security Rules** — Production rules deployed (not test mode)

## Project Structure

```
safepress/
├── src/
│   ├── components/
│   │   ├── layout/           # Header, Footer, MainLayout
│   │   ├── CrisisOverlay.jsx # Fullscreen crisis mode overlay
│   │   ├── ProtectedRoute.jsx
│   │   ├── ProtectedAdminRoute.jsx
│   │   └── VerifiedBadge.jsx
│   ├── contexts/
│   │   ├── AuthContext.jsx   # Authentication state & methods
│   │   └── CrisisContext.jsx # Crisis overlay state (open/active scenario)
│   ├── firebase/
│   │   └── config.js         # Firebase initialization (uses env vars)
│   ├── utils/
│   │   └── userUtils.js      # Anonymous identity generation
│   ├── pages/
│   │   ├── Home.jsx          # Landing page
│   │   ├── Dashboard.jsx     # Journalist dashboard (scores, requests, feedback)
│   │   ├── SpecialistDashboard.jsx # Specialist dashboard (queue, stats, profile)
│   │   ├── SecurityScore.jsx # Security quiz (31 questions, 6 categories)
│   │   ├── SecureSetup.jsx   # Interactive 31-task checklist
│   │   ├── Resources.jsx     # OS guides, tools, AI security (3 tabs)
│   │   ├── Community.jsx     # Discussions, stories, Q&A (3 tabs)
│   │   ├── RequestSupport.jsx # Crisis support request form
│   │   ├── AdminDashboard.jsx # Specialist verification management
│   │   ├── Settings.jsx      # User settings
│   │   ├── Login.jsx         # Login page
│   │   └── Signup.jsx        # Registration (journalist or specialist)
│   ├── App.jsx               # Route definitions
│   ├── main.jsx              # Entry point
│   └── index.css             # Global styles + Tailwind v4 @theme
├── .env                      # Firebase credentials (not in git)
├── firestore.rules           # Firestore security rules (deployed)
├── firestore.indexes.json    # Firestore composite indexes (deployed)
└── TECHNICAL_DOCUMENTATION.md
```

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Framer Motion
- **Backend**: Firebase (Auth + Firestore)
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Design**: Editorial Bauhaus, lowercase aesthetic, glass morphism

## Pages

| Page | Route | Protected | Description |
|------|-------|-----------|-------------|
| Home | `/` | No | Landing page |
| Dashboard | `/dashboard` | Yes | Journalist: scores, recommendations, requests, feedback |
| Specialist Dashboard | `/specialist-dashboard` | Yes (specialist) | Tabbed request queue, stats, profile, feedback |
| Security Quiz | `/security-score` | No | 31-question assessment with risk profiling |
| Secure Setup | `/secure-setup` | No | Interactive checklist (31 tasks, progress tracking) |
| Resources | `/resources` | No | OS guides, security tools, AI safety (3 tabs) |
| Community | `/community` | No | Discussions, anonymous stories, Q&A (3 tabs) |
| Request Support | `/request-support` | No | Submit crisis request to specialist |
| Settings | `/settings` | Yes | Profile & password management |
| Admin | `/admin` | Admin Only | Specialist verification dashboard |
| Login | `/login` | No | User authentication |
| Signup | `/signup` | No | Account creation (journalist or specialist) |

> **Crisis Mode** is not a page — it's a fullscreen overlay triggered by the pill toggle in the header. Available on all pages.

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
5. Deploy security rules and indexes:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```

## Data Structure

### Firestore Collections

**`users/{uid}`** — User profiles, scores, setup progress
```json
{
  "email": "user@example.com",
  "username": "SecureReporter_4829",
  "avatarIcon": "🦊",
  "realName": "Jane Doe",
  "accountType": "journalist",
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
  "category": "communication-security",
  "createdAt": "2026-02-12T...",
  "likes": 3,
  "likedBy": ["uid1", "uid2", "uid3"],
  "comments": [],
  "resolved": false
}
```

**`support-requests/{requestId}`** — Crisis support workflow
```json
{
  "requesterId": "uid",
  "requesterName": "Jane Doe",
  "crisisType": "hacked",
  "urgency": "urgent",
  "status": "open",
  "claimedBy": null,
  "feedback": null,
  "createdAt": "2026-02-12T..."
}
```

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
3. **View dashboard** — See personalized score, recommendations, quick links
4. **Secure setup** — Check off security tasks, track progress
5. **Browse resources** — OS guides, tools (filtered by risk level), AI safety
6. **Community** — Post discussions, share anonymous stories, ask questions
7. **Request support** — Submit crisis request, track status on dashboard
8. **Rate specialist** — After resolution, rate with 1-5 stars

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
