# SafePress Architecture Review

## What SafePress is today

SafePress is currently a **client-side React application** built with Vite.

The app uses Firebase for:

- Authentication via Firebase Auth
- Data storage via Firestore
- Access control via Firestore security rules

There is **no custom backend/server in this repository**.

That means:

- the browser talks directly to Firebase
- your React code contains both UI logic and most app/business logic
- Render, if you used it, is most likely just hosting the built frontend assets

## Current cleanup status

The project now has the beginning of a **feature service layer**:

- `src/features/community/services/communityService.js`
- `src/features/support/services/supportService.js`
- `src/features/admin/services/adminService.js`
- `src/features/users/services/userService.js`

This does not add a new backend by itself, but it is a strong organizational step because Firestore access is no longer only embedded inside large page files.

## Do I have a backend?

Yes, but not in the traditional sense.

You have a **backend-as-a-service** setup:

- Firebase Auth acts as your authentication backend
- Firestore acts as your database
- Firestore security rules act as part of your authorization layer

You do **not** currently have:

- a custom Node/Express/Fastify server
- server-side API routes
- server-side admin jobs
- server-side secret handling beyond what Firebase provides

## Do I have a database?

Yes.

Your database is **Cloud Firestore**, which is a NoSQL document database.

Based on the codebase, the main collections are:

- `users`
- `public-profiles`
- `community-posts`
- `community-reports`
- `support-requests`

## What is working well

- Clear product direction: safety, support, education, community
- Good amount of real functionality for a dissertation project
- Firebase is a reasonable choice for an early-stage app
- Authentication and persistence are already real, not mocked
- The project is deployable without a large ops burden

## Current architectural limits

### 1. Frontend and app logic are too mixed together

Large page components currently handle:

- rendering
- form state
- Firestore reads/writes
- role checks
- sorting/filtering
- moderation/support workflow behavior

This makes the project harder to reason about and harder to extend safely.

### 2. Firestore rules are much stronger now, with a few honest tradeoffs left

The highest-risk areas are no longer relying on the frontend alone:

- private `users` reads are now owner/admin only
- public-facing cross-user reads now use `public-profiles`
- only approved specialists can claim support requests
- only the assigned specialist can resolve them
- only the requester can leave feedback
- admin verification updates are now much narrower
- community comments now live in a subcollection, which made post-update rules far more specific

The main remaining tradeoffs are now smaller:

- community likes and cached `commentCount` are still client-driven updates, even though they are much more constrained than before
- admin authorization still has a verified-email fallback list until custom claims are fully provisioned server-side
- there is no server-side trusted aggregation yet for public specialist stats such as ratings/case counts

Important new improvements since the earlier review:

- support requests are now split into a private `support-requests` collection and a redacted `support-request-queue`
- email/password accounts must verify email before community posting/reporting or confidential support requests
- admin checks are centralized in the app and rules, with optional custom-claim support already wired in
- Firebase Hosting security headers are configured in `firebase.json`
- Firebase App Check initialization is scaffolded and ready for a production reCAPTCHA site key

This is a strong Firebase-only architecture for the current stage, even though it is not the final possible security model.

### 3. Some data modeling choices still deserve future attention

Current patterns include:

- fetching full collections and sorting/filtering in the client
- using client-generated ISO timestamps instead of server timestamps

These are simple and fine early on, but they become awkward for moderation, pagination, analytics, and consistency.

### 4. Admin and privileged behavior is partly client-defined

Admin checks exist both in Firestore rules and in client routing.

That is okay for UI gating, but the sensitive operations should rely on server-trustable authorization first, not primarily frontend checks.

## Would you benefit from a backend?

### Short answer

You do **not need a traditional backend yet** to make SafePress better.

You would benefit more immediately from:

1. tightening Firebase rules
2. reorganizing frontend code
3. improving Firestore data modeling
4. introducing a **small server-side layer only where it adds real value**

### When a backend becomes useful

Add a backend layer when you need things like:

- trusted moderation actions
- email notifications
- scheduled jobs/reminders
- analytics aggregation
- secure API integrations
- privileged workflows that should never be client-controlled
- safer specialist verification/admin tooling

### Best next step instead of a full backend

If you want server-side power without a full rewrite, the best next step is:

- keep React as the frontend
- keep Firebase Auth and Firestore
- add **Firebase Cloud Functions** or **Firebase-hosted server endpoints** for privileged actions

That gives you a real backend story without making the project much heavier.

## Recommended target architecture

### Keep

- React + Vite
- Firebase Auth
- Firestore

### Add

- a small service layer in the frontend
- stricter Firestore rules
- optionally Cloud Functions for admin/moderation/notification tasks

### Organize the frontend like this

```text
src/
  app/
    router.jsx
    providers.jsx
  components/
  features/
    auth/
      components/
      hooks/
      services/
    community/
      components/
      hooks/
      services/
    support/
      components/
      hooks/
      services/
    dashboard/
      components/
      hooks/
    admin/
      components/
      hooks/
      services/
  lib/
    firebase/
      config.js
      auth.js
      firestore.js
  pages/
  styles/
```

This is much easier to explain in a dissertation because each feature owns its logic.

## Most important cleanup priorities

### Priority 1: Fix authorization model

Tighten Firestore rules so that:

- users can only update the fields they should control
- only post authors can edit their own posts
- only comment authors can change/delete their own comments
- only verified specialists can claim support requests
- only the assigned specialist or requester can update certain support fields
- only admins can perform admin/moderation actions

### Priority 2: Move Firebase calls out of page components

Create small modules such as:

- `src/features/community/services/communityService.js`
- `src/features/support/services/supportService.js`
- `src/features/admin/services/adminService.js`

Then your pages become thinner and easier to maintain.

### Priority 3: Improve data modeling

Good next changes after the current refactor:

- use `serverTimestamp()` for authoritative times
- add a lightweight migration/backfill strategy for older users/posts
- separate sensitive specialist verification fields from broadly readable profile data even more explicitly if the app grows

### Priority 4: Separate public vs private user data

Right now the app reads user documents broadly.

A cleaner model would be:

- `users/{uid}` for private account data
- `public-profiles/{uid}` for safe public display info

That makes privacy and community profile rendering much cleaner.

### Priority 5: Add one small backend capability

To make the project feel more impressive without overbuilding, add one of:

- Cloud Function for support-request claiming/resolving with validation
- Cloud Function for report moderation workflow
- Cloud Function for notification emails when a request is claimed
- Cloud Function to generate simple admin analytics

One strong server-side workflow is usually more impressive than a large but loosely controlled frontend.

## What would make the project feel cleaner and more impressive

Focus on three qualities:

### 1. Stronger trust model

Examiners and technical reviewers notice when sensitive actions are properly controlled.

### 2. Better structure

Feature folders, service modules, and clearer data ownership make the project look intentional.

### 3. One or two polished “serious” workflows

Examples:

- specialist verification with audit trail
- crisis support triage with assignment + status history
- moderation queue with reports and resolution reasons

These make the app feel like a real platform, not just a UI showcase.

## Suggested next milestone

If you want the highest-value cleanup before adding new features:

1. Refactor Firebase operations into feature services
2. Tighten Firestore rules around posts, support requests, and admin actions
3. Split public profile data from private user data
4. Move comments into a subcollection
5. Add one Cloud Function for a privileged workflow

That would keep the stack simple while making the architecture much more credible.

## Bottom line

You are not stuck because the idea is weak.

You are at the normal point where a prototype has enough features that it now needs:

- clearer boundaries
- stricter data/security rules
- a little less page-level complexity
- one small server-side layer for trust-critical actions

SafePress already has the foundation of a real app. The best move now is not a rewrite. It is a cleanup pass that turns the current prototype into a more structured platform.
