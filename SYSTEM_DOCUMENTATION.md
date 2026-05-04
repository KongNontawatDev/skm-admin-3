# SKM Admin 3 - System Documentation

Updated: 2026-05-01

## Runtime

`skm-admin-3` is a static Vite React backoffice app. In local development it normally runs at:

```text
http://localhost:5174
```

## Environment

Important environment values:

- `VITE_API_BASE_URL`
- any public admin client integration keys

Frontend environment values are visible in the browser. Do not place private secrets in them.

## Routing

Routes are implemented with TanStack Router under `src/routes`. Authenticated admin areas must continue to use the current auth guard flow.

## Build and Deploy

Common commands:

- `pnpm install` or the package manager configured by the deployment environment
- `npm run dev` or `pnpm dev`
- `npm run build` or `pnpm build`
- `npm run preview` or `pnpm preview`

The production build outputs static files to `dist`. The `postbuild` script copies `.htaccess` when present.

## Operational Notes

- API and admin app origins must be allowed by API CORS/cookie settings.
- Log viewer should stay bounded and filter-driven.
- CMS upload behavior depends on both browser compression and API compression.
- Admin auth should be smoke-tested after deploy.

