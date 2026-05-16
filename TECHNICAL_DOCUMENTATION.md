# SafePress - Technical Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Firebase Setup](#firebase-setup)
5. [File Structure](#file-structure)
6. [Authentication Flow](#authentication-flow)
7. [Data Models](#data-models)
8. [Component Organization](#component-organization)
9. [Key Features](#key-features)
10. [Development Guide](#development-guide)

---

## Project Overview

**SafePress** is a digital safety platform designed specifically for journalists. It provides security assessments, crisis response guidance, educational resources, and personalized recommendations to help journalists protect themselves, their sources, and their work.

### Master's Dissertation Project
- **Student**: Business/PR background (non-technical)
- **Purpose**: Digital safety education for journalists
- **Built With**: AI assistance (Claude Code)
- **Deployment**: Web application (React + Firebase)

---

## Technology Stack

### Frontend
- **React 19.2.0** - Modern UI library
- **Vite 7.3.1** - Fast development build tool
- **React Router DOM** - Client-side routing
- **Framer Motion** - Smooth animations
- **Lucide React** - Icon library
- **Tailwind CSS v4** - Utility-first styling with CSS-native `@theme`

### AI
- **@anthropic-ai/sdk** - Claude API integration (client-side, `dangerouslyAllowBrowser: true`)
  - Model: `claude-haiku-4-5-20251001`
  - Streaming via `client.messages.stream()` + `.on('text', handler)`
  - API key: `VITE_ANTHROPIC_API_KEY` in `.env` (never commit this file)
  - For production: move to a Firebase Cloud Function to avoid key exposure

### Backend & Services
- **Firebase** - Backend-as-a-Service
  - **Firebase Authentication** - User management (email/password)
  - **Firestore Database** - NoSQL document database for user data
  - **Firebase SDK** - Client-side integration

### Design System
- **Typography**: Red Hat Display (headings) + Inter (body)
- **Color Palette**:
  - Crimson (#DC2626) - Urgency, alerts
  - Midnight Blue (#3B82F6) - Trust, primary actions
  - Olive Green (#84CC16) - Success, safety
  - Amber (#F59E0B) - Warnings
  - Teal (#2DD4BF) - Modern, fresh
  - Purple (#A78BFA) - Trust, integrity
- **Aesthetic**: Editorial Bauhaus, lowercase text, glass morphism

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Components (UI)                                  │   │
│  │  - Pages (Dashboard, Settings, SecurityScore)    │   │
│  │  - Layout (Header, Footer, MainLayout)           │   │
│  │  - ProtectedRoute (Auth guard)                   │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Feature Services                                │   │
│  │  - supportService (support request workflow)     │   │
│  │  - adminService (reports + verification)         │   │
│  │  - userService (profile reads / reapply)         │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Context Providers                                │   │
│  │  - AuthContext (user state, auth methods)        │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Firebase SDK                                     │   │
│  │  - config.js (initialization)                    │   │
│  │  - auth (Firebase Authentication)                │   │
│  │  - db (Firestore Database)                       │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Firebase Backend                       │
│  ┌──────────────────┐      ┌─────────────────────────┐  │
│  │  Authentication  │      │  Firestore Database     │  │
│  │  - User accounts │      │  Collection: users      │  │
│  │  - Email/Password│      │  Collection: community  │  │
│  │  - Session mgmt  │      │  Collection: support    │  │
│  │                   │      │  Security rules active  │  │
│  └──────────────────┘      └─────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Authentication**:
   ```
   User → Login/Signup → AuthContext → Firebase Auth → User Object → App State
   ```

2. **Quiz Completion**:
   ```
   User Answers → SecurityScore Component → Calculate Score →
   Save to Firestore → Update Dashboard
   ```

3. **Dashboard Display**:
   ```
   User Login → Dashboard → Fetch from Firestore → Display Scores/Recommendations
   ```

4. **Support Workflow**:
   ```
   User Action → supportService → Firestore → Dashboard / Specialist Dashboard UI update
   ```

5. **Route Loading**:
   ```
   User opens route → React Router matches path → lazy page chunk downloads →
   RouteLoader shows briefly → page renders
   ```

---

## Firebase Setup

### Configuration
File: `/src/firebase/config.js`

Firebase credentials are stored in environment variables (`.env` file, not committed to git):

```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};
```

Required `.env` file at project root:
```
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=safepress-9f50c.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=safepress-9f50c
VITE_FIREBASE_STORAGE_BUCKET=safepress-9f50c.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=113890207754
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Firestore Security Rules
File: `/firestore.rules` — deployed via Firebase CLI (`firebase deploy --only firestore:rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuth() { return request.auth != null; }
    function isVerifiedEmailAuth() { return isAuth() && request.auth.token.email_verified == true; }
    function isOwner(userId) { return isAuth() && request.auth.uid == userId; }
    function isAdmin() {
      return isVerifiedEmailAuth() && request.auth.token.admin == true;
    }
  }
}
```

Current behavior of the deployed rules:

- `users`
  - only the owner or an admin can read a private user document
  - users can create only their own user document
  - users can update only a narrow set of self-managed fields such as quiz scores, setup progress, followed posts, and notification timestamps; specialists can additionally update their `realName`
  - `realName` is collected and stored only for specialist accounts (admins read it during verification review); journalist documents must not contain a `realName` field
  - specialist signups enter `pending-email-verification` first and only move into the real review queue after email verification
  - rejected specialists can reapply by moving their own verification status back to `pending`
  - admins can update only specialist-verification fields

- `public-profiles`
  - reads are public
  - profile data is limited to public-safe fields such as username, avatar, account type, verification status, and specialist bio/expertise
  - owners can sync their own public profile from their private `users` document
  - admins can update public verification status

- `support-request-queue`
  - approved specialists can read a redacted queue with crisis metadata only
  - only approved specialists can claim or resolve queue items

- `support-requests`
  - verified-email users can create only requests that name themselves as the requester
  - requesters can read their own requests
  - approved specialists cannot read full private requests until they claim them
  - only approved specialists can claim open requests
  - only the specialist who claimed a request can resolve it
  - only the requester can submit post-resolution feedback
  - only admins can delete requests

- `community-reports`
  - only verified-email users can file reports
  - only admins can read, update, or delete reports

- `community-posts`
  - reads are public
  - create/reply/edit/report actions require verified email for email/password accounts
  - author identity fields are validated against the creator's own user document to prevent specialist/verified spoofing
  - likes are limited to a one-user-at-a-time toggle pattern
  - comment-count updates are limited to a controlled increment path
  - only the post author can edit the post body, toggle resolved state, or set an accepted answer
  - delete is limited to admins or the post author

### Build Performance

SafePress now uses **route-level code splitting**:

- `src/App.jsx` loads page components with `React.lazy(...)`
- `src/components/RouteLoader.jsx` provides a shared loading state while a page chunk is downloading
- `vite.config.js` separates large vendor groups into dedicated chunks (`firebase`, `react-vendor`, `router`, `motion`, `icons`)

Why this matters:

- the browser no longer downloads every page on first visit
- slower devices get a faster first meaningful render
- heavy libraries such as Firebase are cached in their own chunk instead of being mixed into one monolithic app bundle

### Startup Performance

The app also avoids some unnecessary work during first render:

- public routes render immediately instead of waiting for auth hydration at the root provider
- `AuthContext` no longer writes to `public-profiles` during every session hydration
- the header notification badge loads after the browser becomes idle instead of competing with initial navigation
- header notification reads now batch followed-post fetches and skip comment checks for posts that have not changed since `notifLastSeen`
- the dashboard uses the already-hydrated auth profile immediately, then refreshes private user data in the background
- `SecureSetup` and `SpecialistDashboard` now start from hydrated auth/profile data instead of immediately re-reading the same `users/{uid}` document on mount

Why this matters:

- first paint happens sooner for signed-in users
- a page can become usable before lower-priority Firebase reads finish
- SafePress does less duplicate Firestore work during app startup

### Console Configuration

Two important platform settings now exist outside the codebase:

- the Firebase browser API key is restricted to approved website referrers in Google Cloud Console
- Firebase Authentication authorized domains now include local development and hosted domains needed for Google sign-in

- `community-posts/{postId}/comments`
  - reads are public
  - authenticated users can create comments only as themselves
  - comment authors can only soft-delete their own comments
  - admins can hard-delete comment documents if needed

### Role Matrix

- `visitor`
  - can read public community posts
  - cannot read support requests
  - cannot create user-owned or support-owned data

- `authenticated user`
  - can manage their own account document within allowed fields
  - can submit their own support request after email verification
  - can read their own support requests
  - cannot claim or resolve requests unless they are an approved specialist

- `approved specialist`
  - gets all authenticated-user abilities
  - can read the redacted support queue
  - can read full support-request details only after claiming a case
  - can claim open requests
  - can resolve only requests they personally claimed

- `admin`
  - gets privileged verification and moderation access
  - can review reports
  - can approve/reject specialists
  - can delete support requests and community posts when moderation requires it

### Firestore Indexes
File: `/firestore.indexes.json` — composite indexes:
- `users`: `accountType` + `verificationStatus` (Admin Dashboard)
- `support-requests`: `status` + `createdAt` (specialist open requests view)
- `support-requests`: `requesterId` + `createdAt` (journalist's own requests)
- `support-requests`: `claimedBy` + `status` (specialist resolved/feedback view)

### Cloud Functions
Source: `/functions/` — Firebase Functions v2 (Node 20), region `europe-west1`.

- **`setAdminClaim`** (HTTPS callable): grants or revokes the `admin` custom claim on a target user.
  - Caller must already have `request.auth.token.admin === true` and a verified email.
  - Writes `claimsUpdatedAt` (server timestamp) to the target's `users/{uid}` doc; the client checks this on next session hydrate and force-refreshes the ID token if it predates the claim change.
  - Invoked from the Admin Dashboard's *internal* tab.

Deploy: `cd functions && npm install && firebase deploy --only functions`.

---

## File Structure

```
safepress/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx           # Navigation header with auth UI
│   │   │   ├── Footer.jsx           # Footer component
│   │   │   └── MainLayout.jsx       # Layout wrapper (Outlet)
│   │   ├── ProtectedRoute.jsx       # Route guard for auth
│   │   ├── ProtectedAdminRoute.jsx  # Admin-only route guard
│   │   └── VerifiedBadge.jsx        # Specialist verification badge
│   │
│   ├── contexts/
│   │   └── AuthContext.jsx          # Authentication state & methods
│   │
│   ├── firebase/
│   │   └── config.js                # Firebase initialization (uses env vars)
│   │
│   ├── features/
│   │   ├── admin/
│   │   │   └── services/
│   │   │       └── adminService.js      # Reports + specialist verification Firestore logic
│   │   ├── community/
│   │   │   ├── components/             # AuthorLine, AuthorProfileModal, modals, UserAvatar
│   │   │   ├── hooks/                  # useCommunityPosts, useFollowedPosts, useNewPost, etc.
│   │   │   └── services/
│   │   │       └── communityService.js  # Posts, comments subcollection, reports
│   │   ├── ai/
│   │   │   └── services/
│   │   │       └── aiService.js         # Anthropic client, system prompt builder, stream handler
│   │   ├── dashboard/
│   │   │   └── hooks/
│   │   │       └── useDashboardData.js  # myRequests state, feedback, email verification handlers
│   │   ├── home/
│   │   │   ├── hooks/
│   │   │   │   └── useHomeData.js      # Field signal + journalist/specialist data loading
│   │   │   └── services/
│   │   │       ├── homeService.js      # Firebase data fetching for Home page
│   │   │       └── homePageModel.jsx   # Pure brief builders + instruments data (no Firebase)
│   │   ├── news/
│   │   │   ├── NewsSidebar.jsx         # External news sidebar component
│   │   │   └── useNewsArticles.js      # News articles hook
│   │   ├── notifications/
│   │   │   ├── hooks/
│   │   │   │   └── useNotifications.js # Notification count + panel state hook
│   │   │   └── services/
│   │   │       └── notificationService.js # Firestore notification queries
│   │   ├── setup/
│   │   │   └── data/
│   │   │       └── setupTasks.js       # Static task data, allTasks, TASKS_BY_ID, DEFAULT_TASK_ORDER
│   │   ├── support/
│   │   │   └── services/
│   │   │       └── supportService.js   # Support request workflow Firestore logic
│   │   └── users/
│   │       └── services/
│   │           └── userService.js      # Private user + public profile helpers
│   │
│   ├── utils/
│   │   └── userUtils.js             # Anonymous identity generation
│   │
│   ├── pages/
│   │   ├── Home.jsx                 # Landing page
│   │   ├── AIAdvisor.jsx            # AI Security Advisor (protected, /ai-advisor)
│   │   ├── Dashboard.jsx            # User dashboard (score + setup at a glance)
│   │   ├── SecurityScore.jsx        # Security quiz (31 questions, 6 categories)
│   │   ├── CrisisMode.jsx           # Emergency guidance (4 scenarios)
│   │   ├── SecureSetup.jsx          # Interactive 31-task checklist
│   │   ├── Resources.jsx            # OS guides, tools, AI security (3 tabs)
│   │   ├── Community.jsx            # Discussions, stories, Q&A (3 tabs)
│   │   ├── RequestSupport.jsx       # Crisis support request form
│   │   ├── AdminDashboard.jsx       # Specialist verification management
│   │   ├── Login.jsx                # Login page
│   │   ├── Signup.jsx               # Registration (journalist or specialist)
│   │   └── Settings.jsx             # User settings (protected)
│   │
│   ├── App.jsx                      # Route definitions
│   ├── main.jsx                     # App entry point
│   └── index.css                    # Global styles + Tailwind v4 @theme
│
├── public/                          # Static assets
├── .env                             # Firebase credentials (not in git)
├── .firebaserc                      # Firebase project link
├── firebase.json                    # Firebase CLI config
├── firestore.rules                  # Firestore security rules
├── firestore.indexes.json           # Firestore composite indexes
├── index.html                       # HTML template
├── package.json                     # Dependencies
├── vite.config.js                   # Vite configuration
└── TECHNICAL_DOCUMENTATION.md       # This file
```

---

## Authentication Flow

### 1. User Signup

```javascript
// User submits signup form (journalist or specialist)
AuthContext.signup(email, password, userData)
  ↓
// Create Firebase Auth user
createUserWithEmailAndPassword(auth, email, password)
  ↓
// Generate anonymous identity
const { username, avatarIcon } = generateUserIdentity()
  ↓
// Create Firestore user document
setDoc(doc(db, 'users', uid), {
  email, username, avatarIcon,
  createdAt: ISO string,
  securityScores: [],
  accountType: 'journalist' | 'specialist',
  // realName + verification fields only for specialists
})
  ↓
// Redirect to Dashboard
```

### 2. User Login

```javascript
// User submits login form
AuthContext.login(email, password)
  ↓
// Authenticate with Firebase
signInWithEmailAndPassword(auth, email, password)
  ↓
// onAuthStateChanged fires → fetch user doc from Firestore
getDoc(doc(db, 'users', uid))
  ↓
// Merge auth + Firestore data into context
setUser({ uid, email, metadata, ...firestoreData })
  ↓
// Redirect to Dashboard
```

### 3. Protected Routes

```javascript
// User navigates to protected route
ProtectedRoute component checks:
  - Is user authenticated? (user !== null)
  - YES → Render page
  - NO → Redirect to /login
```

### 4. Session Persistence

```javascript
// On app load (main.jsx)
AuthProvider wraps entire app
  ↓
// AuthContext listens to auth state
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Fetch user data from Firestore
    setUser(userData)
  } else {
    setUser(null)
  }
  setLoading(false)
})
  ↓
// User stays logged in across page refreshes
```

---

## Data Models

### User Document
**Collection**: `users`
**Document ID**: Firebase Auth UID

```javascript
{
  // Identity
  email: string,                    // User's email
  username: string,                 // Anonymous generated name (e.g., "SecureReporter_4829")
  avatarIcon: string,               // Emoji avatar
  createdAt: string (ISO 8601),     // Account creation timestamp
  accountType: 'journalist' | 'specialist',
  claimsUpdatedAt: Timestamp,       // Server timestamp; bumped by setAdminClaim to force token refresh

  // Security Assessment (single source of truth)
  securityScores: [                 // Array — new entry each time quiz is taken
    {
      score: number (0-100),        // Overall percentage score
      riskLevel: string,            // 'low' | 'medium' | 'high' | 'critical'
      completedAt: string,          // Quiz completion timestamp
      totalQuestions: number,
      answeredQuestions: number,
      categoryScores: {             // Breakdown by category
        password: { name, score, earnedPoints, maxPoints },
        device: { /* same */ },
        communication: { /* same */ },
        data: { /* same */ },
        physical: { /* same */ },
        risk: { /* same — work context category */ }
      }
    }
  ],

  // Secure Setup Progress
  setupProgress: {
    completedTasks: string[],       // Array of task IDs (31 total tasks)
    lastUpdated: string (ISO 8601)
  },

  // Specialist-only fields (when accountType === 'specialist')
  realName: string,                 // Required for specialists; admins use it to verify identity. Never set on journalist docs.
  verificationStatus: 'pending-email-verification' | 'pending' | 'approved' | 'rejected',
  verificationDate: string | null,
  verificationData: {
    expertise: string,
    credentials: string,
    linkedinUrl: string,
    organization: string,
    submittedAt: string (ISO 8601)
  },
  specialistProfile: {
    bio: string,
    expertiseAreas: string[],
    certifications: string[]
  }
}
```

### Community Post Document
**Collection**: `community-posts`
**Document ID**: Auto-generated (Firestore)

```javascript
{
  type: 'discussion' | 'story' | 'question',
  title: string,
  content: string,
  authorId: string,                 // User UID
  authorName: string,               // Anonymous username
  authorIcon: string,               // Avatar emoji
  authorType: 'journalist' | 'specialist',
  isVerified: boolean,              // Specialist verification badge
  category: string,                 // e.g., 'device-security', 'source-protection'
  createdAt: string (ISO 8601),
  likes: number,
  likedBy: string[],                // Array of UIDs (one like per user)
  commentCount: number,             // Cached count for feed display / unanswered filter
  acceptedCommentId: string | null, // Selected answer in Q&A mode
  resolved: boolean                 // Q&A posts only
}
```

### Community Comment Document
**Collection**: `community-posts/{postId}/comments`
**Document ID**: Client-generated string (stored in the document path)

```javascript
{
  authorId: string | null,          // Null after soft-delete
  authorName: string,
  authorIcon: string,
  authorType: 'journalist' | 'specialist',
  isVerified: boolean,
  authorVerificationStatus: 'pending' | 'approved' | 'rejected' | null,
  content: string,                  // Replaced with '[deleted]' when soft-deleted
  createdAt: string (ISO 8601),
  deleted: boolean
}
```

### Public Profile Document
**Collection**: `public-profiles`
**Document ID**: Same as Firebase Auth UID

```javascript
{
  username: string,
  avatarIcon: string,
  accountType: 'journalist' | 'specialist',
  verificationStatus: 'pending' | 'approved' | 'rejected' | null,
  createdAt: string | null,
  specialistProfile: {
    bio: string,
    expertiseAreas: string[],
    certifications: string[]
  } | null
}
```

### Support Request Document
**Collection**: `support-requests`
**Document ID**: Auto-generated (Firestore)

```javascript
{
  // Requester info
  requesterId: string,               // User UID (support request creation requires auth)
  requesterName: string,
  requesterEmail: string,
  requesterPhone: string | null,

  // Crisis details
  crisisType: 'hacked' | 'source' | 'doxxed' | 'phishing' | 'other',
  urgency: 'emergency' | 'urgent' | 'normal',
  description: string,
  contactMethod: 'email' | 'phone' | 'signal',

  // Status workflow: open → claimed → resolved
  status: 'open' | 'claimed' | 'resolved',
  claimedBy: string | null,          // Specialist UID
  claimedByName: string | null,      // Specialist anonymous username
  claimedAt: string | null,
  resolvedAt: string | null,

  // Feedback (set by requester after resolution)
  feedback: {
    rating: number (1-5),            // Star rating
    comment: string,                 // Optional text
    submittedAt: string (ISO 8601)
  } | null,

  createdAt: string (ISO 8601)
}
```

### Quiz Questions Structure

```javascript
{
  id: string,                      // Unique question ID (e.g., 'pass1')
  category: string,                // Category slug (e.g., 'password')
  categoryName: string,            // Display name
  icon: Component,                 // Lucide icon component
  question: string,                // Question text
  options: [
    {
      value: string,               // Option ID
      label: string,               // Display text
      points: number (0-10)        // Points awarded
    }
  ]
}
```

---

## Component Organization

### Page Components
Each page is a self-contained component with:
- Local state management
- Data fetching (if needed)
- User interactions
- Layout/styling

**Example: Dashboard.jsx**
```javascript
const Dashboard = () => {
  const { user } = useAuth();                    // Get current user
  const [userData, setUserData] = useState(null); // Local state

  useEffect(() => {
    // Fetch user data from Firestore
    fetchUserData();
  }, [user]);

  // Render personalized dashboard
  return (/* JSX */);
};
```

### Context Providers

**AuthContext** - Global authentication state
```javascript
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auth methods
  const signup = async (email, password, displayName) => { /* ... */ };
  const login = async (email, password) => { /* ... */ };
  const logout = async () => { /* ... */ };

  // Listen to auth state changes
  useEffect(() => {
    onAuthStateChanged(auth, handleAuthStateChange);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access
export const useAuth = () => useContext(AuthContext);
```

### Protected Routes

```javascript
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Usage in App.jsx
<Route
  path="dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

---

## Key Features

### 1. Security Assessment
**File**: `src/pages/SecurityScore.jsx`

- **31 questions** across 6 categories
- **Categories**: Password, Device, Communication, Data, Physical, Risk Profile
- **Scoring**: 0-100% based on weighted points
- **Risk Level**: Calculated from score + work context (low/medium/high/critical)
- **Auto-save**: Results saved to Firestore when user logged in
- **Guest mode**: Can take quiz without login (no save)
- **Welcome screen**: First-time users see category preview; returning users see last score with category bars and "check in" prompt

**Implementation**:
```javascript
const calculateScore = () => {
  const totalPossiblePoints = questions.reduce((sum, q) => {
    const maxPoints = Math.max(...q.options.map(opt => opt.points));
    return sum + maxPoints;
  }, 0);

  const earnedPoints = Object.values(answers).reduce(
    (sum, answer) => sum + answer.points,
    0
  );

  return Math.round((earnedPoints / totalPossiblePoints) * 100);
};
```

### 2. Dashboard (Everything at a Glance)
**File**: `src/pages/Dashboard.jsx`

**Layout**:
- Centered "hello, username" header with avatar icon box
- Two side-by-side metric cards:
  - **Security Score**: Last score with mini category progress bars
  - **Secure Setup**: Progress bar showing X/31 completed tasks
- **"Up Next" section**: Smart recommendations sorted by weakest quiz categories, prompts for untaken quiz/unstarted setup, "lessons — coming soon" placeholder
- **"My Support Requests"** (journalists): Track submitted requests with status (open/claimed/resolved), rate specialist after resolution with 1-5 stars + comment
- **"Support Requests"** (verified specialists): View and claim open requests, expand for full details + contact info, mark as resolved
- **"Your Feedback"** (verified specialists): Average star rating, recent feedback from resolved requests
- Explore grid: resources, community, get help, crisis mode

### 3. Crisis Mode
**File**: `src/pages/CrisisMode.jsx`

**Features**:
- 4 emergency scenarios (hacked, source exposed, doxxed, phishing)
- Immediate action checklists
- Emergency contact information
- Security protocols
- Link to specialist support request

### 4. User Settings
**File**: `src/pages/Settings.jsx`

**Features**:
- Profile information display
- Password change functionality
- Account deletion (with confirmation)
- Tabbed interface (Profile, Security, Danger Zone)

---

## Development Guide

### Prerequisites
```bash
Node.js 18+
npm or yarn
Firebase account
```

### Installation
```bash
# Clone repository
git clone <repository-url>
cd safepress

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup
Create a `.env` file in the project root with your Firebase credentials (see Firebase Setup section above). The `.env` file is gitignored.

### Building for Production
```bash
npm run build
# Output: dist/ folder
```

### Code Organization Best Practices

1. **Component Structure**:
   - One component per file
   - Use functional components with hooks
   - Keep components under 400 lines (split if larger)

2. **State Management**:
   - Local state for UI (`useState`)
   - Context for global state (AuthContext)
   - Firestore for persistent data

3. **Naming Conventions**:
   - Components: PascalCase (`Dashboard.jsx`)
   - Functions: camelCase (`calculateScore`)
   - Constants: UPPER_SNAKE_CASE (`API_KEY`)
   - CSS classes: lowercase-kebab-case

4. **File Organization**:
   - `/components` - Reusable UI components
   - `/pages` - Route-level components
   - `/contexts` - React Context providers
   - `/firebase` - Firebase configuration

### Common Tasks

**Adding a new page**:
```javascript
// 1. Create page component
// src/pages/NewPage.jsx
const NewPage = () => {
  return <div>New Page</div>;
};
export default NewPage;

// 2. Add route in App.jsx
import NewPage from './pages/NewPage';

<Route path="new-page" element={<NewPage />} />
```

**Protecting a route**:
```javascript
<Route
  path="new-page"
  element={
    <ProtectedRoute>
      <NewPage />
    </ProtectedRoute>
  }
/>
```

**Accessing user data**:
```javascript
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not logged in</div>;

  return <div>Hello {user.username}!</div>;
};
```

**Saving data to Firestore**:
```javascript
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const saveData = async (userId, data) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, data);
};
```

**Fetching data from Firestore**:
```javascript
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const fetchData = async (userId) => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (userDoc.exists()) {
    return userDoc.data();
  }
  return null;
};
```

---

## Future Enhancements

### Planned Features
1. **OS-specific guides** (Windows, macOS, Linux, iOS, Android)
2. **Incident response playbooks** (step-by-step crisis guides)
3. **AI security content** (deepfakes, disinformation)
4. **Progress tracking** (guide completion badges)
5. **Export reports** (PDF security reports)
6. **Two-factor authentication** (enhanced security)
7. **Email notifications** (score reminders, security alerts)

### Scalability Considerations
- Firestore scales automatically
- Consider Cloud Functions for:
  - Email notifications
  - Scheduled tasks
  - Complex data processing
- Use Firebase Storage for:
  - User-uploaded documents
  - Resource PDFs

---

## Troubleshooting

### Common Issues

**Firebase authentication errors**:
```javascript
// Error: auth/email-already-in-use
// Solution: User already has an account, redirect to login

// Error: auth/weak-password
// Solution: Password must be at least 6 characters

// Error: auth/wrong-password
// Solution: Incorrect password, prompt user to try again
```

**Firestore permission errors**:
```javascript
// Error: Missing or insufficient permissions
// Solution: Check security rules, ensure user is authenticated
```

**Build errors**:
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## Maintenance

### Regular Tasks
1. **Update dependencies**: `npm update`
2. **Review Firebase usage**: Check Firestore/Auth quotas
3. **Monitor errors**: Use Firebase Crashlytics (optional)
4. **Backup data**: Export Firestore data periodically

### Security
1. Keep Firebase SDK updated
2. Review security rules regularly
3. Rotate API keys if compromised
4. Monitor authentication logs

---

## Recent Updates (February 2026)

### Phase 1: Anonymous Identity System
**Privacy-First User Experience**
- Random username generation (e.g., "SecureReporter_4829")
- 30 cute avatar icons (animals, nature emojis)
- Real names kept private, only used for account recovery
- Anonymous identity displayed throughout UI

**Implementation**:
```javascript
// src/utils/userUtils.js
export const generateUserIdentity = () => {
  return {
    username: generateUsername(),  // Random prefix + 4-digit number
    avatarIcon: getRandomAvatarIcon()  // 30 emoji options
  };
};
```

**Updated Components**:
- Header: Shows `user.username` + `user.avatarIcon`
- Dashboard: Welcome message with anonymous identity
- Settings: Displays public (username/icon) vs private (realName) data

### Phase 2-3: Account Types & Verification System
**Two Account Types**:
1. **Journalist** (default) - Anonymous, full access to resources
2. **Security Specialist** - Requires verification, can provide expert guidance

**Specialist Verification Workflow**:
1. Sign up as specialist → Status: `pending`
2. Submit credentials (expertise, org, LinkedIn, etc.)
3. Admin reviews in Admin Dashboard
4. Status changes to `approved` or `rejected`
5. Approved specialists get verified badge ✓

**New Files**:
- `src/components/ProtectedAdminRoute.jsx` - Admin-only route protection
- `src/pages/AdminDashboard.jsx` - Verification management
- `src/components/VerifiedBadge.jsx` - Verified specialist badge

**Data Model**:
```javascript
// Specialist user fields
{
  accountType: 'specialist',
  verificationStatus: 'pending' | 'approved' | 'rejected',
  verificationData: {
    expertise: string,
    credentials: string,
    linkedinUrl: string,
    organization: string,
    submittedAt: ISO date
  },
  verificationDate: ISO date | null,
  specialistProfile: {
    bio: string,
    expertiseAreas: array,
    certifications: array
  }
}
```

**Admin System**:
- Hardcoded admin email list in `ProtectedAdminRoute.jsx`
- Admin dashboard at `/admin` route
- View all pending verifications
- Approve/Reject with one click
- Real-time Firestore updates

### Phase 4: OS Security Guides (Resources Page)
**Comprehensive Hardening Guides**

**New Resources Page Structure**:
- Tabbed navigation (OS Guides, AI Security, Tools)
- 5 operating systems with step-by-step guides:
  - **Windows** (7 steps): BitLocker, Defender, Firewall, etc.
  - **macOS** (7 steps): FileVault, Firewall, Gatekeeper, etc.
  - **Linux** (7 steps): LUKS, UFW, fail2ban, SSH hardening
  - **iOS** (7 steps): Face ID, Advanced Data Protection, etc.
  - **Android** (7 steps): Device encryption, permissions, etc.

**Features**:
- Accordion rows — click any step to expand an animated OS UI mockup, click again to collapse
- Color-coded OS badges
- Exact menu paths for each step
- `src/features/resources/OSMockup.jsx` — self-contained mockup component

**OSMockup component** (`src/features/resources/OSMockup.jsx`):
- Props: `{ osId: 'windows' | 'macos' | 'linux' | 'ios' | 'android', step: { title, details } }`
- Parses `details` by splitting on `→` to extract the navigation path
- Renders OS-appropriate chrome + content for each platform:
  - **Windows 11**: Fluent sidebar + content panel, `#0078D4` accent, Segoe UI
  - **macOS**: Traffic-light title bar + sidebar + main pane, `#007AFF` accent, -apple-system
  - **Linux**: Terminal frame (dark bg, green/amber text), shows command being typed across 3 steps
  - **iOS**: Grouped table view with status bar + nav bar, `#007AFF` accent, -apple-system
  - **Android**: Material top bar + list rows, `#1A73E8` accent, Roboto
- Framer Motion animates through each nav segment (one per 1.2 s), holds on final state
- Final step renders toggle (ON/OFF) or checkmark depending on action verb detection
- PathProgress breadcrumb strip below frame shows visited vs upcoming segments
- Replay button resets and re-runs the animation

**Implementation**:
```javascript
// Each OS guide includes:
{
  id: 'windows',
  name: 'windows',
  icon: Monitor,
  color: 'from-blue-500 to-blue-600',
  description: 'harden your windows system',
  steps: [
    {
      title: 'enable windows defender',
      details: 'Settings → Update & Security → ...',
      completed: false
    },
    // ... 6 more steps
  ]
}
```

### Phase 5: Recommended Tools (Resources Page)
**Curated Security Tools for Journalists**

**6 Tool Categories** with 20+ security tools based on OpSec cheat sheet:
1. **Secure Messaging** - Signal, Session, Element/Matrix
2. **Offline & Blackout Comms** - Bridgefy, Briar, Berty (p2p mesh networking)
3. **Secure Email & File Transfer** - ProtonMail, Tutanota, SecureDrop
4. **Browser Privacy** - Tor Browser, uBlock Origin, NoScript
5. **Encryption & Containers** - VeraCrypt, Cryptomator, Tails OS, BitLocker, FileVault
6. **Password & 2FA** - Bitwarden, 1Password, Google/Microsoft Authenticator, YubiKey

**Features**:
- Priority badge system (essential, recommended, high-threat, source-protection, emergency, advanced, experimental)
- Platform compatibility tags (iOS, Android, Windows, macOS, Linux, Web)
- External links to official tool websites
- Color-coded category headers with gradient backgrounds
- Security best practices footer

**Priority Levels Explained**:
- **Essential**: Must-have tools for all journalists (Signal, Bitwarden, Tor)
- **Recommended**: Highly useful for most journalists
- **High-Threat**: Critical for journalists in dangerous environments
- **Source-Protection**: Tools specifically for protecting confidential sources (SecureDrop)
- **Emergency**: Offline communication during network blackouts (Bridgefy)
- **Advanced**: For tech-savvy users (NoScript, Tails OS)
- **Experimental**: Emerging tools, use with caution (Berty)

**Implementation**:
```javascript
// Tool data structure
{
  name: 'Signal',
  description: 'primary secure messaging app - end-to-end encrypted',
  url: 'https://signal.org',
  priority: 'essential',
  platforms: ['iOS', 'Android', 'Windows', 'macOS', 'Linux']
}
```

### Phase 6: AI Security (Resources Page)
**Safe AI Usage for Journalists**

**4 AI Security Categories**:

1. **Never Share with AI Chatbots** (Critical Warning Section)
   - Source identities (real names, contact info)
   - Unpublished findings (drafts, investigation notes)
   - Personal Identifiable Information (PII)
   - Location data (coordinates, safe houses, movement patterns)
   - Sensitive media (photos/videos that could identify sources)
   - Confidential audio (interview recordings with identifiable voices)

2. **AI Threats to Journalists**
   - Deepfake videos (discredit journalists, fabricate statements)
   - Voice cloning (impersonate journalists, extract info from sources)
   - Face theft / identity theft (AI scraping social media photos)
   - Automated disinformation (bot armies, coordinated harassment)
   - De-anonymization (AI correlating metadata, writing style)
   - Content surveillance (government AI scanning journalist content)

3. **Privacy-Respecting AI Tools**
   - **Ollama** - Run AI locally, no data leaves device (fully local)
   - **LM Studio** - Local AI interface, offline capable (fully local)
   - **DuckDuckGo AI Chat** - No login, conversations not saved (anonymous)
   - **HuggingChat** - Open source models, transparent data handling
   - **Claude (with caveats)** - Commercial but data not used for training by default

4. **Protection & Detection Tools**
   - **Fawkes** - Image cloaking against facial recognition
   - **Lowkey** - Anti-facial recognition glasses (physical device)
   - **Hive Moderation** - Deepfake detection API
   - **Reality Defender** - Deepfake detection for audio/video/images
   - **Content Credentials (C2PA)** - Media watermarking for authenticity

**Key Features**:
- Critical warning banner: "AI is NOT secure by default"
- Severity indicators (critical, high, medium) with color-coded borders
- Privacy level badges (fully local, anonymous, transparent, commercial)
- Use case badges (face protection, deepfake detection, authenticity)
- AI security best practices footer

**Best Practices Included**:
- Use local AI tools (Ollama, LM Studio) for sensitive work
- Never paste source names or unreleased findings into commercial AI
- Protect your face: use Fawkes to cloak social media photos
- Verify media authenticity with deepfake detection tools
- Watermark original content using C2PA standards
- Assume all AI conversations are logged unless proven otherwise

**Implementation**:
```javascript
// AI security data structure
{
  id: 'never-share',
  name: 'never share with AI chatbots',
  icon: ShieldAlert,
  color: 'from-crimson-500 to-crimson-600',
  items: [
    {
      title: 'source identities',
      description: 'real names, contact info...',
      icon: User,
      severity: 'critical'
    },
    // ... more items
  ]
}
```

### Phase 7: Enhanced Security Score Quiz with Risk Profiling
**Intelligent Personalization for Resources Page**

**New Risk Profile Category** (6 questions added to quiz):
1. **Work Sensitivity**: General reporting → Investigative → Conflict zones
2. **Source Protection**: How often they work with confidential sources
3. **Operating Environment**: Press freedom vs authoritarian regimes
4. **Public Visibility**: TV/bylines vs anonymous work
5. **Threat Experience**: Online harassment → Physical threats
6. **Story Types**: General news → Corruption/national security

**Risk Level Calculation**:
- **Low Risk**: 80-100% security score + safe work environment
- **Medium Risk**: 60-79% score OR moderate work risks
- **High Risk**: 40-59% score OR dangerous work environment
- **Critical Risk**: <40% score OR hostile environment + poor security

**User Profile Updates**:
```javascript
// Saved to Firestore after quiz completion
{
  riskLevel: 'low' | 'medium' | 'high' | 'critical',
  lastQuizDate: ISO date,
  securityScores: [{
    score: 85,
    riskLevel: 'medium',
    categoryScores: {
      risk: { percentage: 60, ... },
      password: { percentage: 90, ... },
      // ... other categories
    }
  }]
}
```

**Results Page Enhancements**:
- Risk profile card with personalized explanation
- "Resources page will show tools for your [risk level]" messaging
- 31 total questions (was 25), 6 categories (was 5)

**Integration with Resources Page**: ✅ Completed in Phase 8

**Implementation**:
```javascript
// src/pages/SecurityScore.jsx
const calculateRiskLevel = () => {
  const overallScore = calculateScore();
  const workContextScore = categoryScores.risk?.percentage;

  // Weight both security practices AND work environment
  if (workContextScore <= 40) {
    return overallScore >= 70 ? 'high' : 'critical';
  }
  // ... more logic
};
```

### Phase 8: Smart Resource Filtering (Personalized Tool Recommendations)
**Solves Information Overload - Zero Friction Personalization**

**Problem Solved**: TV journalists were overwhelmed seeing Tails OS and SecureDrop. Investigative journalists in hostile environments missed critical tools buried in the list.

**Risk-Based Tool Filtering**:
- Each of 25+ tools tagged with `minRiskLevel: 'low' | 'medium' | 'high' | 'critical'`
- Tools auto-filtered based on user's Security Score quiz results
- Users retain control via toggle, but default is personalized

**Tool Visibility by Risk Level**:
```
Low-risk (8-12 tools):
  ✓ Signal, Bitwarden, ProtonMail, 2FA apps
  ✓ Tor Browser, uBlock Origin, Cryptomator
  ✓ BitLocker/FileVault, 1Password

Medium-risk (15-18 tools) adds:
  + Element/Matrix, Tutanota, NoScript
  + VeraCrypt, advanced encryption

High-risk (20-24 tools) adds:
  + Session, Briar, SecureDrop, Bridgefy
  + Tails OS, Fawkes, YubiKey

Critical-risk (all 25+ tools) adds:
  + Lowkey (anti-surveillance glasses)
  + Berty (experimental P2P)
  + All emergency offline comms
```

**UI Features**:
1. **View Mode Toggle** (top of Tools tab):
   ```
   ┌────────────────────────────────────────────────┐
   │ 🔍 Showing tools for medium-risk journalists   │
   │    Personalized based on security assessment   │
   │                          [View all tools] ←btn │
   └────────────────────────────────────────────────┘
   ```

2. **Recommended Badges**:
   - Tools at/near user's level: "RECOMMENDED" badge
   - Guides users to priority tools without overwhelming

3. **Hidden Tool Indicator**:
   - Category headers show: "+3 more in 'all tools'"
   - Transparent about what's hidden, easy to access

4. **Anonymous Users**:
   - See all tools (no personalization data)
   - Prompt: "Take security assessment for personalized recommendations"

**Implementation**:
```javascript
// src/pages/Resources.jsx
const shouldShowTool = (tool) => {
  if (viewMode === 'all') return true;

  const riskHierarchy = { low: 1, medium: 2, high: 3, critical: 4 };
  const userLevel = riskHierarchy[userRiskLevel] || 2;
  const toolMinLevel = riskHierarchy[tool.minRiskLevel] || 1;

  return userLevel >= toolMinLevel; // Show if user's level >= tool's min requirement
};

// Tool examples:
{
  name: 'Signal',
  priority: 'essential',
  minRiskLevel: 'low' // Everyone sees this
},
{
  name: 'Tails OS',
  priority: 'high-threat',
  minRiskLevel: 'high' // Only high/critical risk see this
}
```

**User Experience Flow**:
1. User takes 31-question Security Score quiz
2. Gets risk level: e.g., "medium-risk environment"
3. Visits Resources → Sees personalized view (15-18 tools, not 25+)
4. "Recommended" badges highlight priority tools
5. Can toggle "view all tools" anytime for exploration
6. Changes saved to user profile, persistent across sessions

**Impact**:
- ✅ Low-risk journalists: See 8-12 essential tools (not overwhelming)
- ✅ High-risk journalists: See all 25+ tools (comprehensive)
- ✅ Zero additional questions (uses existing quiz data)
- ✅ Frictionless (automatic, but user can override)
- ✅ Scalable (add more tools, auto-filter by risk)

### Bug Fixes & UX Improvements
**Login/Signup Flow**:
- Fixed "seeing login page after login" bug
- Added loading states during authentication
- Auto-redirect for already-logged-in users
- Smooth transitions without flickering

**ProtectedRoute Enhancement**:
- Added loading state check before redirect
- Prevents premature redirects while user data loads
- Shows "loading..." message during auth check

---

## Credits

Built with Claude Code (AI-assisted development)
Designed for journalist digital safety education
Master's dissertation project

**Technology Partners**:
- React (Meta)
- Firebase (Google)
- Vite (Evan You)
- Tailwind CSS (Tailwind Labs)
- Framer Motion (Framer)

---

## License

Educational project - Master's dissertation
Not for commercial use without permission

### Phase 9: Interactive Secure Setup Checklist
**Comprehensive Security Hardening with Progress Tracking**

**Problem Solved**: The original Secure Setup page was non-functional. Users needed actionable, trackable security implementation steps.

**Implementation**: Complete rebuild with 31 security tasks across 5 categories.

**Features**:
1. **Personalized Priority Section**:
   - Shows weak categories from Security Score quiz at top
   - Clickable buttons to jump directly to relevant sections
   - Real-time sync with quiz results

2. **Interactive Task Checklist**:
   - 31 total tasks organized by category:
     - Password Security (6 tasks)
     - Device Security (7 tasks)
     - Data Protection (6 tasks)
     - Communication Security (6 tasks)
     - Physical Security (6 tasks)

3. **Each Task Includes**:
   - Checkbox (Firestore-synced, login required)
   - Title with difficulty badge (easy/medium/hard)
   - Priority label (critical/high/medium)
   - "Why" explanation (security rationale)
   - "How" instructions (step-by-step guide)
   - OS compatibility tags (Windows, macOS, Linux, iOS, Android, all)
   - Links to Resources page for related tools

4. **Progress Tracking**:
   - Overall completion percentage at top
   - Per-category progress bars
   - Saved to Firestore: `setupProgress.completedTasks` array
   - Persistent across sessions

5. **Expandable Categories**:
   - Click category header to expand/collapse
   - Visual progress indicator shows completion
   - Color-coded icons for each category

**Data Structure**:
```javascript
// Firestore: users/{uid}
{
  setupProgress: {
    completedTasks: ['pass-manager', 'device-encryption', ...],
    lastUpdated: '2026-02-12T...'
  }
}

// Task structure
{
  id: 'pass-manager',
  title: 'install a password manager',
  why: 'prevents password reuse and makes it easy to use strong passwords',
  how: 'download Bitwarden (free, open-source) or 1Password (premium)',
  link: '/resources',
  difficulty: 'easy',
  os: ['all'],
  priority: 'critical'
}
```

**Implementation**:
```javascript
// src/pages/SecureSetup.jsx
const setupTasks = {
  password: { name: 'password security', icon: Lock, tasks: [...] },
  device: { name: 'device security', icon: Smartphone, tasks: [...] },
  data: { name: 'data protection', icon: Database, tasks: [...] },
  communication: { name: 'communication security', icon: MessageSquare, tasks: [...] },
  physical: { name: 'physical security', icon: MapPin, tasks: [...] }
};

const toggleTask = async (taskId) => {
  if (!user) return; // Requires login

  const newCompleted = new Set(completedTasks);
  if (newCompleted.has(taskId)) {
    newCompleted.delete(taskId);
  } else {
    newCompleted.add(taskId);
  }
  setCompletedTasks(newCompleted);

  // Save to Firestore
  await updateDoc(doc(db, 'users', user.uid), {
    'setupProgress.completedTasks': Array.from(newCompleted),
    'setupProgress.lastUpdated': new Date().toISOString()
  });
};
```

**User Experience Flow**:
1. User completes Security Score quiz → Gets personalized dashboard
2. Dashboard shows "Secure your setup" recommendation
3. Navigates to /secure-setup
4. Sees priority categories highlighted based on quiz results
5. Expands categories and checks off completed tasks
6. Progress auto-saves to Firestore (login required)
7. Returns later → Progress persists, picks up where left off

**Integration with Other Features**:
- **Dashboard**: "Secure your setup" quick action links here
- **Security Score Results**: "start securing your setup" CTA links here
- **Resources Page**: Task descriptions link to specific tools/guides

**Example Tasks by Category**:
- **Password**: Install password manager, enable 2FA, audit passwords
- **Device**: Enable BitLocker/FileVault, antivirus, auto-updates, screen locks
- **Data**: Set up encrypted backups, encrypt USB drives, secure delete tools
- **Communication**: Install Signal, set up ProtonMail, use VPN, enable disappearing messages
- **Physical**: Cover webcams, privacy screens, disable location services, secure storage

**Impact**:
- ✅ Transforms Secure Setup from static dummy page to actionable guide
- ✅ Users can track progress toward better security
- ✅ Clear, jargon-free instructions for non-technical journalists
- ✅ Difficulty badges help users prioritize (start with "easy" tasks)
- ✅ OS tags ensure cross-platform relevance

---

### Phase 10: Community Hub
**Full-Featured Community with Discussions, Stories & Q&A**

**File**: `src/pages/Community.jsx`

**3-Tab Layout**:
1. **Discussions** — General security topic threads
2. **Anonymous Stories** — Journalists share security incidents (author always shown as "anonymous journalist")
3. **Q&A** — Ask security questions, get specialist answers; can be marked as resolved

**Features**:
- Public browsing (anyone can read)
- Posting/commenting requires login
- Like system (one per user, stored in `likedBy` array)
- Category filtering (device security, source protection, communication, data, physical safety, legal, general)
- Specialist verified badge next to names
- Inline new post form with type/category selection
- Comment thread on each post

**Firestore**: `community-posts` collection (see Data Models section)

### Phase 11: UI Consistency Pass
**Standardized Page Headers Across All Pages**

Established a consistent header pattern for all content pages:
```jsx
<motion.div
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
  className="text-center mb-12"
>
  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl
    bg-{color}/10 border border-{color}/20 mb-5">
    <Icon className="w-7 h-7 text-{color}" />
  </div>
  <h1 className="text-4xl md:text-5xl font-display font-bold mb-3 lowercase">title</h1>
  <p className="text-base text-gray-500 lowercase max-w-md mx-auto leading-relaxed"
    style={{ letterSpacing: '0.03em' }}>description</p>
</motion.div>
```

**Pages updated**: Resources, CrisisMode, SecurityScore, RequestSupport, Community, SecureSetup

**Also standardized**:
- Segmented control tabs (Resources, Community)
- Animation easing: `[0.22, 1, 0.36, 1]` everywhere
- Icon containers: `w-14 h-14 rounded-2xl`
- Color per page: midnight (default), crimson (crisis), teal (setup), purple (community)

### Phase 12: Dashboard Redesign
**Everything at a Glance**

Rewrote Dashboard from a generic layout to a focused overview:
- Two side-by-side metric cards (Security Score + Secure Setup progress)
- "Up Next" recommendations sorted by weakest quiz categories
- Lessons placeholder for future feature
- Compact quick links row

### Phase 13: SecurityScore Welcome Redesign
**Mindfulness Check-In for Returning Users**

- **First-time users**: Minimal category icon grid, clean CTA, no text walls
- **Returning users**: "check in" title, large last score display, mini category progress bars, days since last check-in

### Phase 14: Schema Cleanup & Security Rules
**Database Hardening**

**Removed dead/redundant fields**:
- `completedGuides` — written on signup, never read
- `lastQuizDate` — redundant with `securityScores[].completedAt`
- Root-level `riskLevel` — redundant with `securityScores[].riskLevel`

**Resources.jsx** updated to derive risk level from latest score entry.

**Firestore security rules deployed** (see Firebase Setup section):
- Users: owner + admin access only
- Community posts: public read, authenticated create, admin delete
- Composite index for admin verification queries

**Backup files deleted**: `.bak2`, `.bak3`, `.backup`

### Phase 15: Dashboard Polish
**Hello Greeting, Bigger Fonts, Redesigned Quick Links**

- Centered "hello, {username}" header matching standard page pattern (`text-4xl md:text-5xl`)
- All body text bumped from `text-sm`/`text-[10px]` to `text-base`/`text-xs`
- Quick links redesigned from tiny pills to a centered 4-card grid with icons, labels, and descriptions
- Added "get help" (contact specialist) card linking to `/request-support`
- Removed settings from quick links (already in navbar)

### Phase 16: Support Request Workflow
**End-to-End Journalist ↔ Specialist Support System**

**New Firestore collection**: `support-requests` (see Data Models section)

**RequestSupport.jsx** — Updated:
- Saves to Firestore instead of `console.log`
- Pre-fills name/email for logged-in users
- Shows success confirmation screen with request summary after submission
- Disabled button state while submitting

**Dashboard — Journalist view** ("my support requests"):
- Shows all submitted requests with real-time status tracking
- Status icons: amber clock (open), blue user (claimed), green check (resolved)
- Expandable details with status badge, urgency, specialist name
- **Rating system**: After resolution, journalist rates specialist (1-5 stars + optional comment)
- Submitted feedback shown as read-only star display

**Dashboard — Specialist view** ("support requests"):
- Verified specialists see all open/claimed requests
- Urgency-coded cards (red for emergency, amber for urgent)
- Expandable details: full description, contact email, phone, preferred method
- **Claim** button assigns request to specialist
- **Resolve** button marks as complete

**Dashboard — Specialist view** ("your feedback"):
- Average star rating with count
- Up to 3 recent feedback entries with stars, comments, and crisis type

**Security rules**: Authenticated users can create/read/update. Admin-only delete.
**Composite indexes**: 4 indexes for support-requests queries (status+createdAt, requesterId+createdAt, claimedBy+status).

---

### Phase 17: UI Modernization — Header Restructure, Wider Layouts & Gamified Dashboard
**Visual Polish, Better Use of Screen Space, Engaging Progress Visualization**

#### 17.1 Header Restructure (`src/components/layout/Header.jsx`)

**Problem Solved**: Username/logout were competing visually with the crisis toggle, and the logo felt unbalanced when sharing the top bar with auth controls.

**New structure**:
- **Logo** is now centered and standalone in the top bar (`justify-center`, no auth elements)
- **Crisis toggle + auth** are extracted into a single `fixed top-4 right-4 z-[60]` cluster using `flex flex-col items-end gap-1.5`
- Auth row sits directly below the crisis toggle (username → `·` → log out)
- Overlap between crisis toggle and auth controls is now geometrically impossible

```jsx
// Fixed top-right cluster
<div className="fixed top-4 right-4 z-[60] flex flex-col items-end gap-1.5">
  {/* Crisis row */}
  <div className="flex items-center gap-2">
    <span>Crisis / Crisis Active</span>
    <button role="switch" ...toggle... />
  </div>
  {/* Auth row — directly below */}
  {user ? (
    <div className="flex items-center gap-2">
      <Link to="/settings">{user.avatarIcon} {user.username}</Link>
      <span>·</span>
      <button onClick={handleLogout}><LogOut /> log out</button>
    </div>
  ) : (
    <div><Link to="/login">log in</Link><Link to="/signup">sign up</Link></div>
  )}
</div>

// Top bar: logo alone, centered
<div className="py-4 flex items-center justify-center border-b border-white/[0.04]">
  <Link to="/">...safepress logo...</Link>
</div>
```

#### 17.2 Page Widening

All main content pages changed from narrow containers to `max-w-7xl` (1280px) to eliminate excessive dead space on wider displays:

| Page | Before | After |
|------|--------|-------|
| Dashboard | `max-w-6xl` | `max-w-7xl` |
| Resources | `max-w-5xl` | `max-w-7xl` |
| SecureSetup | `max-w-5xl` | `max-w-7xl` |
| Community (feed) | `max-w-6xl` | `max-w-7xl` |
| Community (post detail) | `max-w-2xl` | `max-w-7xl` |

#### 17.3 Gamified Dashboard Redesign (`src/pages/Dashboard.jsx`)

**Problem Solved**: Dashboard looked "outdated" — generic greeting, flat metric cards, no sense of progression.

**New helpers defined outside component**:
```javascript
// Animated SVG progress ring
const ProgressRing = ({ pct, size = 80, stroke = 6, color = '#6366F1' }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 100) / 100);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle ... stroke="rgba(255,255,255,0.05)" />        {/* track */}
      <motion.circle ... animate={{ strokeDashoffset: offset }} />  {/* fill */}
    </svg>
  );
};

// Security rank label + color for a given overall %
const getLevelInfo = (pct) => {
  if (pct >= 100) return { label: 'security hardened',  color: '#84CC16' };
  if (pct >= 75)  return { label: 'security conscious', color: '#6366F1' };
  if (pct >= 50)  return { label: 'security aware',     color: '#2DD4BF' };
  if (pct >= 25)  return { label: 'building habits',    color: '#FBBF24' };
  return                 { label: 'getting started',    color: '#6B7280' };
};

// Ring color helpers (hex — can't use Tailwind JIT for dynamic hex)
const SCORE_HEX = (score) => score >= 80 ? '#84CC16' : score >= 60 ? '#F59E0B' : '#EF4444';
const SETUP_HEX = (pct)   => pct >= 80 ? '#84CC16' : pct >= 40 ? '#F59E0B' : pct > 0 ? '#EF4444' : '#374151';
```

**New layout structure**:
1. **Greeting row** (left-aligned): avatar icon box + "hello, username" + rank label in level color
2. **3-col stat cards**: Security Score (ring + number), Secure Setup (ring + %), Priority action
3. **2-col section**: "Up Next" quest-style hover list (left) + "Explore" 2×2 colored icon cards (right)
4. **My Requests / Support Requests** wrapped in glass card (unchanged logic)

**Note**: Inline styles used for hex color values because Tailwind JIT cannot safely purge arbitrary dynamic color strings.

#### 17.4 Community Post Detail — Reddit-Style 2-Column Layout (`src/pages/Community.jsx`)

**Problem Solved**: Post detail view was a single, near-empty column — the right side of the screen was wasted.

**New structure**:
```jsx
<div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8">
  {/* Left: full post + comments (unchanged) */}
  <div>...</div>

  {/* Right sidebar */}
  <div className="hidden lg:block space-y-4">
    {/* Search bar — submits back to feed with query */}
    <form onSubmit={(e) => { e.preventDefault(); setSearchQuery(sidebarSearch); setSelectedPost(null); }}>
      <input type="text" value={sidebarSearch} onChange={e => setSidebarSearch(e.target.value)}
        placeholder="search discussions..." />
    </form>
    {/* Latest Threats sidebar (already used in main feed) */}
    <NewsSidebar />
  </div>
</div>
```

**Bug fixed**: `NewsSidebar` was defined with `const` after the `if (selectedPost) { return ...; }` early return block, making it inaccessible when `selectedPost` was truthy. Fix: moved `NewsSidebar` definition to before the early return. Added `sidebarSearch` state (separate from `searchQuery`) to avoid affecting the feed until form submit.

---

### Phase 18: Role Clarity, Community Uplift & Source Protection Playbook
**Tightening the journalist/specialist UX, expanding community moderation, and adding the investigative-journalism narrative feature**

Phase 18 is a three-stream update driven by three gaps:
1. Role confusion between journalist and security specialist accounts (pending/rejected specialists were silently redirected; verified specialists saw a hybrid dashboard; Community lacked consistent role labels).
2. Community lacked self-service moderation (no delete for own content, no true anonymous stories, no Q&A accepted-answer concept, no sort options, no unified journalist profile, no reporting path).
3. The app had no content that spoke directly to investigative journalism's core operational concern: source protection.

#### 18.1 Role Clarity

**Signup flow (`src/pages/Signup.jsx`)**
- Role selector is now rendered *above* the tagline so the copy reacts immediately to the user's choice.
- Tagline is dynamic: "join thousands of journalists staying safe" for journalist, "help journalists protect themselves" for specialist.

**AuthContext whitelist (`src/contexts/AuthContext.jsx`)**
- Signup path now validates `accountType` against a whitelist, preventing `undefined` / junk values from the Google OAuth path:
  ```js
  const accountType = ['journalist', 'specialist'].includes(userData?.accountType) ? userData.accountType : 'journalist';
  ```

**Dashboard (`src/pages/Dashboard.jsx`)**
- Verified specialists are auto-redirected to `/specialist-dashboard` (no hybrid view).
- Pending specialists see a prominent amber banner (Clock icon) replacing the previous tiny amber chip.
- Rejected specialists see a crimson banner showing `user.verificationRejectionReason` and a "review & reapply" CTA.

**Specialist Dashboard (`src/pages/SpecialistDashboard.jsx`)**
- Removed silent `navigate('/dashboard')` on unverified users.
- Inline "pending review" and "rejected" states now render directly on the specialist dashboard, showing submitted credentials, expected timeline, rejection reason (if present), and a reapply CTA.

**Admin Dashboard (`src/pages/AdminDashboard.jsx`)**
- Reject flow now prompts the admin for an optional rejection reason via an inline textarea.
- Reason is written to `users/{uid}.verificationRejectionReason` so the rejected specialist can read it on their own dashboard.

**Request Support (`src/pages/RequestSupport.jsx`)**
- New specialist-availability panel above the form: 3 avatar stack (verified badge on each), online-dot indicator, live count, "first contact within 24h" copy.
- Specialists are queried by `accountType==specialist` + `verificationStatus==approved`, sorted by `verificationDate || createdAt`.
- Success screen shows dynamic count: "X verified specialists are on call".
- The page remains publicly viewable, but request submission is now explicitly presented as an authenticated action so the UI matches Firestore rules.

**Community author labels (`src/pages/Community.jsx`)**
- Every post/comment now renders an always-on role chip: "journalist" (default), "security specialist" (verified → existing `VerifiedBadge`; pending/rejected → neutral "specialist (unverified)" chip).
- Implemented via a new `resolveAuthor(item)` helper + `AuthorLine` component that reads `authorType` and `authorVerificationStatus` (embedded on new posts/comments). Legacy rows fall back to the existing `isVerified` boolean.

**New field**: `users/{uid}.verificationRejectionReason: string | null` (written by admin reject flow, read by Dashboard + SpecialistDashboard banners).

#### 18.2 Service Layer Cleanup

To make the codebase easier to maintain, Firebase access has started moving out of page components and into feature service modules:

- `src/features/support/services/supportService.js`
- `src/features/admin/services/adminService.js`
- `src/features/users/services/userService.js`

Current pages already using this pattern:

- `src/pages/RequestSupport.jsx`
- `src/pages/Dashboard.jsx`
- `src/pages/SpecialistDashboard.jsx`
- `src/pages/AdminDashboard.jsx`

Benefits of this cleanup:

- page components stay more focused on UI and state
- Firestore queries are easier to reuse
- future backend migration points are clearer
- documentation can describe responsibilities per feature instead of per giant page

#### 18.3 Community Uplift

All community changes land in `src/pages/Community.jsx` and `firestore.rules`. New collection: `community-reports`.

**Delete own posts & comments**
- Rules (`firestore.rules`): `community-posts` delete rule changed to `allow delete: if isAdmin() || (isAuth() && resource.data.authorId == request.auth.uid);`
- UI: inline delete button on author's own posts + comments. Confirmation modal before destructive action.
- Posts are hard-deleted. Comments are soft-deleted: content replaced with `'[deleted]'` placeholder and `authorName` cleared, so thread structure (reply depth, accepted-answer pointer) remains intact.
- Comments now carry an explicit `id: ${user.uid}-${Date.now()}` so they can be targeted by `handleDeleteComment` and `handleAcceptAnswer`.

**True anonymous stories**
- New schema field: `community-posts/{id}.isAnonymous: boolean` (default false).
- New form field `isAnonymous` on the discussion post form (Q&A does not get this option — only discussions).
- When true:
  - `authorName` stored as `"anonymous"` and `authorIcon` set to a neutral placeholder.
  - `authorType` is hidden in rendering (AuthorLine shows "anonymous" chip + gray EyeOff avatar).
  - `authorId` is still stored (so the user can delete their own anonymous post) but is never rendered anywhere in Community.jsx.
- Legacy rows without `isAnonymous` are treated as non-anonymous — no migration required.

**Q&A accepted answer**
- New schema field: `community-posts/{id}.acceptedCommentId: string | null` (default null).
- When `type === 'question'` and the viewer is the question author, each comment shows a "mark as answer" button. Clicking writes `acceptedCommentId` to the post. Asker can un-mark.
- Accepted comment renders at the top of the thread with an olive `border-l` stripe and a green "accepted answer" badge.
- `resolved` status is kept independent — an asker can accept an answer without marking the whole question resolved.

**Sort options**
- Segmented control in feed header: `newest` (default) / `top` (by `likes`) / `unanswered` (Q&A tab only — filters to `comments.length === 0`).
- Pure client-side sort over the already-fetched list. No new composite indexes required.

**Unified author profile modal**
- Previously only verified specialists had a clickable profile. Extended to every author.
- Single `AuthorProfile` modal branches content by `authorType`:
  - Specialists: existing verification details + bio + skills.
  - Journalists: username + avatar, join date, total post count, 3 most recent posts (linked).
- Opening a profile fetches the author's posts via a `where('authorId', '==', uid)` query to compute count + recent list.

**Reporting & moderation**
- New Firestore collection `community-reports/{reportId}`:
  ```js
  { postId, commentId: string | null, reportedBy: uid, reason, note, createdAt, status }
  // reason: 'spam' | 'harassment' | 'misinformation' | 'off-topic' | 'other'
  // status: 'open' | 'reviewed'
  ```
- Rules: `create` allowed by any authenticated user (must set `reportedBy == auth.uid`); `read/update/delete` admin-only.
- UI: "report" menu item on every post + comment not authored by the viewer. Modal picks a reason + optional note.
- Admin view: new **reports tab** in AdminDashboard with filter (open/reviewed/all), report cards enriched with post title / author / comment content, and actions: `markReportReviewed`, `deleteReport`, `deleteReportedPost`.
- Admin tab switcher between `verifications` and `reports` with open-count badges.

**Firestore rules additions**

```
match /community-reports/{reportId} {
  allow create: if isAuth() && request.resource.data.reportedBy == request.auth.uid;
  allow read, update, delete: if isAdmin();
}
```

**Note**: Plan originally called for splitting `Community.jsx` into `PostCard.jsx` / `PostDetail.jsx` / `NewsSidebar.jsx` / `AuthorModal.jsx` / `ReportDialog.jsx` + a `useCommunityPosts` hook. The split was deferred to keep regression risk low; all features landed in-place in the existing single file.

#### 18.3 Source Protection Playbook

A new route `/source-protection` (public, no auth required — same as `/resources`) registered in `src/App.jsx`. Implemented in `src/pages/SourceProtection.jsx`.

**Structure**
- Teal-themed header (matches Phase 11 UI consistency pattern) with an `EyeOff` icon.
- 5-tab segmented control:
  1. **compartmentalization** — separating work life from source life (separate devices, accounts, browsers, Signal instances).
  2. **first contact** — secure channels for initial outreach (SecureDrop, Signal usernames, burner email, dead drops); verification rituals.
  3. **meeting & handoff** — in-person meeting hygiene, counter-surveillance, USB hygiene, airgap transfer, verification hashes.
  4. **after publication** — source aftercare checklist (verifying source is OK, legal exposure check, metadata scrub, retention vs. secure deletion).
  5. **legal protections** — shield laws overview, when to call a lawyer, what to do if subpoenaed, regional org contacts (CPJ, RSF, EFF, IPI).
- Each tab renders a summary card + 4 accordion content cards (first open by default; individual toggle). All content is written inline as structured JSX data objects — no external API calls.

**Interactive scenarios section** (shared across tabs, at bottom of page)
- 3 scenario cards: "source says they're being followed", "editor wants source name in shared doc", "phishing email with unpublished detail".
- Clicking opens a decision-tree modal: prompt → 3 choices → correct/incorrect consequence + follow-up text + link to related Resources / SecureSetup page.
- Pure client-side; no persistence in v1.

**Related-resources grid + citations footer**
- Links out to `/resources`, `/secure-setup`, `/community`.
- Citations footer acknowledges CPJ, Freedom of the Press Foundation, EFF, RSF so content is grounded, not invented.

**Integration points (entry paths)**
- **Home** (`src/pages/Home.jsx`): new `FeatureTile` with teal accent and `EyeOff` icon pointing to `/source-protection`. Tile uses a new `accent` prop on `FeatureTile` that switches icon bg/color and link color to teal.
- **Dashboard** (`src/pages/Dashboard.jsx`): source-protection card added to both the compact Explore grid (2×2) and the wider Quick Links grid (md:grid-cols-4). Crisis Mode retained only on the Home page tile per the existing route `/crisis` redirect to `/dashboard`.
- **Dashboard recommendations**: when `communication` category score < 70, the "Up Next" recommendation now reads "protect your sources & channels" and points to `/source-protection` (previously pointed to `/resources`).
- **SecurityScore results** (`src/pages/SecurityScore.jsx`):
  - Low communication-category guidance now reads "open the source protection playbook" → `/source-protection`.
  - Risk Level Card adds a dedicated teal callout block for `high` / `critical` risk profiles linking into the playbook.
- **SecureSetup** (`src/pages/SecureSetup.jsx`): every communication-category task now renders a "source playbook →" link alongside the existing "view tools" link.

**No Firestore writes** from the SourceProtection page — it is informational + interactive only.

#### 18.4 File-level summary

| File | Change |
|------|--------|
| `src/App.jsx` | + `/source-protection` route |
| `src/contexts/AuthContext.jsx` | accountType whitelist |
| `src/pages/Signup.jsx` | dynamic tagline, role selector lifted |
| `src/pages/Dashboard.jsx` | verified-specialist redirect, pending/rejected banners, source-protection cards, communication recommendation → playbook |
| `src/pages/SpecialistDashboard.jsx` | inline pending/rejected states |
| `src/pages/AdminDashboard.jsx` | rejection reason textarea, reports tab |
| `src/pages/RequestSupport.jsx` | specialist-availability panel + success-screen count |
| `src/pages/Community.jsx` | delete, anonymous stories, accepted answer, sort, unified profile, reporting, always-on role labels |
| `src/pages/Home.jsx` | source-protection feature tile |
| `src/pages/SecurityScore.jsx` | communication guidance + high/critical risk callout |
| `src/pages/SecureSetup.jsx` | source-playbook link on communication tasks |
| `src/pages/SourceProtection.jsx` | **new** — 5-tab playbook + scenarios |
| `firestore.rules` | author-delete for community-posts, new `community-reports` rules |

**Firestore schema deltas**
- New: `users/{uid}.verificationRejectionReason: string | null`
- New: `community-posts/{id}.isAnonymous: boolean`
- New: `community-posts/{id}.acceptedCommentId: string | null`
- New: `community-posts/{id}.authorVerificationStatus: 'pending' | 'approved' | 'rejected' | null` (embedded on new posts for role labels)
- New collection: `community-reports/{reportId}`

No new composite indexes required.

---

### Phase 19 — Editorial visual system (Home + foundation)

A full visual repositioning of the marketing surface (Home today, About next) away from a generic Gen Z / AI-default aesthetic toward an **editorial premium** direction inspired by indie studios, type foundry pages, and editorial archives. Product surfaces (Dashboard, SecurityScore, etc.) continue to use the existing newsroom-dark token system; legacy color tokens are kept in `:root` so non-redesigned pages render unchanged.

#### 19.1 Type system

Three families loaded via Google Fonts (free, no licensing constraints):
- **Fraunces** (variable, axes `opsz` / `wght` / `SOFT` / `WONK`) — display, used for headlines, blockquotes, marginalia folios. Variation axes are tuned softer (`opsz 120, SOFT 50, WONK 0`, weight 480) for readability at large sizes; an even softer `display-soft` variant (`opsz 60, SOFT 70`, weight 440) is used for subheads, list entries, and pull-quote attributions.
- **Geist** — UI / body, modern grotesk.
- **Geist Mono** — eyebrows, captions, metadata, security cues.

Token additions in `@theme` of `src/index.css`:
- Ink & paper palette: `--color-paper`, `--color-paper-dim`, `--color-paper-soft`, `--color-ink`, `--color-ink-soft`, `--color-smoke`, `--color-smoke-dim`.
- Accents: `--color-oxblood` / `--color-oxblood-soft` (primary editorial accent, replaces crimson on marketing surfaces); `--color-brass` / `--color-brass-soft` (supporting highlight, used on inverted ink-on-paper sections).
- `--font-display: 'Fraunces'`, `--font-sans: 'Geist'`, `--font-mono: 'Geist Mono'`.
- `--display-axes`, `--display-axes-soft` for tuned variation settings.

#### 19.2 Editorial utilities (`src/index.css`)

- `.surface-paper` — opt-in paper canvas (warm off-white background, multiply-blend SVG grain). Used by Home and will be used by About. Negative top margin + matching pt offset extend the canvas under the fixed header.
- `.display`, `.display-soft` — Fraunces variants with softer tuning.
- `.eyebrow`, `.caption`, `.index-num` — mono small-caps utilities.
- `.dropcap` — first-letter Fraunces drop cap (reserved for editorial paragraphs).
- `.rule`, `.rule-soft` — hairline dividers (ink on paper / ink on dark).
- `.link-editorial`, `.link-oxblood` — base link treatments.
- `.column-editorial` — narrower reading-optimized column.

**Editorial motifs (Phase 19 additions)**
- `.link-handdrawn` — link with a permanent thin baseline plus an animated oxblood ink stroke that draws left-to-right on hover (500ms ease). Used for primary action links in the Home hero and crisis section.
- `.ink-caret` — small ink-block element with a slow editorial blink (`caret-blink` keyframes, 1.4s asymmetric steps). Placed at the end of the hero lede paragraph.
- `.asterism` — three-star (⁂) section divider rendered with flanking hairline rules and oxblood color. Replaces `<hr>` rules between major sections.
- `.marginalia` — left-rail annotation column with three children: `.folio` (italic Fraunces Roman numeral in oxblood), `.filed` (mono small-caps "filed under" label), `.inscription` (italic Fraunces small sentence). A thin oxblood gutter rule runs vertically on `md` and up. Used in the Home hero's left rail and at the start of §02, §03, §04.

#### 19.3 Home page redesign (`src/pages/Home.jsx`)

Four sections, all set on `.surface-paper`:

1. **§01 Masthead opener** — publication slug line (`SafePress / Vol. I / № 01` and filing line) above a single-focal-point hero stack:
   - Headline "Journalism is only as safe as *the journalist.*" (Fraunces, key phrase in oxblood italic), constrained to ~18ch so the line break is intentional.
   - Lede paragraph terminated with `.ink-caret`.
   - A quiet inline action row below: two `link-handdrawn` entries — "Take the security score" and "Open crisis mode" (oxblood). The earlier 3-column variant with left/right rails was removed: flanking the headline with marginalia + an "in this issue" column gave the eye three competing landing points with no hierarchy.
2. **§02 Contents** — marginalia (`II.` / "§ 02 — Contents" / inscription) + a 9-col headline "Six instruments. One discipline." + an ordered list of six numbered entries (Security Assessment, Secure Setup, OS Guides, Source Protection, Community, Specialist Support). Each entry renders as an editorial row, not a card.
3. **§03 In crisis** — marginalia (`III.`) + display-sized blockquote "When the worst happens, the next move shouldn't be a *Google search.*" + supporting paragraph + `link-handdrawn` "Open crisis mode" CTA (oxblood).
4. **§04 Begin (colophon)** — inverted ink-on-paper section. Marginalia (`IV.`) with locally remapped tokens so it reads correctly on dark. Closing line "Five minutes. No account. *Take the assessment.*" + footer slug line (Open access / No tracking / Open source · Set in Fraunces & Geist).

Asterism (⁂) dividers replace the previous `<hr className="rule" />` between sections. Each fades in on scroll via framer-motion.

#### 19.4 Header (`src/components/layout/Header.jsx`)

Surface-aware single-row layout (`h-16`, ~`pt-20` for content), driven by `isMarketing = useLocation().pathname === '/'`:
- Italic-roman wordmark `<em>Safe</em><span>Press</span>` set in `.display`.
- Mono nav (11px, 0.18em tracking) with a hairline underline for the active route (ink on paper, paper on dark — no gold).
- Crisis banner uses `var(--color-oxblood)` instead of legacy crimson.
- Notifications bell + user menu integrated into the header row (no floating top-right pills). Crisis toggle at bottom-right restyled as a square slim switch.
- All auth/notification logic preserved unchanged.

#### 19.5 MainLayout (`src/components/layout/MainLayout.jsx`)

`<main>` padding switched from `pt-24/pt-36` to `pt-20/pt-28` to match the slimmer single-row header.

#### 19.6 File-level summary

| File | Change |
|------|--------|
| `src/index.css` | Fraunces + Geist + Geist Mono import; ink & paper tokens; `.surface-paper` with grain overlay; editorial type utilities; Phase 19 motifs (`.link-handdrawn`, `.ink-caret`, `.asterism`, `.marginalia` + `.folio` / `.filed` / `.inscription`); softened Fraunces variation tuning |
| `src/pages/Home.jsx` | Full rewrite — 3-col masthead hero, marginalia rails on §02/§03/§04, asterism dividers, hand-drawn action links, blinking ink caret, oxblood accents |
| `src/components/layout/Header.jsx` | Single-row surface-aware editorial header, italic-roman wordmark, integrated auth controls |
| `src/components/layout/MainLayout.jsx` | Reduced top padding for slimmer header |

No schema, no route, no auth changes in Phase 19. Other pages still render against the legacy dark surface; their redesign is sequenced after Home is approved.

---

### Phase 20 — Dual-state Home front page

The first editorial Home pass looked better, but it still behaved like a brochure. Phase 20 keeps the visual foundation from Phase 19 and makes `Home` do more real front-page work without touching rules, auth semantics, or privileged workflows.

#### 20.1 Safety constraints kept intact

This pass intentionally does **not**:
- change Firestore rules
- broaden collection access
- add new writes from `Home`
- change protected-route or verification semantics
- introduce Cloud Functions or backend logic

The redesign remains read-only and compositional. `Home` now reuses:
- hydrated `useAuth()` profile data
- the signed-in user’s own support-request query
- already-permitted specialist queue/case counts for approved specialists
- public community reads
- the existing external advisory feed infrastructure

#### 20.2 New Home data layer

A narrow read-only service was added at `src/features/home/services/homeService.js`.

It provides:
- `getLatestSecurityScore(user)`
- `getSetupProgress(user)`
- `getSupportStatusLabel(status)`
- `getSpecialistVerificationState(user)`
- `getJournalistHomeSupportSnapshot(userId)` — wraps the existing requester-only support query and returns the latest request
- `getApprovedSpecialistHomeStats(userId)` — wraps the existing open / claimed / resolved specialist reads
- `getInternalFieldSignal()` — derives one public community signal
- `getExternalFieldSignal()` — derives one external advisory item from the existing feed list

No new write helpers were added.

#### 20.3 Community helper for lighter field content

`src/features/community/services/communityService.js` now exports:
- `listRecentCommunityPosts(maxPosts = 5)`

This avoids loading the entire public community collection just to surface one recent public question/discussion on Home.

#### 20.4 Home behavior (`src/pages/Home.jsx`)

`Home` is now a **dual-state front page**.

**Anonymous / logged-out**
- keeps the editorial orientation
- surfaces a dedicated high-contrast **emergency rail** before the hero
- treats **Security Assessment** as the primary non-emergency path
- moves the other tools into a supporting list instead of flattening everything into equal-weight brochure entries
- includes a real “From the field” block:
  - one external advisory
  - one internal public community signal

**Signed-in journalist**
- keeps the user on Home instead of redirecting
- uses hydrated auth data immediately for:
  - latest score
  - setup progress
- progressively loads only the user’s own support-request state
- renders a compact summary band:
  - latest score
  - setup progress
  - support status
  - one next action
- shows one status line underneath the band instead of duplicating full dashboard panels

**Approved specialist**
- keeps the same Home shell, but swaps in:
  - open queue count
  - active claimed count
  - resolved count
  - CTA back to `/specialist-dashboard`
- only counts already allowed specialist reads are shown; no extra case detail is surfaced on Home

**Pending / rejected / pending-email-verification specialist**
- shows verification status clearly
- shows a single next action
- does **not** show misleading queue summary or specialist workflow counts

#### 20.5 Crisis treatment

The crisis path now has its own visual register near the top of Home:
- dark emergency rail
- short scan-first copy
- direct CTA to the existing `openOverlay()` entry point

No crisis state-management or overlay logic changed in this phase.

#### 20.6 Performance implications

This pass keeps the earlier startup optimizations intact:
- public Home still paints immediately without waiting for auth hydration
- signed-in summary uses already-hydrated profile data first
- secondary reads happen progressively in `useEffect`
- no notification-style N+1 query pattern was introduced
- the field block uses one narrow recent-community query instead of loading the whole collection

#### 20.7 File-level summary

| File | Change |
|------|--------|
| `src/pages/Home.jsx` | Rebuilt into a dual-state front page with crisis rail, signed-in summary band, primary-vs-supporting tool hierarchy, and “From the field” block |
| `src/features/home/services/homeService.js` | New read-only Home helper layer for score/setup/support/status/advisory/community signals |
| `src/features/community/services/communityService.js` | Added `listRecentCommunityPosts()` for a lighter public Home community read |

No rule changes, no schema changes, and no new backend work were introduced in Phase 20.

---

### Phase 21 — Home cohesion pass (whitespace, vocabulary, crisis treatment)

Phase 20 introduced real front-page work but stacked editorial typography (Phase 19 flat hairline language) against four rounded card containers (emergency rail + metrics strip + primary-tool card + field-signal cards), and the spacing ladder was too generous (`py-28 md:py-36` plus an internal `mt-10/12/14/16/20` ladder). The eye landed in three competing places per section and section margins consumed disproportionate canvas. Phase 21 unifies the vocabulary and tightens the rhythm.

#### 21.1 Visual vocabulary unified

All rounded-card containers on Home were flattened to editorial layouts:
- **Metrics strip** — was `border ... rounded-[1.5rem] overflow-hidden` with a grid of 4 cells (3 metrics + a "Next move" cell). Now: hairline `border-y` with `md:divide-x`, 3 metric cells, no rounded container. The "Next move" cell was removed entirely — it duplicated §02 "Primary path" which already names the next action.
- **Primary path** — was a `rounded-[1.5rem]` card sitting in a `lg:col-span-5` sidecar next to the supporting-tool list in §02. Now: a flat block on a hairline `border-t`, taking the full content width above the tool list. This was the single biggest layout fix — the previous sidecar pinned the tools list into a `lg:col-span-7` slot which then split internally into title (5) + body (5), so tool descriptions wrapped or truncated. The flat full-width layout gives tool bodies real reading room.
- **Field-signal cards** — were two `rounded-[1.5rem]` `bg-paper-soft` cards. Now: two flat blocks inside a hairline `border-y` container with `md:divide-x`. The hover state still shifts to oxblood-tinted title.

The emergency rail stays as a rounded ink-on-paper-inverted block (that one is meant to read as a discrete instrument, not as page surface).

#### 21.2 Dismissible emergency rail

The emergency rail above the headline now carries a "Not in crisis" dismiss button (with an `X` icon). Dismissal persists for the session via `sessionStorage` (`safepress:home:emergency-dismissed`). The persistent header crisis toggle (bottom-right) stays available regardless — Home no longer double-renders the same affordance permanently. The rail visual was also tightened (`rounded-[1rem]`, smaller paddings, smaller display-soft size) so it doesn't out-shout the headline.

#### 21.3 Marginalia restraint

Marginalia (folio + filed + inscription with oxblood gutter rule) was previously rendered in all four sections, which flattened the device. Phase 21 keeps marginalia only in **§02** and **§04** — the §01 masthead slug already does the dateline work, and §03 ("From the field") works better as a full-width content section with its own headline.

#### 21.4 Spacing rhythm

Section vertical padding dropped from `py-28 md:py-36` (≈7–9rem each side) to `py-16 md:py-24` (≈4–6rem). Internal `mt-*` ladder normalised to a consistent ramp: `mt-6` (headline → lede), `mt-8/10` (group → small follow-up), `mt-12/14` (group → next group), `mt-16` (section break). Asterism (⁂) dividers were removed in favour of hairline section borders — asterism was a third separator vocabulary on top of marginalia and hairlines, and dropping it lets the editorial type carry the section transitions.

#### 21.5 Hand-drawn link consistency

The §04 closing CTA used `italic underline decoration-1 underline-offset-[0.12em]` while every other primary action used `.link-handdrawn`. A new `.link-handdrawn-dark` variant was added to `src/index.css` — same draw-on-hover ink stroke as the light variant, but with a brass-soft accent line on a paper-tinted baseline (since oxblood loses too much contrast on the ink background). The §04 closing CTA now uses it, so every action link on Home shares one hover treatment.

#### 21.6 Crisis toggle centering fix

The bottom-right crisis toggle in `Header.jsx` had a subtle bug: the inner sliding indicator used `top: 3px` inside a 28px-tall button with a 1px border. With `box-sizing: border-box`, the absolute child's positioning context is the padding edge (content area = 26px), so `top: 3px` left 3px above the slider and only 1px below — visibly off-centre. Switched to `top: 50%` with `translate(X, -50%)` combined into the existing horizontal slide transform. The slider is now always vertically centred regardless of border or box-sizing.

#### 21.7 File-level summary

| File | Change |
|------|--------|
| `src/pages/Home.jsx` | Flattened metrics/primary-path/field-signal cards to editorial layouts; dismissible emergency rail with sessionStorage; marginalia kept only in §02/§04; tightened section paddings + normalised internal margin ladder; removed asterism dividers; merged "Next move" cell into primary path |
| `src/index.css` | Added `.link-handdrawn-dark` for dark-surface action links |
| `src/components/layout/Header.jsx` | Fixed crisis toggle inner indicator vertical centering (top:50% + translateY(-50%) instead of top:3px) |

No schema, no rule, no service changes. Phase 20's read-only data layer is untouched.

---

## Phase 22 — Home broadsheet skeleton (May 11, 2026)

### 22.1 Why a broadsheet

Phase 21 left Home as a clean editorial page but the §02 grid still showed visible whitespace on the left rail (the marginalia column was mostly air after the inscription) and the user pushed back: "What if the homepage looked like a proper old-style newspaper front page? Journalists know how to navigate that, and it's unique." Phase 22 commits to that paradigm. Home is now treated as the front page of a single editorial publication — masthead, lead story, photograph, multi-column body — with the rest of the page reading as section spreads inside that issue. The unlock is *typographic hierarchy as the layout system*: weight is allocated by headline size, not by box treatments.

### 22.2 Skeleton-pass discipline

The user's persistent direction across the redesign has been "introduce motifs one at a time, never pile them on" (memory: `feedback_editorial_restraint`). Phase 22 is intentionally scoped as a **skeleton pass** — the structure that makes the page read as broadsheet — and explicitly defers all chrome work (kickers, drop caps, folio details, halftone photography, justified text, old-style figures). Each chrome layer will be introduced as a separate pass and confirmed before the next.

The skeleton pass ships four things:
1. A real broadsheet masthead at the top of §01.
2. State-aware lead headlines (one per user state) with italic-oxblood emphasis on the noun that carries the headline's weight.
3. A photograph slot below the headline, accompanied by an italic caption with a `PHOTO` kicker label.
4. A two-column lede body adjacent to the photo, using CSS `column-count` so a single paragraph flows across columns the way newspaper body copy does.

### 22.3 Broadsheet masthead

A new `<header className="broadsheet-masthead">` block sits at the very top of §01, replacing the previous slim slug bar. Structure:
- **Top dateline row** — three caption-cap items aligned left/centre/right: today's full dateline (`Monday, May 11, 2026`), issue marker (`Vol. I · № 01`), and tagline (`AN EDITORIAL BRIEF FOR JOURNALISTS AT RISK` or, for signed-in users, `FILED FOR YOUR ACCOUNT`). Anchored under a 3px thick rule (the masthead's top frame).
- **Centred wordmark** — `SafePress` set in Fraunces via the new `.broadsheet-wordmark` utility class (`opsz:144, wght:700, SOFT:30, WONK:1, letter-spacing:-0.035em, line-height:0.85`). Rendered at `4.5rem → 11rem` across breakpoints. Single italic tagline beneath: *"Safety, drafted with a reporter's hand."*
- **Bottom rule pair** — paired 3px thick rule + 1px hairline rule via `.broadsheet-rule-pair`, the canonical broadsheet "above-the-fold" separator.

`formatMastheadDate(value)` is a small new helper that formats `new Date()` as `Monday, May 11, 2026`. The component derives `mastheadDateline` once during render.

### 22.4 State-aware lead headlines

The four headlines approved for the broadsheet lead are now wired through:

| User state | Headline | Italic-oxblood emphasis |
|------------|----------|------------------------|
| Anonymous visitor | "Safety, written for the people who *write*." | `write` |
| Logged-in journalist | "Today's brief, *{firstName}*." | first name |
| Approved specialist | "Today on *the desk.*" | `the desk.` |
| Pending/rejected specialist | "Your verification is *reading.*" | `reading.` |

Each `pageModel` brief now carries both a plain-string `heading` (for accessibility / fallback) and a `headingNode` JSX field that wraps the emphasis word in the italic-oxblood `<em>` already established as the heading motif. The `<h1>` renders `{heroHeadingNode || heroHeading}` and falls back gracefully.

A new helper `getFirstName(user)` walks `displayName` → email local-part → `'colleague'` so the journalist headline always has a noun to italicise. A small `emphasis(text)` helper centralises the `<em className="italic" style={{ color: 'var(--color-oxblood)' }}>` element used inside each brief builder.

The previous special-case that detected `'the journalist'` substring inside the visitor heading and inserted an oxblood `<em>` was retired — the new `headingNode` system handles emphasis uniformly across all four states.

### 22.5 Photograph slot + caption

A new `.halftone-placeholder` utility renders a paper-soft block at `aspect-ratio: 4/3` with a 5px halftone-dot background pattern (radial-gradient circles over a subtle paper gradient) and a `STILL LIFE — PLACEHOLDER` label faintly centred. This is intentionally a *placeholder*, not a real photograph — the dissertation work will swap a real halftone-treated still life into this slot. Until then the placeholder communicates *where the image lives* and the texture establishes the halftone idiom.

The figure sits in a `md:col-span-5` cell of a 12-column grid below the headline, with an italic Fraunces caption beneath: a `PHOTO` kicker in caps (small-caps style via `caption uppercase tracking-[0.22em]`) followed by an em-dash and the italic line *"A reporter's desk in the quiet before filing."* — classic newspaper photo-caption typography.

### 22.6 Multi-column lede body

The lede paragraph that previously rendered as a single `max-w-[45rem]` block now sits in the `md:col-span-7` cell next to the photograph and is wrapped in `.broadsheet-columns`. That utility sets `column-count: 1` at base and `column-count: 2` from `md:` upwards, with `column-gap: 2.25rem` and an optional `column-rule` hairline. Inside, paragraphs use `break-inside: avoid` so a paragraph never splits across the column gutter.

To give the columns enough body for the flow to read as broadsheet-y, each pageModel brief now carries a `ledeBody` companion paragraph in addition to the existing `lede`. For visitor copy this expands to two paragraphs (purpose + access note); for logged-in states the `ledeBody` adds a secondary sentence about how Home defers to the dashboard or specialist workflow. Single-paragraph briefs still render correctly — the column flow just splits one paragraph across the gutter.

### 22.7 Restructured §01 below-the-fold

The metrics strip and activity callout were repositioned to fit the broadsheet anatomy:
- **Activity callout** moves *inside the col-span-7 cell* directly under the lede body, separated by a top hairline rule. It reads as a continuation of the lead story rather than a flanking sidebar. The previous oxblood gutter-rule treatment was dropped — a horizontal hairline above the block is enough separation now that the lede sits in two columns.
- **Metrics strip** moves *below* the photo+lede grid, spanning the full content width as a single border-y "by the numbers" row with `md:divide-x` between cells. This is the canonical newspaper stat-strip position — under the lead, above the section transition.

For anonymous visitors, the two action links (`Take the security score`, `Browse the resource library`) sit in the same below-lede slot as the activity callout for signed-in users, separated by a top hairline. The metrics strip is hidden for visitors.

### 22.8 Primary-path arrow wrap fix

The screenshot in the user's feedback caught the §02 primary-path link rendering with the arrow on a second line ("Open specialist dashboard" / "→"). Root cause: `.link-handdrawn` declares `display: inline-block`, which won outright over Tailwind's `inline-flex` utility in the cascade and left the text + arrow flowing as inline content that wrapped under narrow column widths. Fixed by adding `white-space: nowrap` to both `.link-handdrawn` and `.link-handdrawn-dark` in `src/index.css` — the simplest correct fix, independent of which display mode wins.

### 22.9 File-level summary

| File | Change |
|------|--------|
| `src/pages/Home.jsx` | Broadsheet masthead block; state-aware `headingNode` JSX on every brief (visitor + journalist + specialist approved/pending); `ledeBody` companion paragraph; photo+lede 5/7 grid; activity callout moved under lede; metrics strip moved below grid; `getFirstName` + `emphasis` + `formatMastheadDate` helpers |
| `src/index.css` | New utilities: `.broadsheet-masthead`, `.broadsheet-rule-pair`, `.broadsheet-wordmark`, `.halftone-placeholder`, `.broadsheet-columns`. Added `white-space: nowrap` to `.link-handdrawn` + `.link-handdrawn-dark` to fix arrow wrap |

No schema, no rule, no service changes. The Phase 20 read-only data layer remains untouched — only presentation and copy changed.

### 22.10 Explicitly deferred (next passes)

In order to keep this pass to one paradigm shift, these chrome layers are intentionally **not** included:
- Kicker labels above tool entries and field signals (small caps section-marker text).
- Drop cap on the first character of the visitor lede.
- Folio marks and "Continued on page X" cross-references.
- Real halftone-treated photograph (asset sourcing).
- Justified body text with hyphenation (currently left-aligned ragged-right).
- Old-style (oldstyle) figures in the metrics strip.
- Edge-to-edge masthead rules (currently constrained to content max-width).
- Section reweighting on §02–§04 to match the broadsheet idiom (currently §02–§04 retain Phase 21 structure).

Each of these will be picked up as a discrete pass, confirmed visually before moving to the next.

---

## Phase 23 — Three-zone broadsheet commit (May 11, 2026)

### 23.1 Why the structural commit happened now

After Phase 22 shipped the masthead skeleton, the page still read like "a website with a newspaper hat" rather than a genuine broadsheet front page. The user's feedback was direct: the layout was being "too shy," missing actual columns, leaving the security instruments scattered across separate sections instead of anchoring them to the left rail where a newspaper reader expects ribbons of department links. The instruction was to commit fully: real columns, instruments down the left, lead story in the centre, figures and field signals on the right, everything visible at a glance.

This pass folds the previous Phase 22 §02 (working tools list), §03 (field signals), and parts of §01 (metrics strip) all into a single broadsheet front page — three zones below the masthead — so the entire page is "the front page." A separate ink-dark §02 (was Phase 21 §04) remains as the closing "back to work" call.

### 23.2 The three-zone layout

Below the masthead and the dismissible emergency rail, §01 now renders the full-width lead headline followed by a 12-column grid split 3 / 6 / 3:

- **Left (col-span-3) — _The instruments_**: a vertical rail of 4–6 state-aware security tools. Each tool entry shows a kicker label ("01 — Assessment"), a serif title, a 1–2 line summary, and a small caps CTA with an arrow. Hovering re-tints the kicker, title, and CTA to oxblood in unison. The rail is bounded by a top caption rule and a right column rule.
- **Center (col-span-6) — The lead**: the halftone photo placeholder, an italic photo caption with a "PHOTO" kicker, a two-column body that flows justified-with-hyphens text across the column at md+, and an activity callout (logged-in) or visitor action links beneath a horizontal rule. The activity callout for signed-in users also surfaces the next-action CTA inline.
- **Right (col-span-3) — Sidebar**: a "By the numbers" stack of three state-aware metrics (each row: caption label / oldstyle-feeling display number / smoke detail), followed by "From the field" with two compact field signal cards (external advisory + internal community signal). Visitors still see "By the numbers" — populated with public access stats (31 score questions / 4 crisis protocols / Access: open) — so the right sidebar is never empty.

Mobile order is logical reading order: headline → center lead → instruments → sidebar. The vertical column rules disappear below md.

### 23.3 State-aware instruments

Three constants drive the left rail content:

| State | Constant | Entries |
|-------|----------|---------|
| Visitor | `VISITOR_INSTRUMENTS` | Security score, Source protection, OS guides & tools, Community |
| Journalist (signed in) | `JOURNALIST_INSTRUMENTS` | Security score, Secure setup, Source protection, OS guides & tools, Community, Specialist support |
| Specialist (approved or pending) | `SPECIALIST_INSTRUMENTS` | Specialist dashboard, Community, Source protection, OS guides & tools, Settings |

Each entry has `kicker` (numbered category label), `title`, `body` (1–2 line description), `to`, and `cta`. The `pageModel` for every user state now sets `instruments` instead of the old `primaryTool` + `supportingTools` pair, and the §01 left rail iterates over that array via the new `RailInstrument` component.

### 23.4 Restored visitor headline

The visitor lead headline reverts to the previous "Journalism is as safe as the journalist." with italic-oxblood emphasis on _the journalist._ The Phase 22 attempt ("Safety, written for the people who write.") was retired — the user explicitly preferred the older line for its editorial bite. The four other state headlines (`Today's brief, {firstName}.` / `Today on the desk.` / `Your verification is reading.`) carry over unchanged.

### 23.5 Multi-column body — justified with hyphenation

`.broadsheet-columns` in `src/index.css` was tightened for the narrower center column:

- Removed `break-inside: avoid` from the inner `<p>` rule so paragraphs flow naturally across columns instead of getting stuck in one.
- Added `text-align: justify` and `hyphens: auto; -webkit-hyphens: auto` — the canonical newspaper body treatment.
- Reduced `column-gap` from 2.25rem to 1.75rem.
- Added `text-indent: 1.1em` to the second paragraph (the classic paragraph indent after the first paragraph in a newspaper column).

Visitor and signed-in user lede copy was extended to roughly twice its Phase 22 length, so each user state now has two genuine paragraphs that fill the two-column flow rather than ~3 lines of orphaned text in column one.

### 23.6 Removed sections

The previous Phase 21 §02 "Working tools" and Phase 21 §03 "From the field" are gone entirely. Their content is absorbed into the §01 left rail and right sidebar respectively. The previous §04 "Continue" closing section is renumbered to §02 with the marginalia folio updated from `IV.` to `II.` and `§ 04 — Continue` to `§ 02 — Continue`. The full-width metrics strip below the §01 grid is also gone — metrics now live exclusively in the right sidebar.

### 23.7 Removed components and imports

- `ToolEntry` and `FieldSignal` are deleted — they served the old full-width §02 and §03 sections that no longer exist.
- New components: `RailInstrument` (left rail item), `SidebarStat` (right sidebar metric row), `CompactFieldSignal` (right sidebar field signal card).
- Icon imports trimmed to just `AlertTriangle`, `ArrowRight`, `ArrowUpRight`, `X` — the rail uses kicker labels instead of icons (broadsheets do not).
- `JOURNALIST_SUPPORTING_TOOLS` and `SPECIALIST_SUPPORTING_TOOLS` constants are replaced by the three `*_INSTRUMENTS` constants above.

### 23.8 File-level summary

| File | Change |
|------|--------|
| `src/pages/Home.jsx` | Cut §02 and §03; absorbed both into the §01 three-zone broadsheet body (rail + lead + sidebar); renumbered closing §04 → §02; restored visitor headline to "Journalism is as safe as the journalist."; doubled lede length on every user state; introduced `VISITOR_INSTRUMENTS` / `JOURNALIST_INSTRUMENTS` / `SPECIALIST_INSTRUMENTS` constants; introduced `RailInstrument`, `SidebarStat`, `CompactFieldSignal` components; removed `ToolEntry`, `FieldSignal`, supporting-tools constants, and unused icon imports |
| `src/index.css` | `.broadsheet-columns` now justified + hyphenated, column-gap 1.75rem, no break-inside lock, second paragraph indents 1.1em |

No schema, no rule, no service changes. The Phase 20 read-only data layer remains untouched.

### 23.9 Explicitly deferred (next passes)

This pass commits to the broadsheet **structure** rather than piling on every newspaper motif at once. Still deferred:
- Kicker labels above the §02 (closing) heading.
- Drop cap on the first character of each lede.
- Folio marks and "Continued on page X" cross-references.
- Real halftone-treated photograph (asset sourcing).
- Old-style (oldstyle) figures in the sidebar metrics.
- Edge-to-edge masthead rules (currently constrained to content max-width).
- Re-skinning §02 (closing) to broadsheet idiom (currently still uses the Phase 21 ink-dark closing pattern).

---

## Phase 23.1 — Masthead and chrome trim (May 11, 2026)

Small follow-up cleanup after a visual review of the Phase 23 commit. Three pieces of chrome were called out as either tryhard or visually noisy and removed; the crisis toggle was reanchored as a proper footer pill.

### 23.1.1 Masthead pared down to a strip

In [src/pages/Home.jsx](src/pages/Home.jsx) the masthead block was simplified to act as a strip beneath a real-newspaper-style top rule, rather than an oversized SafePress nameplate:

- Removed the third caption (`Filed for your account` / `An editorial brief for journalists at risk`) — felt like a tagline more than a dateline.
- Removed the centered `broadsheet-wordmark` "SafePress" block and the "Safety, drafted with a reporter's hand." italic tagline.
- Removed the `broadsheet-rule-pair` divider that was bracketing the nameplate; without the nameplate it had nothing to frame.

Result: front page opens with a thin top rule, a dateline + volume/issue strip, and goes straight to the lead headline ("Journalism is as safe as the journalist."). The headline is now the sole focal point at the top, consistent with the editorial-restraint discipline.

### 23.1.2 Footer caption strip in §02 removed

The bottom border-divided strip in §02 reading `Open access · Crisis protocols stay public · Front page updates quietly` / `Set in Fraunces & Geist` was deleted. It read as press-release boilerplate inside an editorial layout and competed with the closing CTA without earning that attention.

### 23.1.3 Crisis toggle re-anchored as a footer pill

In [src/components/layout/Header.jsx](src/components/layout/Header.jsx) the bottom-right crisis toggle was previously two free-floating elements (label + pill switch) over a transparent backdrop, which made content visible behind them as the page scrolled — visually muddy.

The toggle is now wrapped in a single bordered pill container with:
- A solid surface-aware background — paper-tone (`rgba(248, 244, 236, 0.92)`) on marketing surfaces, ink-tone (`rgba(15, 14, 13, 0.88)`) on dark product surfaces.
- `backdrop-blur-md` so any content that does scroll behind it stays muted rather than reading through.
- A 1px surface-aware border and a soft shadow so the pill reads as its own deliberate component rather than overlay UI.

It still toggles the same `useCrisis` actions; only the visual presence changed.

### 23.1.4 What this confirms about restraint

This pass deletes three pieces of chrome (caption row, big wordmark + tagline, footer info strip) and adds none. The crisis toggle change is purely visual containment, not new vocabulary. Editorial restraint memory rule held: every removal reduced the count of competing focal points on the front page.

---

## Phase 23.2 — Per-page personality: Resources as a reference notebook (May 15, 2026)

Per-page personality direction: the app is one editorial world, but each page is a different newsroom object. First pass lands on Resources, which becomes a **reference notebook**. The other pages (Source Protection as field manual, Security Score as clipboard, Community as letters page, etc.) are deferred to subsequent passes.

The first iteration of this pass leaned skeuomorphic (taupe desk surface, stitched oxblood binding strip, punched binding holes, dog-eared cards, yellow pinned-caution notes, brass tack, tilted stamps) and read as 2010-era tactile UI. **The pass was rebuilt with print-magazine restraint**: the notebook metaphor survives through structure (proportion, margin rule, numbered entries, typography), not depicted props. The implementation described below is the current restrained state.

### 23.2.1 Why Resources first

Resources is the most information-heavy page in the product (OS hardening steps, vetted tools, AI-risk guidance). It needs a personality that signals "look things up here" rather than the broadsheet-front-page logic Home uses. A reference notebook reads as a place to scan, jump between sections, and return to — which matches the page's actual job.

### 23.2.2 Page surface ([src/index.css](src/index.css))

A scoped `.resource-notebook` class wraps only this page. All work is CSS — no images, no new dependencies, no JS.

- **Outer surface** is `var(--color-paper-dim)` (`#EAE3D5`). No grain, no gradient, no depicted material — just a hint of warmer cream so the inner page reads as distinct.
- **Page** is `var(--color-paper-soft)` (`#FAF6EE`) on a 1px hairline ink border with a soft single-layer drop shadow (`0 12px 32px -16px` + `0 2px 6px`). No multi-layer shadow stack, no inset highlight beyond a 1px paper-white inner top edge.
- **Left margin column** uses 5.5rem of left padding (1.5rem on mobile). The only notebook prop on the whole page is a **single oxblood hairline** painted at 4.5rem from the left as `::before` — `rgba(123, 46, 46, 0.22)`, 1px wide. That hairline is the entire "this is a notebook" signal. Mobile drops the hairline along with the wider margin.

There is no desk taupe, no grain pattern, no horizontal ruled lines across the page, no binding spine, no punched holes, no stitched top edge.

### 23.2.3 Masthead caption

Below the page title, a single line of mono small caps in smoke reads `Reference / Vol. 01`. No border box, no oxblood stamp, no rotation, no shadow.

### 23.2.4 Index tabs — typographic with one accent underline

`.notebook-index` is a flat horizontal strip with a single hairline bottom rule. Tabs are typographic only: no background, no border box, no radius, no 3D, no transform. Hover paints a soft ink underline on the tab's bottom edge; the active tab paints a 2px accent-colored underline using `--tab-accent`. The result reads as section markers in a book's contents, not as physical tabs.

### 23.2.5 OS hardening — numbered entries

`.notebook-ledger` is a simple list separated by hairline rules. The step number (`.news-row-index`) is set in **Fraunces display soft, 1.5rem, weight 500**, in the OS accent color. No circle, no ring, no inset highlight, no badge. It reads as a print catalog index numeral.

The OS selector buttons (Windows / macOS / Linux / iOS / Android) become typographic with a bottom hairline — no pill, no border, no fill. Active state shifts text color to the OS accent and underlines.

### 23.2.6 Tool & item cards — flat, hairline

`.notebook-card` is paper-soft on a hairline ink border (`rgba(21, 17, 12, 0.10)`), no radius, no gradient, no left color rule, no dog-ear, no rotation. The shadow is `0 2px 6px` (`0 4px 12px` on hover). Section label inside the card is mono small caps in the category accent color; no dashed divider beneath it. The priority/use badge (`.notebook-stamp`) is a flat hairline-outlined pill — no tilt, no background, no shadow.

The category accent now appears only as: the small mono section label inside the card, and the color of the priority badge text/border. Cards no longer carry a colored stripe or left bar.

### 23.2.7 Caution notice — quiet ink

`.notebook-warning` is paper-soft on a hairline ink border with a 2px oxblood left rule. The "Caution" label sits inside the box (top-left) in mono small caps in oxblood. No yellow background, no rotation, no brass tack, no protruding tag. It reads as a footnote of importance, not as a sticker.

### 23.2.8 What this confirms

Restraint over depiction. The notebook metaphor survives — wide left margin, oxblood margin hairline, numbered entries set in display type, typographic section tabs — without rendering any literal notebook props. Bundle stayed flat (Resources chunk unchanged at 23.27 kB / 7.11 kB gzip), and the global CSS actually shrank from 108.4 kB / 18.4 kB gzip to 105.0 kB / 17.6 kB gzip because the restrained pass uses fewer multi-layer gradients and pseudo-elements.

Editorial restraint memory rule held: per "one focal point per section, introduce motifs one at a time," the only motif on the page is the red margin hairline. Everything else is typography.

---

**Last Updated**: May 15, 2026
**Version**: 3.8.3
**Documentation**: Complete (includes Phases 1-23.2)

---

## Phase 24 — Design system implementation: Foundations + Settings (May 15, 2026)

A Claude Design bundle was fetched and processed. It documents the per-page newsroom-object personalities (notebook / field manual / clipboard / workbench / corkboard / intake form / case desk / editor's ledger / personnel record) plus a crisis-overlay rewrite, sitting on a shared editorial token system. Home is excluded — kept as-is per user direction. Dashboard isn't in the design.

The user mandated **restraint everywhere** (no skeuomorphic props — no cork textures, push pins, manila tabs, metal clips, ink cover bands, tilted slips) and asked for an efficient master-style architecture that doesn't undo route splitting.

### 24.1 Architecture decision

The "master style" is two files we already had:

1. **[src/index.css](src/index.css)** — single global editorial vocabulary (tokens + classes). All editorial classes (`.eyebrow`, `.display`, `.italic-ox`, `.btn`, `.f-row`, `.news-*`) live here, scoped by their own names. No per-page CSS.
2. **[src/components/editorial/NewsPage.jsx](src/components/editorial/NewsPage.jsx)** — shared React primitives. Imported by every editorial page.

Vite's chunking automatically extracts the editorial primitives into a shared chunk loaded once across pages. Route-level code splitting (`React.lazy` on each `src/pages/*.jsx`) stays intact — page chunks just consume the shared chunk.

### 24.2 Foundations added to src/index.css

**Tokens** added to `:root`:
- `--display-axes-italic: 'opsz' 60, 'SOFT' 80, 'WONK' 0;`
- `--display-axes-tight: 'opsz' 144, 'SOFT' 30, 'WONK' 1;` (masthead wordmark)
- `--ease-editorial: cubic-bezier(0.22, 1, 0.36, 1);`
- `--t-fast: 160ms; --t-medium: 320ms; --t-slow: 520ms;`

**Classes** added after `.rule-soft`:
- `.italic-ox` — italic Fraunces in oxblood (the single piece of inline color in the system)
- `.eyebrow.sm` — smaller eyebrow modifier for datelines
- `.btn`, `.btn.ghost`, `.btn.mono` — the single button system on paper
- `.f-row` form vocabulary — numbered mono label above + ink underline input + oxblood underline on focus

### 24.3 Editorial primitives added to NewsPage.jsx

- `NewsRule` — broadsheet rule pair (3px ink + 1px below), with optional `tone="oxblood"`
- `NewsField` — wraps a `<label>` around an `№ N` eyebrow label + child input
- `NewsButton` — composes `.btn` / `.btn.ghost` / `.btn.mono` with optional icon children
- `NewsFiled` — the filed-at strip used on form headers / ledgers

The existing primitives (`NewsPage`, `NewsHeader`, `NewsTabs`, `NewsSectionHeader`, `NewsNotice`, `NewsBadge`, `NewsCard`) are unchanged.

### 24.4 Page 1 — Settings ([src/pages/Settings.jsx](src/pages/Settings.jsx))

The legacy 575-line Settings was rewritten end-to-end to the personnel-record direction, applying the restraint discipline strictly:

- **No manila folder tab** sticking up — replaced with a typographic `Personnel · username` / `Account file` strip + the broadsheet rule pair.
- **No card-shadow stack** on the header — the 3-column name/account/verification strip sits flat on paper with a hairline bottom border.
- **No glass cards** anywhere; all the previous `bg-white/5` / `glass-card` styling is gone.
- **Section nav moved** from horizontal tabs at the top to a vertical left column with `§ 01` / `§ 02` / `§ 03` numbering. The `§` glyph is the only "newsroom artifact" used.
- **All numbered fields** use the new `.f-row` vocabulary — mono uppercase labels above, ink underline below, oxblood underline on focus.
- **All buttons** use the new `.btn` system — primary `.btn` for submit, `.btn.mono` for cancel/secondary, oxblood-bordered `.btn.mono` for destructive actions.
- **The delete-confirm modal** kept its functionality but lost the glass aesthetic: paper-soft background, 2px oxblood left rule, "Caution" mono label, hairline ink border.

All existing copy is preserved verbatim (lowercase throughout: "account settings", "manage your profile and security preferences", "profile", "security", "danger zone", every form label, every status message). All Firebase + auth flows are unchanged.

### 24.5 Bundle impact

| | Before | After Phase 24 |
|---|---|---|
| Global CSS | 105.03 kB / 17.60 kB gzip | 108.17 kB / 18.10 kB gzip |
| Settings chunk | 14.94 kB / 3.42 kB gzip | 14.50 kB / 3.74 kB gzip |
| Resources chunk | 23.27 kB / 7.11 kB gzip | 20.89 kB / 6.44 kB gzip *(de-duped editorial imports)* |
| **New** NewsPage chunk | — | 3.34 kB / 1.17 kB gzip |

Net: +3.14 kB raw / +0.5 kB gzip on CSS. Settings raw size unchanged in practice; Resources actually shrank by 2.4 kB raw / 0.7 kB gzip because the editorial primitives it was inlining now live in the shared NewsPage chunk. Every future editorial page rewrite benefits from this same de-duping.

### 24.6 Pages still on the legacy "newsroom dark" system

- **Source Protection** (740 lines) — needs field-manual rewrite
- **Security Score** (1270 lines) — needs clipboard rewrite
- **Secure Setup** (823 lines) — needs workbench rewrite
- **Community** (1717 lines) — needs corkboard rewrite (restraint version: letter cards + attribution dashes, no cork board)
- **Request Support** (471 lines) — needs intake-form rewrite
- **Specialist Dashboard** (738 lines) — needs case-desk rewrite
- **Admin** (650 lines) — needs editor's-ledger rewrite
- **CrisisOverlay** (725 lines) — needs EXTRA-edition rewrite

Each will follow the same pattern: NewsPage shell + editorial vocabulary classes + new editorial primitives, applied with restraint (no depicted props).

---

**Last Updated**: May 15, 2026
**Version**: 3.9.0
**Documentation**: Complete (includes Phases 1-24)

---

## Phase 24.1 — Settings cleanup + Request Support (May 15, 2026)

### 24.1.1 Style discipline & casing

User dropped the lowercase-forcing convention from product copy. All editorial pages going forward use sentence case (display headlines, button labels, form labels, status messages, eyebrow labels). The Settings page was retroactively updated.

### 24.1.2 Architecture clarification

User flagged that the rewrite was inlining `style={{ color: 'var(--color-oxblood)' }}` and `className="text-[color:var(--color-ink-soft)]"` (Tailwind's escape-hatch arbitrary-value syntax) everywhere — which made the global file in [src/index.css](src/index.css) look like it wasn't doing its job.

The answer: it IS the global file, but I wasn't using it cleanly. Tailwind v4's `@theme` block auto-generates utilities from color tokens. So `text-ink`, `bg-paper-soft`, `border-oxblood`, `text-smoke`, `border-ink/12` all work directly without escape-hatch syntax.

**Architecture from now on:**
1. **Tokens** → use Tailwind utilities from `@theme` (`text-ink`, `bg-paper-soft`, `border-oxblood/35`)
2. **Repeated patterns** → editorial classes in [src/index.css](src/index.css) (`.eyebrow`, `.italic-ox`, `.btn`, `.f-row`, `.news-notice` with `--brass`/`--danger`/`--info` tone variants)
3. **Composition primitives** → JSX wrappers in [src/components/editorial/NewsPage.jsx](src/components/editorial/NewsPage.jsx) (`NewsPage`, `NewsRule`, `NewsField`, `NewsButton`, `NewsNotice`, `NewsTabs`, etc.)
4. **No inline `style={{...}}`** for tokenized colors. No `text-[color:var(--color-X)]` escape-hatch when `text-X` works.

### 24.1.3 Settings refactor

[src/pages/Settings.jsx](src/pages/Settings.jsx) was refactored end-to-end against the architecture above:
- All inline `style` props for color → Tailwind utilities
- All `text-[color:var(...)]` → short form
- The 5 repeated "info notice with left bar" patterns → the existing `.news-notice` class with new `news-notice--brass` and `news-notice--info` tone variants (added to global CSS)
- All copy from `lowercase` → sentence case
- Same functionality, same copy intent, much shorter file

**Header surface-awareness fix:** [src/components/layout/Header.jsx](src/components/layout/Header.jsx) had `PAPER_SURFACE_PATHS = new Set(['/', '/resources'])` — every other route fell through to the legacy dark header. `/settings` and `/request-support` joined the set; the misleading `isMarketing` variable was renamed to `isPaperSurface`. As more pages migrate, they each just add their path to that array.

### 24.1.4 Page 2 — Request Support ([src/pages/RequestSupport.jsx](src/pages/RequestSupport.jsx))

The 471-line legacy form was rewritten end-to-end to the intake-form direction:

- **Form masthead** — `Form SP-S — Specialist support request` in mono oxblood eyebrow, with `N specialists on duty` on the right. Broadsheet rule pair (3px ink + 1px) below.
- **Display title** preserves the existing copy: "Request specialist support." with the period as `italic-ox`.
- **Specialist availability strip** sits under the masthead — small avatar row + verified badge, no glass pill.
- **Three numbered sections** (§ 01 Reporter / § 02 Crisis details / § 03 How should we contact you?), each with a hairline rule and inset content.
- **Seven numbered fields** (№ 01–07) using the `.f-row` vocabulary. Required-field asterisks in oxblood.
- **Crisis type** (was a select) → radio cluster with ink dots — quicker to scan.
- **Urgency** (was a select) → segmented control with the Emergency option styled oxblood (the alarm color).
- **Contact method** (was a select) → segmented ink control.
- **Auth gating banners** use the `.news-notice tone="brass"` class instead of inline amber styling.
- **Privacy notice** uses `.news-notice tone="info"`.
- **Submit button** uses `NewsButton` with `Send` + `ArrowRight` icons. Disabled states unchanged.
- **Success state** uses the design's "Your request is on the desk." pattern: file reference (`SP-2026-NNNN`), filed-at timestamp, type, urgency in a paper-soft notice box with oxblood left rule. Asterism divider. Hand-drawn links back to dashboard / crisis steps.

All Firebase service calls (`createSupportRequest`, `listApprovedSpecialists`), auth gating, verification flow, and emergency-contact footer are unchanged.

### 24.1.5 Bundle deltas

| Chunk | Before P24 | After P24.0 (Settings) | After P24.1 (RequestSupport) |
|---|---|---|---|
| Global CSS | 105.03 kB / 17.60 kB gzip | 108.17 / 18.10 | 109.74 / 18.33 |
| Settings | 14.94 / 3.42 | 12.13 / 3.56 | (unchanged) |
| RequestSupport | 12.89 / 3.26 | (unchanged) | 11.69 / 3.79 |
| Resources | 23.27 / 7.11 | 20.89 / 6.44 | (unchanged) |
| NewsPage (shared) | — | 3.34 / 1.17 | 3.35 / 1.18 |

Both rewrites SHRANK their page chunks net of imports. Resources also shrank because its editorial primitives now live in the shared chunk. Global CSS picked up ~4.7 kB raw / 0.7 kB gzip for the new tokens, classes, and notice variants — paid once, reused by every editorial page.

### 24.1.6 Pages still on the legacy "newsroom dark" system

Remaining: Source Protection, Security Score, Secure Setup, Community, Specialist Dashboard, Admin, CrisisOverlay. Each follows the same approach now: NewsPage shell + Tailwind tokens + editorial classes + editorial primitives, with sentence case copy.

---

**Last Updated**: May 15, 2026
**Version**: 3.9.1
**Documentation**: Complete (includes Phases 1-24.1)
