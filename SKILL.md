# SKM Admin 3 AI Skill

Use this skill when working on `skm-admin-3`.

## First Steps

1. Inspect the current route, feature, and API client involved in the request.
2. Read `CODE_FLOW.md` for file-level flow, imports, exports, and function input/output before broad changes.
3. Check `skm-easy-api-v3` before changing admin API assumptions.
4. Preserve the dense operational backoffice style.

## Hard Rules

- Do not add direct database access.
- Do not expose secrets in frontend code.
- Do not bypass Better Auth/admin protected route behavior.
- Do not load unbounded production logs into the browser.
- Keep `X-Client-App: skm-admin-3`.

## Preferred Patterns

- TanStack Router routes under `src/routes`.
- TanStack Query for server state.
- TanStack Table for list-heavy operational screens.
- Existing shadcn/Radix components.
- API requests through `src/lib/api.ts`.
- CMS uploads through `src/lib/cms-upload.ts`.
- Browser image compression through `src/lib/image-compression.ts`.

## Verification

Run after meaningful changes:

- `npm run build`
- `npm run lint` when broad UI/code style changes are involved

Use browser testing for sign-in, CMS upload, support ticket operations, and log viewer changes.
