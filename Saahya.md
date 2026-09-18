# Saahya — authentication handover

## Scope

Branch: `feat/auth-service`

This handover covers authentication work completed in mock mode. The project must remain on `VITE_USE_MOCK=true` until the backend is deployed and Utku confirms the real authentication contract.

## Completed work

- Added the shared authentication contract in `src/types/auth.ts`:
  - `Role` — `owner` or `renter`.
  - `User` — `id`, `name`, `email`, and `role`.
  - `AuthService` — the required `signUp`, `signIn`, `signOut`, `getCurrentUser`, and `getToken` methods.
  - `AuthError` — a shared error type for user-readable authentication failures.
- Added `src/services/mock/authMock.ts` with asynchronous mock registration, login, validation, duplicate-email handling, mock token creation, session restoration, and sign-out.
- Added `src/services/real/authReal.ts` as the real API adapter boundary for the documented `/auth/register` and `/auth/login` routes. It is not production-ready or tested because the API is not deployed and the final authentication contract is still pending.
- Added `src/services/authService.ts`, which selects the mock or real adapter from `VITE_USE_MOCK`.
- Added `src/store/authStore.ts` for the current user, hydration, loading, errors, sign-up, sign-in, and sign-out.
- Added session hydration when the application starts.
- Implemented `LoginPage.tsx` with email/password fields, loading feedback, invalid-credential feedback, and a post-registration success message.
- Implemented `RegisterPage.tsx` with name, email, password, password confirmation, role selection, validation, loading feedback, and recoverable errors.
- Added protected routes for the dashboard and inspection routes.
- Added public-only behavior for login and registration, so an authenticated user is redirected to the dashboard.
- Added sign-out to the authenticated top navigation.
- Kept authentication pages outside the dashboard shell and bottom navigation.

## Mock storage and behavior

Only the mock adapter uses `localStorage`, as required by the team plan. It stores mock account records, the current mock user, and the mock token under `assettrace.mock.*` keys.

The mock adapter does not call AWS, Cognito, API Gateway, S3, or any other backend service. Passwords are stored only as part of the local mock account data for local development and must not be treated as production storage.

## Mock test steps

1. Keep `VITE_USE_MOCK=true` in `.env.local`.
2. Run `npm run dev` and open the Vite URL.
3. Open `/dashboard` while signed out. Confirm it redirects to `/login`.
4. Open `/register` and create an account with a password of at least eight characters.
5. Confirm the registration success message appears on `/login`.
6. Log in with the new account and confirm `/dashboard` opens.
7. Refresh the browser and confirm the mock session is restored.
8. Open an inspection route while signed out after signing out. Confirm it redirects to `/login`.
9. Try an invalid password and confirm a readable error appears.
10. Try registering the same email again and confirm the duplicate-account error appears.
11. Use the top-right sign-out control and confirm the app returns to `/login`.
12. Check the mobile layout at 375px and 390px.
13. Run `npm run build` and `npm run lint`.

## Real-mode status and confirmed backend information

The repository documentation currently confirms the following:

- The intended application stack includes Cognito and API Gateway.
- The documented public routes are `POST /auth/register` and `POST /auth/login`.
- The login endpoint is intended to return Cognito access, ID, and refresh tokens.
- Authenticated API requests are documented to use `Authorization: Bearer <Cognito access token>`.
- Backend errors are documented as `{ "error": { "code": "...", "message": "..." } }`.
- The Cognito pool, app client, and related AWS resources have been verified, but no Lambda functions or API Gateway API exist yet.
- The API base URL has not been published, so `VITE_USE_MOCK=false` cannot be used for browser integration testing.

Based on this documentation, the likely production arrangement is Cognito for user/token operations with API Gateway/Lambda for application authentication endpoints and protected application data. The exact frontend integration model still needs confirmation from Utku; this is not being treated as finalized.

## Integration questions and blockers

These items are intentionally recorded as unresolved rather than guessed:

1. **Registration confirmation:** `Utkrisht.md` says registration may require Cognito email confirmation depending on the user-pool configuration. Confirm whether the deployed pool requires confirmation and what UI state should be shown.
2. **Token exposed as `token`:** The backend documentation identifies the Cognito access token as the bearer token for protected API requests. Confirm that the facade's `token` field should contain the access token, not the ID token or refresh token.
3. **Refresh-token persistence:** The backend contract says login returns a refresh token, but the frontend persistence and renewal behavior are not defined. Confirm whether Amplify/Cognito manages the session or whether the API adapter must persist and refresh tokens itself.
4. **Error handling:** The documented error shape includes both `code` and `message`. The current real adapter displays the human-readable message but does not yet expose or map error codes. Confirm the final codes and the required UI behavior for them.
5. **Real adapter configuration:** The team plan requires the real mode to use the provided Cognito pool/client configuration. Confirm whether the final implementation should use Cognito directly through Amplify, API Gateway only, or a combination of both.
6. **Deployment gate:** Do not enable or test real mode until Utku publishes the API base URL, exact request/response contract, token handling rules, callback/confirmation behavior, and browser integration instructions.

## Validation result

The current implementation passes:

```text
npm run build
npm run lint
```

No real AWS or API calls were made during this work.
