# SafePress

> Digital safety platform for journalists - Master's Dissertation Project

![React](https://img.shields.io/badge/React-19.2.0-blue)
![Firebase](https://img.shields.io/badge/Firebase-10.x-orange)
![Vite](https://img.shields.io/badge/Vite-7.3.1-purple)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Visit `http://localhost:5174` in your browser.

## ✨ Features

- ✅ **Security Quiz** - 25-question assessment (0-100% score)
- ✅ **Personalized Dashboard** - Score history & smart recommendations
- ✅ **Crisis Mode** - Emergency guidance for 4 scenarios
- ✅ **User Authentication** - Secure login/signup with Firebase
- ✅ **Settings Page** - Profile management & password change
- ✅ **Protected Routes** - Dashboard & Settings require login
- ✅ **Data Persistence** - Quiz results saved to Firestore

## 📁 Project Structure

```
safepress/
├── src/
│   ├── components/       # Reusable components
│   │   ├── layout/      # Header, Footer, MainLayout
│   │   └── ProtectedRoute.jsx
│   ├── contexts/        # AuthContext (global state)
│   ├── firebase/        # Firebase configuration
│   ├── pages/           # Route pages
│   │   ├── Dashboard.jsx
│   │   ├── SecurityScore.jsx
│   │   ├── Settings.jsx
│   │   ├── CrisisMode.jsx
│   │   ├── Login.jsx
│   │   └── Signup.jsx
│   ├── App.jsx          # Route definitions
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
└── TECHNICAL_DOCUMENTATION.md  # Full technical guide
```

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Framer Motion
- **Backend**: Firebase (Auth + Firestore)
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Design**: Editorial Bauhaus, lowercase aesthetic

## 🎯 Key Pages

| Page | Route | Protected | Description |
|------|-------|-----------|-------------|
| Home | `/` | No | Landing page |
| Dashboard | `/dashboard` | Yes | User dashboard with scores |
| Security Quiz | `/security-score` | No | 25-question assessment |
| Crisis Mode | `/crisis` | No | Emergency guidance |
| Settings | `/settings` | Yes | Profile & password management |
| Login | `/login` | No | User authentication |
| Signup | `/signup` | No | Account creation |

## 🔐 Firebase Setup

1. Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create Firestore Database (test mode)
4. Copy config to `src/firebase/config.js`

## 📊 Data Structure

### User Document (`users/{uid}`)
```json
{
  "email": "user@example.com",
  "displayName": "Jane Doe",
  "createdAt": "2026-02-12T...",
  "lastQuizDate": "2026-02-12T...",
  "securityScores": [
    {
      "score": 75,
      "completedAt": "2026-02-12T...",
      "categoryScores": {
        "password": { "percentage": 80, ... },
        "device": { "percentage": 70, ... }
      }
    }
  ]
}
```

## 🎨 Design System

- **Colors**: Crimson (alerts), Midnight Blue (primary), Olive (success)
- **Typography**: Red Hat Display + Inter
- **Style**: Lowercase text, glass morphism, editorial layout

## 📖 Documentation

See [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md) for:
- Complete architecture overview
- Authentication flow diagrams
- Component organization
- Development guide
- Troubleshooting

## 🧪 Testing User Flow

1. **Sign up**: Create account at `/signup`
2. **Take quiz**: Complete security assessment
3. **View dashboard**: See personalized score & recommendations
4. **Update settings**: Change password or view profile
5. **Retake quiz**: See score history

## 📝 Common Tasks

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

### Access current user
```javascript
import { useAuth } from './contexts/AuthContext';

const { user, loading } = useAuth();
```

### Save to Firestore
```javascript
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase/config';

await updateDoc(doc(db, 'users', userId), data);
```

## 🐛 Troubleshooting

- **Port in use**: Vite will auto-select another port
- **Firebase errors**: Check console for auth/firestore errors
- **Blank page**: Check browser console for errors

## 📄 License

Educational project - Master's Dissertation
Not for commercial use

---

**Built with**: React + Firebase + Claude Code
**Purpose**: Journalist digital safety education
**Year**: 2026
