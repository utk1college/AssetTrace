# Saahya — authentication handover

## Completed

- Added shared authentication types and service contract.
- Added mock registration, login, session persistence, validation, and sign-out.
- Added the environment-selected authentication facade.
- Added a real API adapter boundary for `/auth/register` and `/auth/login` without enabling real mode.
- Added the Zustand authentication store and startup session hydration.
- Implemented login and registration pages with validation, loading, and recoverable errors.
- Added protected and public-only route guards.
- Added sign-out from the authenticated top navigation.
- Kept authentication pages outside the dashboard shell/navigation.

## Mock test steps

1. Keep `VITE_USE_MOCK=true` in `.env.local`.
2. Run `npm run dev`.
3. Open `/dashboard`; it should redirect to `/login`.
4. Register an account with a password of at least eight characters.
5. Log in and confirm `/dashboard` opens.
6. Refresh and confirm the mock session remains active.
7. Sign out from the top-right control and confirm `/login` opens.
8. Try an invalid password and confirm a readable error appears.

## Integration questions

- Confirm whether production authentication is direct Cognito, API Gateway, or a combination.
- Confirm whether registration requires email confirmation.
- Confirm which returned Cognito token should be exposed as `token`.
- Confirm refresh-token persistence and the final backend error contract before enabling real mode.
