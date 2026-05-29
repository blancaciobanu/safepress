# SafePress Architecture Review

## Current Reality

SafePress is a client-rendered React/Vite application backed by Firebase.

The app uses:

- Firebase Authentication for identity and email verification
- Cloud Firestore for the database
- Firestore security rules for primary data authorization
- Firebase Cloud Functions v2 for AI calls and privileged verification/admin workflows
- Firebase Hosting configuration for deployment headers and rewrites

This is not a traditional custom backend such as Express, Fastify, or Rails. It is now more than frontend-only Firebase, though: `functions/index.js` provides a small trusted server-side layer for Anthropic requests, specialist verification review, dossier submission, and admin-claim management.

## Current Cleanup Status

The project has moved meaningfully toward a feature-based structure:

- `src/features/community/services/communityService.js`
- `src/features/support/services/supportService.js`
- `src/features/admin/services/adminService.js`
- `src/features/users/services/userService.js`
- `src/features/ai/services/aiService.js`
- `src/features/notifications/services/notificationService.js`
- `src/features/home/services/homeService.js`
- extracted static data modules for resources, setup tasks, threat model options, and support constants
- extracted UI pieces such as `CommentCard` and `SetupWorkbenchCards`

This made the codebase cleaner and easier to explain, but it is not fully streamlined yet. Several page components still own a lot of rendering, form state, and orchestration logic.

## Backend And Database

SafePress has a backend-as-a-service architecture with a small serverless layer.

Firebase responsibilities:

- **Auth**: user sessions, email verification, custom claims
- **Firestore**: persisted app data
- **Rules**: document-level authorization
- **Functions**: server-side Anthropic calls and privileged workflows

Main Firestore collections:

- `users`
- `public-profiles`
- `community-posts`
- `community-reports`
- `support-requests`
- `support-request-queue`
- `support-requests/{requestId}/messages`
- `community-posts/{postId}/comments`

Callable functions:

- `setAdminClaim`
- `reviewSpecialistVerification`
- `submitSpecialistVerificationDossier`
- `draftSupportRequest`
- `generateAiAdvisorReply`
- `generateThreatModel`

## What Is Working Well

- The product has a clear dissertation story: journalist safety, source protection, crisis support, community, and AI assistance.
- Firebase is a reasonable stack for this stage because auth, persistence, rules, hosting, and serverless functions stay inside one ecosystem.
- The most sensitive AI integration is no longer client-side; API secrets live in Cloud Functions.
- Specialist verification has moved toward server-validated workflows.
- Public and private user data are separated through `users` and `public-profiles`.
- Support requests are split into private request details and a redacted specialist queue.
- Route-level lazy loading and vendor chunking keep the frontend deployable despite many feature surfaces.
- Lint and production build currently pass.

## Remaining Architectural Limits

### Large Page Components

The biggest remaining cleanliness issue is component size. Several pages are still large enough that they are hard to scan quickly:

- `RequestSupport.jsx`
- `ThreatModel.jsx`
- `AdminDashboard.jsx`
- `SpecialistDashboard.jsx`
- `SpecialistCaseFile.jsx`
- `CommunityPostDetail.jsx`
- `Settings.jsx`
- `SecureSetup.jsx`

These are not automatically bad, but they are the clearest next place to streamline.

### Some Direct Firestore Work Remains In Pages

Most new work flows through feature services, but a few pages still import Firestore directly, especially older account/setup/score surfaces. Moving those reads and writes into services would make the architecture more consistent.

### Some Client-Driven Aggregates Remain

The current model still uses client-managed fields for things like likes, cached counts, and some timestamps. Firestore rules constrain these, but server-owned aggregation would be stronger if the app grew beyond dissertation scope.

### Hook-Rule Suppressions Exist

The repo now passes ESLint, but there are still a handful of targeted `eslint-disable` comments around hook/purity rules. These should be treated as known cleanup markers, not as hidden failures.

## Security Posture

The current security model is credible for the project stage:

- private `users` documents are owner/admin scoped
- public display fields live in `public-profiles`
- email verification gates community posting/reporting and confidential support submission
- approved specialists can read the redacted support queue
- full support request details are available only after claim
- admin paths rely on a verified-email admin custom claim
- AI requests are server-side and apply redaction before provider calls

Future hardening would focus on moving more support workflow transitions and aggregates into Cloud Functions for stronger auditing and server-owned timestamps.

## Recommended Next Cleanup

1. Split the largest pages into smaller feature components.
2. Move remaining page-level Firestore calls into feature services.
3. Replace remaining hook-rule suppressions with extracted components/hooks where practical.
4. Add automated tests for support request creation, specialist claim/resolve, community posting/reporting, and AI redaction helpers.
5. Consider Cloud Function ownership for claim/resolve and moderation actions if the app needs a stricter audit trail.

## Bottom Line

SafePress is much cleaner than the earlier prototype state. It now has a real feature-service layer, a small serverless backend, stronger Firebase rules, and a clearer public/private data split.

It is not fully streamlined yet. The next improvements are not a rewrite; they are targeted decomposition and test coverage around the largest, most security-sensitive workflows.
