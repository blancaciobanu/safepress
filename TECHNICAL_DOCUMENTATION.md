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
│  │  - Session mgmt  │      │  Security rules active  │  │
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
    function isOwner(userId) { return isAuth() && request.auth.uid == userId; }
    function isAdmin() {
      return isAuth() && request.auth.token.email in ['ciobanubianca20@stud.ase.ro'];
    }

    // Users: owner + admin access only
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isOwner(userId);
    }

    // Community posts: public read, authenticated write
    match /community-posts/{postId} {
      allow read: if true;
      allow create: if isAuth() && request.resource.data.authorId == request.auth.uid;
      allow update: if isAuth();
      allow delete: if isAdmin();
    }
  }
}
```

### Firestore Indexes
File: `/firestore.indexes.json` — composite index for admin queries:
- `users` collection: `accountType` + `verificationStatus` (for Admin Dashboard)

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
│   ├── utils/
│   │   └── userUtils.js             # Anonymous identity generation
│   │
│   ├── pages/
│   │   ├── Home.jsx                 # Landing page
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
  realName: userData.realName,
  createdAt: ISO string,
  securityScores: [],
  accountType: 'journalist' | 'specialist',
  // + specialist fields if applicable
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
  realName: string,                 // Private, for account recovery only
  createdAt: string (ISO 8601),     // Account creation timestamp
  accountType: 'journalist' | 'specialist',

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
  verificationStatus: 'pending' | 'approved' | 'rejected',
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
  comments: [                       // Embedded array
    {
      authorId, authorName, authorIcon, authorType,
      isVerified, content, createdAt
    }
  ],
  resolved: boolean                 // Q&A posts only
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
- Compact header with avatar + username
- Two side-by-side metric cards:
  - **Security Score**: Last score with mini category progress bars
  - **Secure Setup**: Progress bar showing X/31 completed tasks
- **"Up Next" section**: Smart recommendations sorted by weakest quiz categories, prompts for untaken quiz/unstarted setup, "lessons — coming soon" placeholder
- Compact quick link pills (crisis mode, resources, community, settings)

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
- Expandable accordion cards
- Color-coded OS badges
- Exact menu paths for each step
- Checklist format (future: track completion)
- "Coming Soon" placeholders for AI Security & Tools tabs

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

---

**Last Updated**: February 13, 2026
**Version**: 3.0.0
**Documentation**: Complete (includes Phases 1-14)
