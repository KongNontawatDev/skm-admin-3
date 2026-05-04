# SKM Admin 3 - Development Rules

Updated: 2026-05-01

## UI Rules

- Keep admin screens compact, scannable, and work-focused.
- Use existing shadcn/Radix components and table patterns.
- Prefer filters, tabs, tables, dialogs, and forms over decorative layouts.
- Do not add marketing-style heroes or customer-facing copy to admin pages.
- Use icons for compact actions where the meaning is familiar.

## Auth and Security

- Use the existing Better Auth client and protected route flow.
- Do not rely on client-only permission checks for sensitive operations.
- Let the API enforce staff authorization.
- Do not expose tokens, cookies, or secret configuration in UI logs/errors.

## API Usage

- Use `src/lib/api.ts` for API requests.
- Keep `X-Client-App: skm-admin-3`.
- Keep admin API changes coordinated with `skm-easy-api-v3`.
- Handle optional/null fields defensively.

## CMS and Uploads

- Use `src/lib/cms-upload.ts` for CMS uploads.
- Compress images through `src/lib/image-compression.ts` before upload.
- Rich text content should remain compatible with the API sanitizer/storage expectations.

## Verification

Run after meaningful changes:

- `npm run build`
- `npm run lint` when code style or broad files changed

Use browser testing for admin sign-in, CMS upload, support ticket updates, and log viewer changes.

